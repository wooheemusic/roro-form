import React, { Component } from 'react'
// import { Button } from 'reactstrap'

export class Input extends Component {

  constructor(props) {
    super(props)
    // console.log('Input const', this.props)

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
    // console.log('Input render', this.props)
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

// eager
// issue 1 : unmount상태에서 async process에서의 exception에 대비 해야한다.

// lazy
// issue 1 : uncontrolled component 디자인 구상, ref? no? ex) type="file" 
// issue 1 : built-in input에 관해서는 constructValidators에서 built-in attribute 이외의 것들만 build하도록 변경하여야한다.
// issue 1 : html5의 모든 스펙을 구현해야한다. (radio, checkbox, range, textarea, select, contenteditable, submit action async ...)
// issue 1 : querystring interface 확인
// issue 1 : ref의 가용성에 관해 알아보아야 한다. 
// issue 1 : this.ready등을 제거하기 위해 'export default ready(component)' 방식으로 변경할지 생각 중
// issue 1 : old browser, xss

// config & hook
// issue 1 : customizing 혹은 logging을 위해 다양한 hook을 제공해야한다. promise의 대부분 stack에서 logging할 수 있도록 할 것이다.
// issue 3 : suppressBuiltInValidation 구현, Input은 default true, input은 default false 

// extra
// issue 9 : loop performance 개선
// issue 9 : PureComponent와 immutability, nested default, Object.assign 재고
// issue 9 : componentDidCatch 사용성 테스트, 좋은 인터페이스인가
// issue 9 : dev logging, dev minifying 구현 (__DEV__)
// issue 1 : chrome dev tool perfomance test
// issue 1 : 동적인 필드 추가 등, 타 api들의 재미있는 UI를 구현해야한다.


// https://reactjs.org/docs/codebase-overview.html#development-and-production

export default class Form extends Component {

  constructor(props) {
    super(props)

    const control = this.props.control

    this.defaultState = {
      submitting: false,
      pristine: true,
      formControls: undefined, // {}

      // 하지만 이 값을 절대 읽지 않는 것이 아이러니... 구조조정 하자
      config: { // hook??
        asyncValidateOnChange: false, // 아직 구현안됨, 해야하나...
        asyncValidateOnBlur: true, 
        asyncValidateOnInit: true, 
        touchedForAsyncField: true, 
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

    const meta = []
    for (let i in allInputs) {
      // console.log(allInputs[i], allInputs[i].name)
      let name = allInputs[i].props.name
      if (name)
        meta.push(name)
    }
    this.props.control.setState({ meta }) // constructor에서 상위 컴포넌트의 setState는 componentDidMount에서 한 것과 같다.

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

    this.getValue = function (name) {
      return (!this.state.formControls[name]) ? '' : this.state.formControls[name].value || ''
    }

    this.isTouched = function (name) {
      if (!this.state.formControls[name]) {
        return false // null
      }
      return this.state.formControls[name].touched // === true ? true : false
    }

    // 해당 name을 가진 필드에 관해 sync validation을 수행
    // 값이 없어도 null을 리턴함을 주의
    this.syncValidate = function (name, value) {
      if (!value && !this.state.formControls[name]) {
        return null
      }
      let ownValidators = this.syncValidators[name]
      if (ownValidators instanceof Array) {
        for (let i in ownValidators) {
          let ownValidator = ownValidators[i]
          if (ownValidator.regex && ownValidator.regex.test(value || this.getValue(name)) === (ownValidator.assertFalse || false)) {
            return ownValidator.message || ownValidator.name
          } else if (ownValidator.api && ownValidator.api(value || this.getValue(name)) === false) {
            return ownValidator.message || ownValidator.name
          }
        }
      }
      return null
    }

    this.syncValidateFull = function (name, value) {
      let validationResult = []
      if (!value && !this.state.formControls[name]) {
        return validationResult
      }
      let ownValidators = this.syncValidators[name]
      if (ownValidators instanceof Array) {
        for (let i in ownValidators) {
          let ownValidator = ownValidators[i]
          if (ownValidator.regex && ownValidator.regex.test(value || this.getValue(name)) === (ownValidator.assertFalse || false)) {
            validationResult.push(ownValidator.message || ownValidator.name)
          } else if (ownValidator.api && ownValidator.api(value || this.getValue(name)) === false) {
            validationResult.push(ownValidator.message || ownValidator.name)
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

    this.asyncValidateInternal = function (asyncName, asyncApi, message = asyncName, owner, specifiedValue) {
      console.log('asyncValidating', owner, asyncName)
      // if (!this.state.formControls[owner]) {
      //   return
      // }
      let value = specifiedValue || this.state.formControls[owner].value
      // 바로 state를 읽는건 위험한가? NO. blur와 click 이벤트 사이에 blur에서 발생한 모든 setState merging과 render가 완료된다. 
      // event occur -> state merging -> render 가 하나의 파티션을 이루는 것 같다...promise가 프레임들의 연속성을 보장하듯이 그런식으로 구현했을 것이라 추측...
      // 모든 event message에 관하여 같을 것이라 생각... 그래도 항상 테스트하자.
      if (this.state.asyncValidations) {
        let asyncValidation = this.state.asyncValidations[asyncName]
        // console.log('xxx', value, asyncValidation.value)
        if (asyncValidation && (asyncValidation.value === value)) {
          console.log('async validation is suppressed with', value)
          return
        }
      }
      let promise = asyncApi(value)
      // console.log('xxxxxxx')
      this.setState((prev) => {
        // prev.formControls[owner].touched = true
        return {
          asyncValidations: Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'processing', promise, owner, value, message } }), // 같은 이름의 새로운 promise는 이전의 것을 덮어쓰고, 전의 것은 garbage collect됩니다.
          // formControls : prev.formControls
        }
      })
      return promise = promise.then((result) => {
        console.log('async-validation-result', asyncName, result)
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

    this.asyncValidate = function (name, value) {
      let promises = []
      if (this.asyncValidators && this.asyncValidators[name]) {
        for (let i in this.asyncValidators[name]) {
          let asyncValidator = this.asyncValidators[name][i]
          promises.push(this.asyncValidateInternal(asyncValidator.name, asyncValidator.api, asyncValidator.message, name, value))
        }
      }
      return promises
    }

    // check only 'processing's (this does not check 'null' status)
    this.isAsyncValidating = function (name) {
      if (name) {
        // 특정필드에 관해서만
        let asyncValidations = this.state.asyncValidations
        let asyncValidators = this.asyncValidators[name]
        for (let i in asyncValidators) {
          // let asyncValidator = asyncValidators[i]
          let asyncName = asyncValidators[i].name
          // 아직 검증 안했다면 continue
          if (!asyncValidations || !(asyncName in asyncValidations)) {
            continue
          }
          // 상태가 'processing'이라면 true
          let asyncValidation = asyncValidations[asyncName]
          if (asyncValidation.status === 'processing') {
            return true
          }
        }
        return false
      } else {
        // 모든 필드에 관해서
        let asyncValidations = this.state.asyncValidations
        for (let i in asyncValidations) {
          if (asyncValidations[i].status === 'processing') {
            return true
          }
        }
        return false
      }
    }

    // check only 'rejected's and returns their error messages (this does not check 'null' status)
    this.getAsyncErrorMessages = function (name) {
      let result = []
      let asyncValidations = this.state.asyncValidations
      for (let asyncName in asyncValidations) {
        let asyncValidation = asyncValidations[asyncName]
        if (asyncValidation.owner === name && asyncValidation.status === 'rejected') {
          result.push({ name: asyncName, message: asyncValidation.message })
        }
      }
      return result
    }

    this.hasAsyncRejection = function (name) {
      let asyncValidations = this.state.asyncValidations
      for (let asyncName in asyncValidations) {
        let asyncValidation = asyncValidations[asyncName]
        if (asyncValidation.status === 'rejected') {
          if (name && asyncValidation.owner !== name) {
            continue
          }
          return true
        }
      }
      return false
    }

    // 'null' for not-validated 
    // this.getAsyncStatusInternal = function (name, result = {}) {
    //   let asyncValidations = this.state.asyncValidations
    //   let asyncValidators = this.asyncValidators[name]
    //   for (let i in asyncValidators) {
    //     let asyncName = asyncValidators[i].name
    //     if (asyncValidations && asyncName in asyncValidations) {
    //       let status = asyncValidations[asyncName].status
    //       result[status] = result[status] || []
    //       result[status].push(asyncName) // 
    //     } else {
    //       result.idle = result.idle || []
    //       result.idle.push(asyncName)
    //     }
    //   }
    //   return result
    // }

    // this.getAsyncStatus = function (name, scope = '') {
    //   let result = []
    //   if (name) {
    //     this.getAsyncStatusInternal(name, result)
    //   } else {
    //     for (let name in this.asyncValidators) {
    //       this.getAsyncStatusInternal(name, result)
    //     }
    //   }
    //   return result
    // }

    this.getIdleFields = function () {
      let result = []
      let asyncValidations = this.state.asyncValidations
      for (let name in this.asyncValidators) {
        let asyncValidators = this.asyncValidators[name]
        for (let i in asyncValidators) {
          let asyncName = asyncValidators[i].name
          if (!asyncValidations || !(asyncName in asyncValidations)) {
            result.push(name)
            break
          }
        }
      }
      return result
    }

    // private
    // level 'processing' or 'resolved' 
    // if the 2nd arg is 'processing', it return false only if it has at least one 'reject'
    // if the 2nd arg is 'resolved', it return false only if it has at least one 'reject' or 'processing' 
    this.isAsyncValidInternal = function (lowerBound = 'processing', name) {
      let asyncValidations = this.state.asyncValidations
      let asyncValidators = this.asyncValidators[name]
      for (let i in asyncValidators) {
        // let asyncValidator = asyncValidators[i]
        let asyncName = asyncValidators[i].name
        // 아직 검증 안했다면 false
        if (!asyncValidations || !(asyncName in asyncValidations)) {
          return false
        }
        // 상태가 lowerBound 보다 아래라면 false
        let asyncValidation = asyncValidations[asyncName]
        if (asyncValidation.status === 'rejected' || (lowerBound !== 'processing' && asyncValidation.status === 'processing')) {
          return false
        }
        // state의 value와 검증한 value가 다르다면 false
        if (!this.state.formControls || !this.state.formControls[name] || (asyncValidation.value !== this.state.formControls[name].value)) {
          return false
        }
      }
      return true
    }

    // public
    this.isAsyncValid = function (name, lowerBound = 'processing') {
      // 특정 필드에 관해서만
      if (name) {
        return this.isAsyncValidInternal(lowerBound, name)
      } else {
        // 모든 필드에 관해서
        for (let name in this.asyncValidators) {
          if (this.isAsyncValidInternal(lowerBound, name) === false) {
            return false
          }
        }
        return true
      }
    }

    // this.isAsyncResolvedOrProcessing = function (name) {
    //   let asyncValidations = this.state.asyncValidations
    //   let asyncValidators = this.asyncValidators[name]
    //   for (let i in asyncValidators) {
    //     if (!asyncValidations || !asyncValidations[asyncValidators[i].name] || asyncValidations[asyncValidators[i].name].status === 'rejected') {
    //       return false
    //     }
    //   }
    //   return true
    // }

    // this.isAllAsyncResolvedOrProcessing = function () {
    //   for (let i in this.asyncValidators) {
    //     if (this.isAsyncResolvedOrProcessing(i) !== true) {
    //       return false
    //     }
    //   }
    //   return true
    // }

    // 아직 진행중인 promise를 모두 받아온다. promise객체가 실제로 resolved되었더라도, 그것과 상관 없이 react component의 this.asyncValidations[name].status를 기준으로 받아온다.
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


    // if (__DEV__) {
    //   console.log('__DEV__',__DEV__)
    // }
    // console.log(window)

    function checkDuplicated(name, array) {
      return array.indexOf(name) !== -1
    }

    function getValidatorByName(name) {
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

    // __DEV__
    // validators attribute의 값들을 처리하여 내부 api를 구성합니다
    let controlGroup = []
    let validators = originalValidators.map((validator, index, arr) => {
      if (typeof validator === 'object') {  // && validator !== null && ('api' in validator || 'regex' in validator)) {
        let name = validator.name
        if (this.managedProps.indexOf(name) !== -1) {
          throw new Error(name, 'is reserved')
        }
        if (checkDuplicated(name, controlGroup)) {
          throw new Error(name, 'is duplicated')
        } else {
          controlGroup.push(name)
        }
        return validator
      } else if (typeof validator === 'string') {
        let name = validator
        if (checkDuplicated(name, controlGroup)) {
          throw new Error(name, 'is duplicated')
        } else {
          controlGroup.push(name)
        }
        return name
      }
      return null
    })

    // validators에 존재하지 않거나 string으로 남겨져 있는 항목에 관해 attribute에 구현된 validator를 구성합니다. 
    for (let i in this.managedProps) {
      let validatorName = this.managedProps[i]
      let currentIndex = validators.indexOf(validatorName)
      switch (validatorName) {
        case 'required':
          if (currentIndex !== -1) {
            validators[currentIndex] = getValidatorByName(validatorName)
          } else if (input.props.required) {
            validators.unshift(getValidatorByName(validatorName))
          }
          break;
        case 'email':
          if (currentIndex !== -1) {
            validators[currentIndex] = getValidatorByName(validatorName)
          } else if (input.props.type === 'email') {
            validators.push(getValidatorByName(validatorName))
          }
          break;
        case 'pattern':
          let pattern = input.props.pattern
          if (pattern) {
            let validator = {
              validatorName: validatorName,
              regex: pattern,
            }
            if (currentIndex !== -1) {
              validators[currentIndex] = validator
            } else {
              validators.push(validator)
            }
          }
          break;
        case 'assertTrue':
          let assertTrue = input.props.assertTrue
          if (assertTrue) {
            if (currentIndex !== -1) {
              validators[currentIndex] = assertTrue
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
            if (currentIndex !== -1) {
              validators[currentIndex] = assertFalse
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
            if (currentIndex !== -1) {
              validators[currentIndex] = matchValidator
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

    for (let i in internalAsyncValidators) {
      let asyncName = internalAsyncValidators[i].name
      for (let name in asyncValidators) {
        let namedAsyncValidators = asyncValidators[name]
        for (let j in namedAsyncValidators) {
          // console.log(namedAsyncValidators[j].name, asyncName)
          if (namedAsyncValidators[j].name === asyncName) {
            throw new Error('asyncNames are duplicated.', asyncName)
          }
        }
      }
    }

    syncValidators[name] = internalSyncValidators
    asyncValidators[name] = internalAsyncValidators

    return [syncValidators, asyncValidators]
  }

  // Form component의 default설정에 initState attr로 정의된 state를 병합합니다.
  initialize(state) {

    let givenControls = state ? state.formControls : (this.props.initState && this.props.initState.formControls) || (this.props.control.initState && this.props.control.initState.formControls)

    // touchedForAsyncField false가 아니라면 initState에 value 가 있으면 touched를 적용
    if (!state || !state.config || state.config.touchedForAsyncField !== false) {
      for (let name in givenControls) {
        if (givenControls[name] && givenControls[name].value) {
          givenControls[name].touched = true
        }
      }
    }

    this.props.control.setState((prev) => {
      // console.log(prev.meta)
      for (let p in prev) {
        if (p === 'meta') continue
        prev[p] = undefined
      }

      let formControls = {}
      for (let i in prev.meta) {
        formControls[prev.meta[i]] = { value: '', touched: false }
      }
      Object.assign(formControls, givenControls)
      // Object.assign(prev, JSON.parse(JSON.stringify(this.defaultState)), {formControls} )
      Object.assign(prev, this.defaultState, { formControls })

      return prev
    })

    // state에 value가 있으면 asyncValidation을 시작
    if (!state || !state.config || state.config.asyncValidateOnInit !== false) {
      for (let name in givenControls) {
        let value = givenControls[name].value
        if (this.props.control.syncValidate(name, value) === null) {
          this.props.control.asyncValidate(name, value)
        }
      }
    }
  }

  // 언제 실행되는 것인지;
  componentDidCatch(error, info) {
    console.log('componentDidCatch', error, info)
  }

  componentDidMount() {
    this.initialize()
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
    if (!this.props.control.state.config || this.props.control.state.config.asyncValidateOnBlur !== false) {
      if (this.props.control.syncValidate(name) === null) {
        this.props.control.asyncValidate(name)
      } else {
        console.log(name, 'sync validation failed. if async validators exist, they are suppressed')
      }
    }
    this.setTouched(name)
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

  setTouched(name) {
    this.props.control.setState((prev, props) => {
      let formControls = prev.formControls || {}

      if (name) {
        Object.assign(formControls, { [name]: Object.assign(formControls[name] || {}, { touched: true }) })
      } else {
        let arr = []
        for (let name in formControls) {
          arr.push({ [name]: Object.assign(formControls[name], { touched: true }) })
        }
        Object.assign(formControls, ...arr)
      }
      return { formControls }
    })
    // this.props.control.setState((prev) => {
    //   let formControls = prev.formControls
    //   if (name) {
    //     formControls[name].touched = true
    //   } else {
    //     for (let name in formControls) {
    //       formControls[name].touched = true
    //     }
    //   }
    //   return prev
    // })
  }

  handleSubmit(e) {
    e.preventDefault()
    console.log('Form SUBMIT')

    this.setTouched()

    if (this.props.control.isSyncValid() !== true) {
      console.log('submit denied by syncValidation')
      // set all touched
      return
    }

    // 검증하지 않은 필드까지 확인할때 isAsyncValid, 검증실패한 필드만 확인할 때 hasAsyncRejection
    // blur에 async 검증하는지 안하는지 몰라야하기 때문에 hasAsyncRejection를 사용

    if (this.props.control.hasAsyncRejection()) {
      console.log('submit denied by asyncValidation, rejected')
      return
    }

    // submit start
    this.props.control.setState({ submitting: true })

    let allPromises = []

    let idleFields = this.props.control.getIdleFields()
    for (let i in idleFields) {
      allPromises = allPromises.concat(this.props.control.asyncValidate(idleFields[i]))
    }
    allPromises = allPromises.concat(this.props.control.getProcessingPromises())

    if (allPromises.length > 0) {
      return Promise.all(allPromises).then((result) => {
        console.log('submit start after async validation with', result, 'of', allPromises)
        // console.log('submit is scoped by', this, e) // this is Form
        if (result.indexOf(false) !== -1) {
          // asyncValidation에 실패하여 서버에 요청을 보내지 않습니다.
          console.log('submit failure by async validation failure', e.message)
          this.props.control.setState((prev) => {
            let failureCount = prev.failureCount || 0
            return { submitting: false, failureCount: ++failureCount }
          })
        } else {
          // 서버에 요청을 보냅니다.
          return this.props.onSubmit(e).then(this.props.onSuccess || this.handleAfterSubmitCompletion, this.props.onFailure || this.handleAfterSubmitCompletion)
        }
      }, (e) => {
        console.log('submit failure by async validation failure', e.message)
      })
    } else {
      // async validation 이 없는 경우, 그냥 요청 보내기
      console.log('submit start with no async validation')
      return this.props.onSubmit(e).then(this.props.onSuccess || this.handleAfterSubmitCompletion, this.props.onFailure || this.handleAfterSubmitCompletion)
    }
  }

  // containment로 정의된 자식에게 주입할 dependency와 value
  // 두번째 argument는 상위컴포넌트의 jsx에서 정의된 component이며, 그것의 props.value가 존재하면 그것을 사용하고 아니면 상위컴포넌트의 state에 control되도록 합니다.
  // formControl에 event attr 를 정의하더라도 아래 값이 그것을 덮어 쓰게 되는데, 그것들을 병합하는 코드를 구현하여야 합니다. 일단은 나중으로 미룸.
  getDependency(name, component) {
    let formControl = this.props.formControls ? this.props.formControls[name] : undefined
    let value = ('value' in component.props) ? component.props.value || '' : formControl ? formControl.value || '' : ''
    if (component.props.type === 'reset') {
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
    // console.log('Form render props', this.props)
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

