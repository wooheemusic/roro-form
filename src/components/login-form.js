import React, { Component } from 'react'
import Form, { Input } from 'components/roro-form'
import 'components/any.scss'
import { Button } from 'reactstrap'
// import authService from '../authService'
// import Kitchen from 'components/kitchen'
// import Table from 'components/table'


const asyncApi = (ms, value) => new Promise(resolve => {
  // console.log('async validating', value)
  setTimeout((v) => {
    resolve(v)
  }, ms, value)
})


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



    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit(e) {
    console.log('LoginForm handleSubmit', e.isDefaultPrevented())
    // e.preventDefault()
    // 아래는 다시 작성 , asyncValidations에 모두 resolve일 경우만 submit, 하나라도 reject이면 무시, promise가 있으면 promise.all
    // let temporaryPromises = [this.asyncValidate('emailExist', ()=>{return asyncApi(3000,true)}, 'not exist'), this.asyncValidate('userid', ()=>{return asyncApi(1000,true)}, 'not exist')]
    if (1) {
      return Promise.all([]).then((result) => {
        console.log('submit start with', result)
        // return "xxxxxxxxx"
        return asyncApi(2000, true).then((res) => {  // this return value does not goes to the first argument of 'then'. this just continues the parents promise
          console.log('submit success with async')
          return res
        })
      }, (e) => {
        console.log('submit failure by async validation', JSON.parse(e.message))
      })
    } else {
      // async validation 이 없는 경우
      return asyncApi(2000).then(() => { console.log('submit success') })
    }
  }

  setAllTouched() {
    this.setState((prev) => {

      return
    })
  }

  render() {
    console.log('LoginForm state', this.state, this.ready && this.isAsyncValidating('username'), this.ready && this.isAsyncResolved('username')) // check this.state and apply properties to JSX like 'disable={this.state.submitting}'
    // console.log(this.state.formControls)
    const { submitting } = this.state

    const initState = { formControls: { username: { value: 'woohee@s' }, password: { value: '1234' } } }

    return (

      // {...this.state} control={this} is required to update this.state 
      // initState is optional... redux를 사용하여 초기화 할 수 있을 것입니다.
      // this.initState에 설정가능하다. 하지만 attr 설정이 우선한다.
      // Form에서 LoginForm으로 주입한 method들은 this.ready 후 사용하도록 합니다.
      <Form {...this.state} control={this} className="form-signin" initState={initState} resetState={{}} onSubmit={this.handleSubmit}>
        <div className="input-container">
          <Input name="username"
            required
            validators={['required', 'wwww', 'email']}
            assertTrue={{ name: 'emailExist', api: () => { return asyncApi(5000, true) }, async: true, message: 'not exist' }} // api should return a boolean
            className="form-control"
            disabled={submitting || this.ready && this.isAsyncValidating('username')} //|| (false && username && username.promises.length > 0)} 
          />
          <div>&nbsp;{this.ready && (
            (this.isAsyncValidating('username') && 'asyncValidating')
            || (this.isTouched('username') && this.syncValidate('username'))
            || this.getAsyncError('username')
          )
          }</div>
        </div>
        <div className="input-container">
          <div>
            <input name="password" type="password" className="form-control" required disabled={submitting} />
            <div>&nbsp;{this.ready && this.isTouched('password') && this.syncValidate('password')}</div>
          </div>
        </div>
        {/* <button type="submit" > ddddd </button> */}
        <Button color="primary" type="submit" block disabled={submitting}>{submitting ? 'submitting' : 'Sign in'}</Button>
        <Button color="primary" type="reset" block disabled={submitting}>clear</Button>
        {this.ready && this.isSyncValid() ? 'valid to submit' : 'invaild to submit'}
      </Form>
    )
  }
}
