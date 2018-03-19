import React, { Component } from 'react'
// import { Button } from 'reactstrap'

export class Input extends Component {

  constructor(props) {
    super(props)
    console.log('Input const', this.props)

    // this.should embrace the Form's managed props
    this.disallowedProps = [
      'validators', 'required', 'email', 'pattern', 'assertTrue', 'assertFalse', 'match'
    ]
  }

  getFilteredProps(props) {
    const filteredProps = {}
    for (let i in props) {
      if (this.disallowedProps.indexOf(i) === -1) {
        filteredProps[i] = props[i]
      }
    }
    return filteredProps
  }

  render() {
    console.log('Input render', this.props)
    const filteredProps = this.getFilteredProps(this.props)
    return (
      <input {...filteredProps} />
    )
  }

}

// From attributes
// state={this.state} control={this} is required to update this.state 
// initState={{formControls : { user : {value : 'John Doe' , touched : false }}}} is optional... redux를 사용하여 초기화 할 수 있을 것입니다.

// common
// issue 0 : react 공식문서 학습이 70%정도 밖에 되지 않으므로, 모두 학습 후 개선 또는 다시 작성한다.
// issue 0 : 배포와 라이선스에 관해 상의해야한다.

// major
// issue 1 : this.ready등을 제거하기 위해 'export default ready(component)' 방식으로 변경할지 생각 중
// issue 1 : customizing 혹은 logging을 위해 다양한 hook을 제공해야한다. promise의 대부분 stack에서 logging할 수 있도록 할 것이다.
// issue 1 : html5의 모든 스펙을 구현해야한다. (radio, checkbox, range, textarea, select, contenteditable, submit action async ...)
// issue 1 : 동적인 필드 추가 등, 타 api들의 재미있는 UI를 구현해야한다.
// issue 1 : unmount상태에서 async process에서의 exception에 대비 해야한다.
// issue 1 : ref의 가용성에 관해 알아보아야 한다. 
// issue 1 : constructor에서 meta를 얼마나 더 수집해야하는가. 예) name을 수집하면 injectFunctionsToSuper등에서 활용할 수 있다
// issue 1 : built-in input에 관해서는 constructValidators에서 built-in attribute 이외의 것들만 build하도록 변경하여야한다.
// issue 1 : uncontrolled component 디자인 구상, ref? no? ex) type="file" 

// minor
// issue 2 : validator name에 reserved words(match 등)를 검사해야한다. 중복검사도 해야한다.
// issue 2 : suppressBuiltInValidation 구현, Input은 default true, input은 default false 
// issue 2 : initState에 touched를 assign
// issue 2 : reset 하면 this.ready && this.formContols.password.value등이 버그가 난다.
// issue 2 : async를 init에도 수행
// issue 2 : async name 중복 체크, throw new Error

// extra
// issue 9 : PureComponent와 immutability, nested default, Object.assign 재고
// issue 9 : componentDidCatch 사용성 테스트, 좋은 인터페이스인가
// issue 9 : dev logging 구현


export default class Form extends Component {

  constructor(props) {
    super(props)

    const control = this.props.control

    this.defaultState = {
      submitting: false,
      pristine: true,
      formControls: {},
      config: { // 모든 구현은 나중으로 미룸. // 이 설정들을 그냥 hook으로 제공하는 것이 더 좋을지도 모른다는 생각이 든다. 원하는 필드에만 설정을 적용하고 싶을 수도 있기 때문에?
        asyncValidateOnChange: false,
        asyncValidateOnBlur: true, // submit에서는 idle asyc validation을 모두 수행하는 것이 당연하다.

      },
    }

    // lifting properties
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleAfterSubmitCompletion = this.handleAfterSubmitCompletion.bind(this)
    this.initialize = this.initialize.bind(this)
    this.injectFunctionsToSuper = this.injectFunctionsToSuper.bind(control)

    this.managedProps = ['required', 'email', 'pattern', 'assertTrue', 'assertFalse', 'match']

    const allInputs = this.readAllInputs(this)

    control.syncValidators = {}
    control.asyncValidators = {}

    for (let i in allInputs) {
      this.constructValidators(allInputs[i], control.syncValidators, control.asyncValidators)
    }
    console.log('syncValidators', control.syncValidators)
    console.log('asyncValidators', control.asyncValidators)

    this.injectFunctionsToSuper()

  }

  // 이 함수는 this.props.control에 bind되어 있습니다.
  // 상위 컴포넌트에 아래의 함수들을 정의합니다. 이 함수들을 이용하여 JSX를 커스터마이징 할 수 있습니다. 
  // 상위 컴포넌트의 최초 1회 render보다 늦게 수행되므로, JSX expression에서 {this.ready && ...any }를 사용하여야 합니다. 
  injectFunctionsToSuper() {

    this.ready = true

    // this.state = this.state ? this.state.formControls ? this.state : Object.assign(this.state, { formControls: {} }) : { formControls: {} }

    this.setState({ formControls: {} })

    // const { state , state : { formControls } } = this  // formContols가 초기화 되어 대체되면

    // 정의되지
    this.getValue = function (name) {
      return (!this.state.formControls[name]) ? '' : this.state.formControls[name].value || ''
    }

    // this.state의 touched와 다른 점이 있다면, touch하지 않았어도 initState에 의해 값이 있으면 true를 리턴한다.
    this.isTouched = function (name) {
      if (!this.state.formControls[name]) {
        return false // null
      }
      return this.state.formControls[name].touched // === true ? true : false
    }

    // 해당 name을 가진 필드에 관해 sync validation을 수행
    // 값이 없어도 null을 리턴함을 주의
    this.syncValidate = function (name) {
      if (!this.state.formControls[name]) {
        return null
      }
      let ownValidators = this.syncValidators[name]
      if (ownValidators instanceof Array) {
        for (let i in ownValidators) {
          let ownValidator = ownValidators[i]
          if (ownValidator.regex && ownValidator.regex.test(this.getValue(name)) === (ownValidator.assertFalse || false)) {
            return ownValidator.name
          } else if (ownValidator.api && ownValidator.api(this.getValue(name)) === false) {
            return ownValidator.name
          }
        }
      }
      return null
    }

    this.syncValidateFull = function (name) {
      if (!this.state.formControls[name]) {
        return []
      }
      let validationResult = []
      let ownValidators = this.syncValidators[name]
      if (ownValidators instanceof Array) {
        for (let i in ownValidators) {
          let ownValidator = ownValidators[i]
          if (ownValidator.regex && ownValidator.regex.test(this.getValue(name)) === (ownValidator.assertFalse || false)) {
            console.log(ownValidator.name, ownValidator.regex)
            validationResult.push(ownValidator.name)
          } else if (ownValidator.api && ownValidator.api(this.getValue(name)) === false) {
            validationResult.push(ownValidator.name)
          }
        }
      }
      return validationResult
    }

    // 모든 필드가 sync valid한지 체크합니다.
    this.isSyncValid = function () {
      const formControls = this.state.formControls
      for (let i in formControls) {
        if (this.syncValidate(i) !== null) {
          return false
        }
      }
      return true
    }

    this.asyncValidate = function (asyncName, asyncApi, message = 'invalid (please specify a error message in your async validator)', owner) {
      console.log('asyncValidating', owner, asyncName)
      let promise = asyncApi()
      // console.log('xxxxxxx')
      this.setState((prev) => {
        return {
          asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'processing', promise, owner, value: prev.formControls[owner].value } }) // 같은 이름의 새로운 promise는 이전의 것을 덮어쓰고, 전의 것은 garbage collect됩니다.
        }
      })
      promise = promise.then((result) => {
        console.log('async validation result', asyncName, result)
        if (result === true) {
          this.setState((prev) => {
            if (prev.asyncValidations && prev.asyncValidations[asyncName] && prev.asyncValidations[asyncName].promise === promise) {
              return {
                asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: Object.assign(prev.asyncValidations[asyncName], { status: 'resolved' }) })
              }
            } else {
              console.log('It seems like a async validation has been overwritten by a new one or detached.')
            }
          })
          // console.log('promise passes', result, 'to', asyncName)
          // return asyncName // 이 값은 사용하지 않지만... 일단은 생각 중.... 
        } else if (result === false) {
          this.setState((prev) => {
            if (prev.asyncValidations && prev.asyncValidations[asyncName] && prev.asyncValidations[asyncName].promise === promise) {
              return {
                asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: Object.assign(prev.asyncValidations[asyncName], { status: 'rejected' }) })
              }
            } else {
              console.log('It seems like a async validation has been overwritten by a new one or detached.')
            }
          })
          // throw new Error(JSON.stringify({ asyncName, message }))
        } else {
          // throw new Error('async api should return a boolean')
        }
        return result // submit에서 사용하는데 boolean만 검사하면 되겠다
      })
    }

    this.asyncValidateByName = function (name) {
      console.log(name)
      if (this.asyncValidators && this.asyncValidators[name]) {
        for (let i in this.asyncValidators[name]) {
          let asyncValidator = this.asyncValidators[name][i]
          // console.log('xxxxxx', asyncValidator, name)
          this.asyncValidate(asyncValidator.name, asyncValidator.api, asyncValidator.message, name)
        }
      }
    }

    this.isAsyncValidating = function (name) {
      let asyncValidations = this.state.asyncValidations
      // console.log(this, asyncValidations)
      for (let i in asyncValidations) {
        // console.log('qdqwdqwqdwdqwwd', i, asyncValidations[i].owner, asyncValidations[i].status)
        if (asyncValidations[i].owner === name && asyncValidations[i].status === 'processing') {
          return true
        }
      }
      return false
    }

    // this.getAsyncError = function (name) {
    //   let asyncValidations = this.state.asyncValidations
    //   for (let i in asyncValidations) {
    //     if (asyncValidations[i].owner === name && asyncValidations[i].status === 'rejected') {
    //       return asyncValidations[i].name
    //     }
    //   }
    //   return null
    // }

    this.getAsyncErrors = function (name) {
      let result = []
      let asyncValidations = this.state.asyncValidations
      for (let i in asyncValidations) {
        if (asyncValidations[i].owner === name && asyncValidations[i].status === 'rejected') {
          result.push(i)
        }
      }
      return result
    }

    this.getAsyncStates = function (name) {
      let result = []
      let asyncValidations = this.state.asyncValidations
      for (let i in asyncValidations) {
        if (asyncValidations[i].owner === name) {
          result.push(asyncValidations[i].status)
        }
      }
      return result
    }

    this.isAsyncResolved = function (name) {
      let asyncValidations = this.state.asyncValidations
      let asyncValidators = this.asyncValidators[name]
      for (let i in asyncValidators) {
        if (!asyncValidations || !asyncValidations[asyncValidators[i].name] || asyncValidations[asyncValidators[i].name].status !== 'resolved') {
          return false
        }
      }
      return true
    }

    // this.isAsyncValid = function () {
    //   let asyncValidations = this.state.asyncValidations
    //   let asyncValidators = this.asyncValidators[name]
    //   for (let i in asyncValidators) {
    //     if (!asyncValidations || !asyncValidations[asyncValidators[i].name] || asyncValidations[asyncValidators[i].name].status !== 'resolved') {
    //       return false
    //     }
    //   }
    //   return true
    // }

    this.isAsyncResolvedOrProcessing = function (name) {
      let asyncValidations = this.state.asyncValidations
      let asyncValidators = this.asyncValidators[name]
      for (let i in asyncValidators) {
        if (!asyncValidations || !asyncValidations[asyncValidators[i].name] || asyncValidations[asyncValidators[i].name].status === 'rejected') {
          return false
        }
      }
      return true
    }
    this.isAllAsyncResolvedOrProcessing = function () {
      for (let i in this.asyncValidators) {
        if (this.isAsyncResolvedOrProcessing(i) !== true) {
          return false
        }
      }
      return true
    }
    this.getProcessingPromises = function () {
      let promises = []
      let asyncValidations = this.state.asyncValidations
      for (let i in asyncValidations) {
        if (asyncValidations[i].status === 'processing') {
          promises.push(asyncValidations[i].promise)
        }
      }
      return promises
    }
  }

  readAllInputs(component, chain = []) {
    if (typeof component !== 'object' || component === null) {
      return
    }
    if (component.type === 'input' || component.type === Input) {
      chain.push(component)
    }
    if (component.props) {
      let children = component.props.children
      if (children) {
        if (children instanceof Array) {
          React.Children.map(children, child => {
            this.readAllInputs(child, chain)
          })
        } else if (typeof children === 'object') {
          this.readAllInputs(children, chain)
        }
      }
    }
    return chain
  }

  getValidatorByName(name) {
    switch (name) {
      case 'required':
        return {
          name: 'required',
          regex: /.+/,
        }
      case 'email':
        return {
          name: 'email',
          regex: /^[\w]+@[\w.]*\w+$/,
        }
      default:
        return name
    }
  }

  constructValidators(input, syncValidators = {}, asyncValidators = {}) {
    const name = input.props.name
    if (!name) {
      console.log('This element does not have a name.', input)
      return
      // throw new Error('input elements or Input component should have a name')
    }

    let propsValidators = input.props.validators

    // validators={{ name : 'aaa', regex: /.../}} 등으로 Array가 아닐 경우 Array로 변경합니다.
    let originalValidators = typeof propsValidators === 'object' ? propsValidators instanceof Array ? propsValidators : [propsValidators] : []

    // validators attribute의 값들을 처리하여 내부 api를 구성합니다
    let validators = originalValidators.map((validator) => {
      if (typeof validator === 'object' && validator !== null && ('api' in validator || 'regex' in validator)) {
        return validator
      }
      if (typeof validator === 'string') {
        return this.getValidatorByName(validator)
      }
      return null
    })

    // validators에 존재하지 않거나 string으로 남겨져 있는 항목에 관해 attribute에 구현된 validator를 구성합니다. 
    for (let i in this.managedProps) {
      let validatorName = this.managedProps[i]
      let index = originalValidators.indexOf(validatorName)
      switch (validatorName) {
        case 'required':
          if (input.props.required && index === -1) {
            validators.unshift(this.getValidatorByName('required'))
          }
          break;
        case 'email':
          if (input.props.type === validatorName && index === -1) {
            validators.push(this.getValidatorByName(validatorName))
          }
          break;
        case 'pattern':
          if (input.props.pattern) {
            let patternValidator = {
              validatorName: validatorName,
              regex: input.props[validatorName],
            }
            if (index !== -1) {
              validators[index] = patternValidator
            } else {
              validators.push(patternValidator)
            }
          }
          break;
        case 'assertTrue':
          let assertTrue = input.props.assertTrue
          if (assertTrue) {
            if (index !== -1) {
              validators[index] = assertTrue
            } else {
              validators.push(assertTrue)
            }
          }
          break;
        case 'assertFalse':
          let assertFalse = input.props.assertFalse
          if (assertFalse) {
            if (assertFalse.api) {
              let copy = assertFalse.api
              if (assertFalse.async !== true) {
                assertFalse.api = () => { return !copy() }
              } else {
                assertFalse.api = () => { return copy().then((tf) => { return !tf }) }
              }
            } else if (assertFalse.regex) {
              assertFalse.assertFalse = true
            }
            if (index !== -1) {
              validators[index] = assertFalse
            } else {
              validators.push(assertFalse)
            }
          }
          break;
        case 'match':
          if (input.props.match) {
            let targetName = input.props.match
            let matchFunction = (function () {
              if (this.state.formControls[name] && this.state.formControls[targetName] && this.state.formControls[name].value === this.state.formControls[targetName].value) {
                return true
              } else {
                return false
              }
            }).bind(this.props.control)
            const matchValidator = {
              name: 'match',
              api: matchFunction
            }
            if (index !== -1) {
              validators[index] = matchValidator
            } else {
              validators.push(matchValidator)
            }
          }
          break;
        default:
      }
    }

    // 유효하지 않은 validation을 제거하고 async validation을 다른 변수로 할당시킵니다.
    let internalAsyncValidators = []
    let internalSyncValidators = validators.filter((validator) => {
      if (validator === null || typeof validator === 'string') // string은 vaidators attr에 명시했지만 존재하지 않는 validator입니다.
        return false
      if (validator.async === true) {
        internalAsyncValidators.push(validator)
        return false
      }
      return true
    })

    syncValidators[name] = internalSyncValidators
    asyncValidators[name] = internalAsyncValidators

    return [syncValidators, asyncValidators]
  }

  // Form component의 default설정에 initState attr로 정의된 state를 병합합니다.
  initialize(state) {
    this.props.control.setState((prev) => {
      for (let i in prev) {
        prev[i] = undefined
      }
      return Object.assign(prev, this.defaultState, state || this.props.initState || this.props.control.initState || this.props.resetState) // assign은 shallow하므로 defaultState와 initState에 관해서만 nested default로 변경할 예정
    })
  }

  componentDidCatch(error, info) {
    console.log('componentDidCatch', error, info)
  }

  componentDidMount() {
    this.initialize()
  }

  validate(name, value) {
    return { value }
  }

  validateAsync(name, value) {
    return { value, isValid: new Promise(() => { }) }
  }

  handleChange(e) {
    const { name, value } = e.target
    this.props.control.setState((prev, props) => {
      let formControls = prev.formControls || {}
      Object.assign(formControls, { [name]: Object.assign(formControls[name] || {}, { value }) })
      return {
        pristine: false,
        formControls
      }
    })
  }

  handleBlur(e) {
    console.log('Form BLUR')
    const { name } = e.target
    if (this.props.control.syncValidate(name) === null) {
      this.props.control.asyncValidateByName(name)
    } else {
      console.log(name, 'asyncvalidating is blocked by syncValidation')
    }
    // console.log('yyyyyyyy')
    this.props.control.setState((prev, props) => {
      let formControls = prev.formControls || {}
      Object.assign(formControls, { [name]: Object.assign(formControls[name] || {}, { touched: true }) })
      return { formControls }
    })
  }

  handleAfterSubmitCompletion(v) {
    console.log('Form submit post handler', v)
    switch (v) {
      // 어떠한 인터페이스를 구성할까
      default:
    }
    console.log('submitting set to false')
    this.props.control.setState({ submitting: false })
  }

  handleSubmit(e) {
    e.preventDefault()
    console.log('Form SUBMIT')
    if (this.props.control.isSyncValid() !== true) {
      console.log('submit denied by syncValidation')
      // set all touched
      return
    }
    if (this.props.control.isAllAsyncResolvedOrProcessing() !== true) {
      console.log('submit denied by idle asyncValidation ')
      return
    }

    this.props.control.setState({ submitting: true })

    const processingPromises = this.props.control.getProcessingPromises()

    if (processingPromises.length > 0) {
      return Promise.all(processingPromises).then((result) => {
        console.log('submit start after async validation with', result, 'of', processingPromises)
        // console.log('submit is scoped by', this)
        // console.log('submit with event', e)
        // 여기서 result를 검증해야한다.
        return this.props.onSubmit(e).then((res) => {  // this return value does not goes to the first argument of 'then'. this just continues the parents promise
          console.log('submit success with res', res)
          return res
        })
      }, (e) => {
        console.log('submit failure by async validation', JSON.parse(e.message))
      })
    } else {
      // async validation 이 없는 경우
      console.log('submit start with no async validation')
      return this.props.onSubmit(e).then(() => { console.log('submit success') })
    }

    // console.log('xxxxxxx promise', promise)
    // if (promise instanceof Promise) {
    //   promise.then((res) => {
    //     console.log('yyyyyyy res', res)
    //     this.handleAfterSubmitCompletion(res)
    //   })
    // } else {
    //   throw new Error('Form onSubmit should return a promise')
    // }
  }

  // containment로 정의된 자식에게 주입할 dependency와 value
  // 두번째 argument는 상위컴포넌트의 jsx에서 정의된 component이며, 그것의 props.value가 존재하면 그것을 사용하고 아니면 상위컴포넌트의 state에 control되도록 합니다.
  // formControl에 event attr 를 정의하더라도 아래 값이 그것을 덮어 쓰게 되는데, 그것들을 병합하는 코드를 구현하여야 합니다. 일단은 나중으로 미룸.
  getDependency(name, component) {
    let formControl = this.props.formControls ? this.props.formControls[name] : undefined
    let value = ('value' in component.props) ? component.props.value || '' : formControl ? formControl.value || '' : ''
    // console.log('xxxxxx', value)
    if (component.props.type === 'reset') {
      // console.log('zzzzzz',props)
      return {
        onClick: () => {
          console.log('Form CLICK reset')
          this.initialize(this.props.resetState || {})
        }
      }
    } else if (component.type === 'input' || component.type === Input) { //|| typeof component.type === 'function'
      return Object.assign({ value }, {
        onChange: this.handleChange,
        onBlur: this.handleBlur,
      })
    } else {
      return {}
    }
  }

  getDependentChildren(children) {
    if (children instanceof Array) {
      return React.Children.map(children, child => {
        return this.applyDependecy(child)
      })
    } else if (typeof children === 'object') {
      return this.applyDependecy(children)
    } else {
      return children
    }
  }

  // 상위 컴포넌트에서 정의된 dynamic한 jsx를 받아와서 재구성합니다.
  // 퍼포먼스 이슈가 있지만, 제가 학습한 한도내에서는, 상위컴포넌트에서 자식을 정의하는 방식을 사용한다면 이 방식이 최선입니다. 아직 학습하지 않은 부분들을 학습한 후에 개선될 여지가 있습니다.
  // 상위 컴포넌트에서 Input이나 input에 value를 명시하지 않았다면(controlled component로 만들지 않았다면), 여기서 그렇게 합니다.
  applyDependecy(component) {
    if (component === null || typeof component !== 'object') { // this is for each child whose value is a react react expression like {touched? <div>i am touched</div> : undefined}  <--- 이거 undefined여도, null임;
      return component
    }
    const { type, props: { name, value, children } } = component
    // console.log('applyDependcy', component.type.name, component.type)
    // console.log('yyyyy', this.getDependency(name))
    // if (type === 'input' || type === Input) {
    //   console.log('xxxxxxx' , type, component.props)
    // }
    let propsDependency = this.getDependency(name, component)
    let dependentChildren = this.getDependentChildren(children)
    if (Object.keys(propsDependency).length !== 0 || children !== dependentChildren) {
      return React.cloneElement(component, propsDependency, dependentChildren) // https://reactjs.org/docs/react-api.html
    } else {
      return component
    }
  }

  render() {
    console.log('Form render props', this.props)
    const { children, name, className, onSubmit } = this.props
    const dependentChildren = this.getDependentChildren(children)
    // console.log('dependentChildren', dependentChildren)

    return (
      <form className={className} onSubmit={this.handleSubmit}>
        {dependentChildren}
      </form>
    )
  }
}

Form.defaultProps = {
  name: 'RoroForm'
}

