import React, { Component } from 'react'
import Form, { Input } from 'components/roro-form'
import 'components/any.scss'
import { Button } from 'reactstrap'
import authService from '../authService'
// import Kitchen from 'components/kitchen'
// import Table from 'components/table'


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default class LoginForm extends Component {

  constructor(props){
    super(props)
    this.state = {}
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmitSuccess(){
    console.log('server response succeeded')
    // 값을 리턴하면 Form에서 후처리에 사용할 수 있는데, 마땅한 인터페이스가 떠오르지 않는다. 일단은 무조건 리셋.
  }

  handleSubmit (){
    console.log('LoginForm handleSubmit')
    return sleep(2000).then(()=>{
      console.log('server response arrived')
    }).then(this.handleSubmitSuccess)
  }

  render() {
    console.log('LoginForm state', this.state) // check this.state and apply properties to JSX like 'disable={this.state.submitting}'
    const { submitting } = this.state
    let usernameValidating = this.state.username && this.state.username.validity && this.state.username.validity.isValid instanceof Promise
    return (

      // state={this.state} control={this} is required to update this.state 
      // initState is optional... redux를 사용하여 초기화 할 수 있을 것입니다.
      <Form state={this.state} control={this} className="form-signin" initState={{username: {value : "osc"} }} onSubmit={this.handleSubmit}> 
        <div className="input-container">
          <Input name="username" className="form-control" disabled={submitting} />
        </div>
        <div className="input-container">
          <div>
            <input name="password" type="password" className="form-control" disabled={submitting}/>
          </div>
        </div>
        <Button color="primary" type="submit" block disabled={submitting || usernameValidating}>Sign in</Button>
        <Button color="primary" type="reset" block disabled={submitting}>clear</Button>
      </Form>
    )
  }
}
