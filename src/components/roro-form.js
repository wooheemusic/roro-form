import React, { Component } from 'react'
// import { Button } from 'reactstrap'

export class Input extends Component {

  constructor(props) {
    super(props)
    console.log('Input const', this.props)

    // this.should be identical to the Form's managed props
    this.disallowedProps = [
      'required', 'email', 'pattern', 'assertTrue', 'assertFalse'
    ]
  }

  // 나중에 구현
  // typeConverters(type) {
  //   switch (type) {
  //     case 'email':
  //       return 'text'
  //     default:
  //       return type
  //   }
  // }

  getFilterdProps(props) {
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
    const filterdProps = this.getFilterdProps(this.props)
    return (
      <input {...filterdProps} />
    )
  }

}

// From attr : initState : { }
// state={this.state} control={this} is required to update this.state 
// initState is optional... redux를 사용하여 초기화 할 수 있을 것입니다.

export default class Form extends Component {

  constructor(props) {
    super(props)

    this.defaultState = {
      submitting: false,
      pristine: true,
      config: {
        asyncValidateOnChange: false, // true로 설정했을 때의 구현은 나중으로 미룸.
      },
    }

    // lifting properties
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleAfterSubmitCompletion = this.handleAfterSubmitCompletion.bind(this)
    this.initialize = this.initialize.bind(this)

    this.managedProps = ['required', 'email', 'pattern', 'assertTrue', 'assertFalse']

    const allInputs = this.readAllInputs(this)
    // console.log('allInputs', allInputs)

    this.props.control.syncValidators = {}
    this.props.control.asyncValidators = {}

    for (let i in allInputs) {
      this.constructValidators(allInputs[i], this.props.control.syncValidators, this.props.control.asyncValidators)
    }
    console.log('syncValidators', this.props.control.syncValidators)
    console.log('asyncValidators', this.props.control.asyncValidators)

    // 상위 컴포넌트에 아래의 함수들을 정의합니다. asyncValidate는 이 클래스 안에서만 사용되지만, 사용자의 커스터마이징을 위해 올려둡니다.
    this.props.control.ready = true
    this.props.control.getValue = (function (name) {
      return (!this.state.formControls || !this.state.formControls[name]) ? '' : this.state.formControls[name].value || ''
    }).bind(this.props.control)

    this.props.control.isTouched = (function (name) {
      if (!this.state.formControls || !this.state.formControls[name]) {
        return null
      }
      return this.state.formControls[name].touched
    }).bind(this.props.control)

    this.props.control.syncValidate = (function (name) {
      if (!this.state.formControls || !this.state.formControls[name]) {
        return null
      }
      let ownValidators = this.syncValidators[name]
      if (ownValidators instanceof Array) {
        for (let i in ownValidators) {
          if (ownValidators[i].regex && ownValidators[i].regex.test(this.getValue(name)) === false) {
            return ownValidators[i].name
          } else if (ownValidators[i].api && ownValidators[i].api(this.getValue(name)) === false) {
            return ownValidators[i].name
          }
        }
      }
      return null
    }).bind(this.props.control)

    this.props.control.syncValidateFull = (function (name) {
      if (!this.state.formControls || !this.state.formControls[name]) {
        return []
      }
      let validationResult = []
      let ownValidators = this.syncValidators[name]
      if (ownValidators instanceof Array) {
        for (let i in ownValidators) {
          if (ownValidators[i].regex && ownValidators[i].regex.test(this.getValue(name)) === false) {
            console.log(ownValidators[i].name, ownValidators[i].regex)
            validationResult.push(ownValidators[i].name)
          } else if (ownValidators[i].api && ownValidators[i].api(this.getValue(name)) === false) {
            validationResult.push(ownValidators[i].name)
          }
        }
      }
      return validationResult
    }).bind(this.props.control)

    this.props.control.isSyncValid = (function () {
      const formControls = this.state.formControls
      if (!formControls) {
        return false
      }
      for (let i in formControls) {
        if (this.syncValidate(i) !== null) {
          return false
        }
      }
      return true
    }).bind(this.props.control)

    this.props.control.asyncValidate = (function (asyncName, asyncApi, message = 'invalid (please specify a error message in your async validator)', owner = 'none') {
      console.log('asyncValidating', owner, asyncName)
      let promise = asyncApi()
      console.log('xxxxxxx')
      this.setState((prev) => {
        return {
          asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'processing', promise, owner, value: prev.formControls[owner].value } }) // 같은 이름의 새로운 promise는 이전의 것을 덮어쓰고, 전의 것은 garbage collect됩니다.
        }
      })
      return promise.then((result) => {
        console.log('async validation result', asyncName, result)
        if (result === true) {
          this.setState((prev) => {
            if (prev.asyncValidations && prev.asyncValidations[asyncName] && prev.asyncValidations[asyncName].promise === promise) {
              return {
                asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'resolved' } })
              }
            } else {
              console.log('It seems like a async validation has been overwritten by a new one or detached.')
            }
          })
          return asyncName // 이 값은 사용하지 않지만... 일단은 생각 중.
        } else if (result === false) {
          this.setState((prev) => {
            if (prev.asyncValidations && prev.asyncValidations[asyncName] && prev.asyncValidations[asyncName].promise === promise) {
              return {
                asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'rejected', message } })
              }
            } else {
              console.log('It seems like a async validation has been overwritten by a new one or detached.')
            }
          })
          throw new Error(JSON.stringify({ asyncName, message }))
        } else {
          throw new Error('async api should return a boolean')
        }
      })
    }).bind(this.props.control)

    this.props.control.asyncValidateByName = (function (name) {
      console.log(name)
      if (this.asyncValidators && this.asyncValidators[name]) {
        for (let i in this.asyncValidators[name]) {
          let asyncValidator = this.asyncValidators[name][i]
          console.log('xxxxxx', asyncValidator, name)
          this.asyncValidate(asyncValidator.name, asyncValidator.api, asyncValidator.message, name)
        }
      }
    }).bind(this.props.control)

    this.props.control.isAsyncValidating = (function (name) {
      let asyncValidations = this.state.asyncValidations
      // console.log(this, asyncValidations)
      for (let i in asyncValidations) {
        // console.log('qdqwdqwqdwdqwwd', i, asyncValidations[i].owner, asyncValidations[i].status)
        if (asyncValidations[i].owner === name && asyncValidations[i].status === 'processing') {
          return true
        }
      }
      return false
    }).bind(this.props.control)

    this.props.control.getAsyncError = (function (name) {
      let asyncValidations = this.state.asyncValidations
      for (let i in asyncValidations) {
        if (asyncValidations[i].owner === name && asyncValidations[i].status === 'rejected') {
          return asyncValidations[i].message
        }
      }
      return null
    }).bind(this.props.control)

    this.props.control.getAllAsyncError = (function (name) {
      let result = []
      let asyncValidations = this.state.asyncValidations
      for (let i in asyncValidations) {
        if (asyncValidations[i].owner === name && asyncValidations[i].status === 'rejected') {
          result.push(asyncValidations[i].message)
        }
      }
      return result
    }).bind(this.props.control)

    this.props.control.isAsyncResolved = (function (name) {
      let asyncValidations = this.state.asyncValidations
      let asyncValidators = this.asyncValidators[name]
      for (let i in asyncValidators) {
        if (!asyncValidations || !asyncValidations[asyncValidators[i].name] || asyncValidations[asyncValidators[i].name].status !== 'resolved') {
          return false
        }
      }
      return true
    }).bind(this.props.control)
    this.props.control.isAsyncResolvedOrProcessing = (function (name) {
      let asyncValidations = this.state.asyncValidations
      let asyncValidators = this.asyncValidators[name]
      for (let i in asyncValidators) {
        if (!asyncValidations || !asyncValidations[asyncValidators[i].name] || asyncValidations[asyncValidators[i].name].status === 'refected') {
          return false
        }
      }
      return true
    }).bind(this.props.control)
    this.props.control.isAllAsyncResolvedOrProcessing = (function () {
      for (let i in this.asyncValidators) {
        if (this.isAsyncResolvedOrProcessing(i) !== true) {
          return false
        }
      }
      return true
    }).bind(this.props.control)
    this.props.control.getProcessingPromises = (function () {
      let promises = []
      let asyncValidations = this.state.asyncValidations
      for (let i in asyncValidations) {
        if (asyncValidations[i].status === 'processing') {
          promises.push(asyncValidations[i].promise)
        }
      }
      return promises
    }).bind(this.props.control)

    //async를 initState에도 수행하게 하여야한다.

  }

  // 구현하면 assertTrue등을 input에도 사용할 수 있다. 하지만 일단은 뒤로 미룸.
  // getFilteredProps(props) {

  //   return this.props
  // }

  // {name : "", api||regex : "", message: "", async : true} // message is only for async

  constructValidators(input, syncValidators = {}, asyncValidators = {}) {
    const name = input.props.name
    if (!name) {
      return
      // throw new Error('input elements or Input component should have a name')
    }

    let originalValidators = input.props.validators || []

    // validations attribute의 값들을 처리하여 내부 api를 구성합니다
    let validators = originalValidators.map((validator) => {
      if (typeof validator === 'object' && validator !== null && ('api' in validator || 'regex' in validator)) {
        return validator
      }
      if (typeof validator === 'string') {
        return this.getValidationByName(validator)
      }
      return null
    })

    // console.log(validators)

    //validations에 존재하지 않지만 attribute에 구현된 validation을 구성합니다. 또는 둘다

    for (let i in this.managedProps) {
      let validatorName = this.managedProps[i]
      switch (validatorName) {
        case 'required':
          if (input.props[validatorName] && originalValidators.indexOf(validatorName) === -1) {
            validators.unshift(this.getValidationByName('required'))
          }
          break;
        case 'email':
          if (input.props.type === validatorName && originalValidators.indexOf(validatorName) === -1) {
            validators.push(this.getValidationByName(validatorName))
          }
          break;
        case 'pattern':
          if (input.props[validatorName]) {
            let patternValidator = {
              validatorName: 'pattern',
              regex: input.props[validatorName],
            }
            if (originalValidators.indexOf(validatorName) === -1) {
              validators[validators.indexOf(validatorName)] = patternValidator
            } else {
              validators.push(patternValidator)
            }
          }
          break;
        case 'assertTrue':
          let assertTrue = input.props[validatorName]
          if (assertTrue) {
            if (originalValidators.indexOf(assertTrue.name) !== -1) {
              validators[validators.indexOf(assertTrue.name)] = assertTrue
            } else {
              validators.push(assertTrue)
            }
          }
          break;
        case 'assertFalse':
          let assertFalse = input.props[validatorName]
          if (assertFalse) {
            if (assertFalse.api) {
              let copy = assertFalse.api
              if (assertFalse.async !== true) {
                assertFalse.api = () => { return !copy() }
              } else {
                assertFalse.api = () => { return copy().then((tf) => { return !tf }) }
              }
            }
            if (originalValidators.indexOf(assertFalse.name) !== -1) {
              validators[validators.indexOf(assertFalse.name)] = assertFalse
            } else {
              validators.push(assertFalse)
            }
          }
          break;
      }
    }

    // console.log(validators)

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

  getValidationByName(name) {
    switch (name) {
      case 'required':
        return {
          name: 'required',
          regex: /.+/,
        }
      case 'email':
        return {
          name: 'email',
          regex: /^[\w]+@[\w\.]*\w+$/,
        }
      default:
        return name
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

  // Form component의 default설정에 initState attr로 정의된 state를 병합합니다.
  initialize(state) {
    this.props.control.setState((prev) => {
      for (let i in prev) {
        prev[i] = undefined
      }
      return Object.assign(prev, this.defaultState, state || this.props.initState || this.props.control.initState || this.props.resetState) // assign은 shallow하므로 defaultState와 initState에 관해서만 nested default로 변경할 예정
    })
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
    console.log('yyyyyyyy')
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
    const promise = this.props.onSubmit(e)
    console.log('xxxxxxx promise', promise)
    if (promise instanceof Promise) {
      promise.then((res) => {
        console.log('yyyyyyy res', res)
        this.handleAfterSubmitCompletion(res)
      })
    } else {
      throw new Error('Form onSubmit should return a promise')
    }
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
  // 상위 컴포넌트에서 Input이나 input에 value를 명시하지 않았다면(controled component로 만들지 않았다면), 여기서 그렇게 합니다.
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

