import React, { Component } from 'react'
import Form, { Input } from 'components/roro-form'
import 'components/any.scss'
import { Button } from 'reactstrap'
// import authService from '../authService'
// import Kitchen from 'components/kitchen'
// import Table from 'components/table'



export default class LoginForm extends Component {

  constructor(props) {
    super(props)
    this.state = {}

    // properties to be set from the children
    // this.state = {
    //   submitting: false,
    //   username: {
    //     value: '',
    //     touched: true,
    //   },
    //   asyncValidations: {
    //     "emailExist": {
    //       status: 'resolved',
    //     },
    //     "nicknameExist": {
    //       status: 'rejected',
    //       message: 'not exist'
    //     },
    //     "useridExist": {
    //       status: 'processing',
    //       promise: promise,
    //     },
    //   }
    // }
    // this.asyncValidators // // automatically injected by Form // never use this // it is handled by Form
    // this.resolveAsyncValidations() // automatically injected by Form // returns a promise
    // this.validate(name) // automatically injected by Form // returns the validation name of the first violation, its message is up to you // this is a static property, not a react state.

    this.asyncApi = (ms, value) => new Promise(resolve => {
      console.log('async validating', value)
      setTimeout((v) => {
        resolve(v)
      }, ms, value)
    })

    this.asyncValidate = (asyncApi, asyncName, message) => {
      let promise = asyncApi(2000, false)
      this.setState((prev) => {
        return Object.assign(prev.asyncValidations || {}, { status: 'processing', promise })
      })
      return promise.then((result) => {
        console.log('async validation result', asyncName, result)
        if (result === true) {
          this.setState((prev) => {
            if (prev.asyncValidations && prev.asyncValidations[asyncName] && prev.asyncValidations[asyncName].promise === promise) {
              return Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'resolved' } })
            } else {
              console.log('it seems like a async validation has been overwritten by a new one')
            }
          })
          return asyncName // 이 값은 사용하지 않지만... 일단은 생각 중.
        } else if (result === false) {
          this.setState((prev) => {
            if (prev.asyncValidations && prev.asyncValidations[asyncName] && prev.asyncValidations[asyncName].promise === promise) {
              return Object.assign(prev.asyncValidations || {}, { [asyncName]: { status: 'rejected', message } })
            } else {
              console.log('it seems like a async validation has been overwritten by a new one')
            }
          })
          throw new Error(JSON.stringify({ asyncName, message }))
        } else {
          throw new Error('async api should return a boolean')
        }
      })
    }

    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit() {
    console.log('LoginForm handleSubmit')
    // 아래는 다시 작성 , asyncValidations에 모두 resolve일 경우만 submit, 하나라도 reject이면 무시, promise가 있으면 promise.all
    let temporaryPromises = [this.asyncValidate(this.asyncApi, 'username', 'not exist'), this.asyncValidate(this.asyncApi, 'userid', 'not exist')]
    if (temporaryPromises) {
      return Promise.all(temporaryPromises).then((...a) => {
        console.log('submit start with', a)
        this.asyncApi(2000, true).then(() => { console.log('submit success') })
      }, (e) => {
        console.log('submit failure by async validation', JSON.parse(e.message))
      })
    } else {
      // async validation 이 없는 경우
      return this.asyncApi(2000).then(() => { console.log('submit success') }).then(this.setState({ submitting: false }))
    }
  }

  setAllTouched() {
    this.setState((prev) => {

      return
    })
  }

  render() {
    console.log('LoginForm state', this.state) // check this.state and apply properties to JSX like 'disable={this.state.submitting}'
    const { submitting, username, password } = this.state
    let usernameValidating = this.state.username && this.state.username.validity && this.state.username.validity.isValid instanceof Promise

    let usermessage = "xxxxx"

    return (

      // {...this.state} control={this} is required to update this.state 
      // initState is optional... redux를 사용하여 초기화 할 수 있을 것입니다.
      // this.initState에 설정가능하다. 하지만 attr 설정이 우선한다.
      <Form {...this.state} control={this} className="form-signin" initState={{ username: { value: 'osc' }, password: { value: '123' } }} onSubmit={this.handleSubmit}>
        <div className="input-container">
          <Input name="username" value={username && username.value} className="form-control" disabled={submitting || (false && username && username.promises.length > 0)} />
          {username && username.touched && usermessage ? <div>usermessage</div> : undefined}
        </div>
        <div className="input-container">
          <div>
            <input name="password" value={(password && password.value) || ''} type="password" className="form-control" disabled={submitting} />
          </div>
        </div>
        <Button color="primary" type="submit" block disabled={submitting || usernameValidating}>{submitting ? 'submitting' : 'Sign in'}</Button>
        <Button color="primary" type="reset" block disabled={submitting}>clear</Button>
      </Form>
    )
  }
}
