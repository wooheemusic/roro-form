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
    console.log('LoginForm handleSubmit', e)
    return asyncApi(4000, true).then(() => { alert('success') })
  }

  setAllTouched() {
    this.setState((prev) => {

      return
    })
  }

  render() {
    console.log('LoginForm state', this.state) // check this.state and apply properties to JSX like 'disable={this.state.submitting}'
    // if (this.state.formControls && this.state.formControls.username ) {
    // console.log(this.ready && this.state.formControls.username.value)
    // }else {
    //   console.log('formContols are ', this.formControls)
    // }

    if (this.ready) {
      // console.log('xxxxxxxx',this.getAsyncErrorMessages('password'))
    }

    // console.log(this.ready && this.state.formControls.password.value.length)
    const { submitting } = this.state

    const initState = { formControls: { username: { value: 'woohee@s' }, password: { value: '124' }, nickname: { value: '222' } } }

    return (

      // {...this.state} control={this} is required to update this.state 
      // initState is optional... redux를 사용하여 초기화 할 수 있을 것입니다.
      // this.initState에 설정가능하다. 하지만 attr 설정이 우선한다.
      // Form에서 LoginForm으로 주입한 method들은 this.ready 후 사용하도록 합니다.
      // onSubmit은 반드시 프로미스를 리턴해야합니다.
      <Form {...this.state} control={this}
        className="form-signin"
        initState={initState}
        resetState={{}}
        onSubmit={this.handleSubmit}
        onSuccess={this.onSuccess}
        onFailure={this.onFailer}
      >
        <h1> Login Form </h1>
        <p> <a href="https://github.com/wooheemusic/roro-form">https://github.com/wooheemusic/roro-form</a></p>
        <p> 아래의 redux-form에 문제가 있어 직접 작성</p>
        <div className="input-container">
          <Input name="username"
            required
            validators={['wwww', 'email', 'required']}
            assertTrue={{ name: 'emailExist', api: () => { return asyncApi(3000, true) }, async: true, message: 'not exist' }} // api should return a boolean
            // assertFalse={{ name: 'asserFALSE', regex: /^.{12,14}$/ }}
            className="form-control"
            disabled={submitting || this.ready && this.isAsyncValidating('username')} // (false && username && username.promises.length > 0)} 
          />
          <div>&nbsp;{this.ready && (
            (this.isAsyncValidating('username') && 'asyncValidating')
            || (this.isTouched('username') && this.syncValidate('username'))
            || (this.hasAsyncRejection('username') && this.getAsyncErrorMessages('username')[0].message)
          )
          }</div>
        </div>
        <div className="input-container">
          <div>
            <input
              // match="username"
              name="password"
              type="password"
              className="form-control"
              // assertTrue={{ name: 'passwordCheck', refex : /^.{1,1000}$/, message: 'not valid' }}
              required
              validators={['assertTrue', { name: '5~10', regex: /^.{5,10}$/ }, { name: 'passwordCheck', api: (v) => { return asyncApi(3000, v.length > 7 ? true : false) }, async: true, message: 'async failure : assert length > 7' }]}
              disabled={submitting || this.ready && this.isAsyncValidating('password')}
            />
            <div>&nbsp;{this.ready && (
              (this.isAsyncValidating('password') && 'asyncValidating')
              || (this.isTouched('password') && this.syncValidate('password'))
              || (this.hasAsyncRejection('password') && this.getAsyncErrorMessages('password')[0].message)
            )
            }</div>
          </div>
        </div>

        <div className="input-container">
          <div>
            <Input
              // match="username"
              name="nickname"
              className="form-control"
              // assertTrue={{ name: 'passwordCheck', refex : /^.{1,1000}$/, message: 'not valid' }}
              required
              validators={['assertTrue', { name: '2~10', regex: /^.{2,10}$/ }]}
              disabled={submitting || this.ready && this.isAsyncValidating('nickname')}
            />
            <div>&nbsp;{this.ready && this.isTouched('nickname') && this.syncValidate('nickname')}</div>
          </div>
        </div>

        {/* <button type="submit" > ddddd </button> */}
        <Button color="primary" type="submit" block disabled={submitting}>{this.ready && this.isAsyncValidating() ? 'validating' : submitting ? 'submitting' : 'Sign in'}</Button>
        <Button color="primary" type="reset" block disabled={submitting}>clear</Button>
        {/* {this.ready && this.isSyncValid() && this.isAsyncValid() ? 'valid to submit' : 'invaild to submit'} */}
        <br /><br /><br /><br /><br /><br />
      </Form>
    )
  }
}
