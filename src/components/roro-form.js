import React, { Component } from 'react'
// import { Button } from 'reactstrap'

export class Input extends Component {

  constructor(props) {
    super(props)
    console.log('Input const', this.props)

    this.disallwedBuiltIns = [
      'required',
    ]

    this.propsFilter = {

    }

  }

  getFilteredProps() {

    return this.props
  }

  render() {
    const filteredProps = this.getFilteredProps()
    console.log('Input render', filteredProps)
    return (
      <input {...filteredProps} />
    )
  }

}

// From attr : initState : { }
// state={this.state} control={this} is required to update this.state 
// initState is optional... redux를 사용하여 초기화 할 수 있을 것입니다.

export default class Form extends Component {

  constructor(props) {
    super(props)

    // validation output should be { isValid : Boolean || Promise , message : String}

    // a sample 
    // let username =  {
    //   value: "Jone",
    //   touched : false,
    //   validity: {
    //     isValid: true,
    //     message: "good name",
    //   }
    //   validations : []
    // }

    this.defaultState = {
      submitting: false,
      pristine: true,
      config: {
        asyncValidateOnChange: false, // true로 설정했을 때의 구현은 나중으로 미룸.
      },
      //username // this is a sample
    }

    // lifting properties
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleAfterSubmitCompletion = this.handleAfterSubmitCompletion.bind(this)

    // Form에 onChange attr 를 정의하더라도 아래 값이 그것을 덮어 쓰게 되는데(applyDependecy의 cloneElement), 그것들을 병합하는 코드를 구현하여야 합니다. 일단은 나중으로 미룸. 
    this.staticDependency = {
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onClick: this.handleClick,
    }
  }

  // Form component의 default설정에 initState attr로 정의된 state를 병합합니다.
  initialize(state) {
    this.props.control.setState((prev) => {
      for (let i in prev) {
        prev[i] = undefined
      }
      return Object.assign(prev, this.defaultState, state || this.props.initState || this.props.control.initState) // assign은 shallow하므로 defaultState와 initState에 관해서만 nested default로 변경할 예정
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
      // let entity = prev[name] ? Object.assign(prev[name], { value }) : { value }
      if (prev[name]) {
        return {
          pristine: false,
          [name]: Object.assign(prev[name], { value })
        }
      }
    })
  }

  handleClick(e) {
    e.preventDefault()
    const { type } = e.target
    switch (type) {
      case 'reset':
        this.initialize()
        break
      case 'submit':
      default:
        this.handleSubmit(e)
    }
  }

  handleBlur(e) {
    console.log('Form handle BLUR', e)
    console.dir(e.target)
    const { name, value } = e.target
    this.props.control.setState((prev, props) => {
      // let entity = prev[name] ? Object.assign(prev[name], { touched : true }) : { value } 
      // let assignment = this.props.control.asyncValidate(name)
      return {
        pristine: false,
        [name]: Object.assign(prev[name], { touched: true })
      }
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
    console.log('Form handle SUBMIT')
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

  // containment로 정의된 자식에게 주입할 lifting dependency와 value
  getDependency(name) {
    let formControl = this.props[name]
    let value = formControl ? formControl.value : ''
    // console.log('xxxxxx', value)
    return Object.assign(this.staticDependency, { value })
    // return this.staticDependency
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

  // getDependentChildren와 상호 재귀하면서 자식들을 재구성합니다. input, Input에는 this.bindMap에 정의된 lifting callback을 주입합니다.
  applyDependecy(component) {
    if (component === null || typeof component !== 'object') { // this for a child that is a react react expression like {touched? <div>i am touched</div> : undefined}  <--- 이거 null임;
      return component
    }
    const { type, props: { name, children } } = component
    // console.log('applyDependcy', component.type.name, component.type)
    // console.log('yyyyy', this.getDependency(name))
    let propsDependency = (type === 'input' || type === 'button' || typeof type === 'function') ? this.getDependency(name) : {}
    let dependentChildren = this.getDependentChildren(children)
    if (Object.keys(propsDependency).length !== 0 || children !== dependentChildren) {
      return React.cloneElement(component, propsDependency, dependentChildren) // https://reactjs.org/docs/react-api.html
    } else {
      return component
    }
  }

  render() {
    console.log('Form render props', this.props)
    const { children, name, className } = this.props
    const dependentChildren = this.getDependentChildren(children)
    console.log('dependentChildren', dependentChildren)

    return (
      <form className={className}>
        <h1>{name}</h1>
        {dependentChildren}
      </form>
    )
  }
}

Form.defaultProps = {
  name: 'RoroForm'
}

