import React from "react";
// import { Field, reduxForm } from "redux-form";
import * as RF from "redux-form";
import { Button } from 'reactstrap'

// console.log(RF)

const reduxTest = () => {
  console.log('reduxTest', 'startAsyncValidation')
  RF.startAsyncValidation('loginForm')
}

const renderField = ({
  input,
  label,
  type,
  meta
}, ...rest) => {
  console.log('meta', meta)
  console.log('input', input)
  console.log('xxxxxxx', meta.asyncValidating)
  return (
    <div className="input-container">
      <label>{label + (meta.asyncValidating ? ' : validating' : '')}</label>
      <div className={meta.asyncValidating ? "async-validating" : ""}>
        <input {...input} className="form-control" type={type} placeholder={label} disabled={meta.submitting || Boolean(meta.asyncValidating)} />

        {meta.touched && meta.error && <span className="error">{meta.error}</span>}
      </div>
    </div>
  )
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const validate = (values, props) => {
  console.log('validate', props, props.asyncErrors, props.error)
  const errors = props.asyncErrors || {}

  if (!values.username) {
    errors.username = 'Required'
  }
  // else if (typeof props.asyncErrors === 'object') {
  //   errors.username = props.asyncErrors.validity.username
  // }
  if (!values.password) {
    errors.password = 'Required'
  }
  return errors
}

const asyncValidate = (values, dispatch, props, name) => {
  console.log('async validation start', values)
  return sleep(2000).then(() => {
    console.log('async validation end')
    if (["john", "paul", "george", "ringo"].includes(values.username)) {
      // return 'eeeeeeeee'
      // return {username}
      return { username: "already in use" };
    }
  });
  // const usernameValue = values.username;
  // if ((props.asyncErrors && props.asyncErrors.log) && props.asyncErrors.log.username.value === usernameValue) 
  //   return new Promise((s)=>{s(props.asyncErrors)})
  // return sleep(2000).then(() => {
  //   // simulate server latency
  //   console.log('async validation end')
  //   // (!log || log.username === values.username) && 
  //   if ( ["john", "paul", "george", "ringo"].includes(values.username)) {
  //     // return 'eeeeeeeee'
  //     // return {username}
  //     return { username : "사용중" , log : {username : {value  : values.username, message : '사용중' }}};
  //   } 
  // });
};

function shouldAsyncValidate(state) {
  console.log('shouldAsyncValidate', state, !state.asyncErrors || state.asyncErrors[state.blurredField])
  // return state.syncValidationPasses 
  return state.syncValidationPasses && state.trigger === 'blur' && (!state.asyncErrors || !state.asyncErrors[state.blurredField])
}

export const handleSubmit = (values, dispatch, props) => {
  console.log('submit starts values props', values, props)
  console.log('submit starts props.asyncValidating', props.asyncValidating)
  return new Promise(resolve => {
    setTimeout(() => {
      // simulate server latency
      // window.alert(`You submitted:\n\n${JSON.stringify(values, null, 2)}`)
      console.log('submit props.asyncValidating', props.asyncValidating)
      resolve()
    }, 4000)
  }).then(() => { console.log('submit ends') })
}

class AsyncValidationForm extends React.Component {

  constructor(props) {
    super(props)
    this.profileList = ["preventAsyncValidationOnSubmit", "preventSubmit"] // shouldAsyncValidate에서 validate only on blur를 state로 변경 불가.
    this.state = {
      profile: this.profileList[0]
    }
    this.applyProfile = this.applyProfile.bind(this)
  }

  applyProfile(e) {
    const { value } = e.target
    this.setState(() => ({
      profile: this.profileList.indexOf(value) !== -1 ? value : this.profileList[0]
    }))
  }

  render() {
    const { handleSubmit, pristine, reset, submitting, asyncValidating } = this.props; // asyncValidating 추가
    console.log("AsyncValidationForm props", this.props); // log 추가1

    // let xxx = function () { console.log(props.asyncValidating) }
    // xxx.bind(this)
    return (
      <div>
        <h1 onClick={() => { reduxTest() }}>redux-form</h1>
        <p>blur이외에도 submit에 asyncValidation을 하는 것이 redux-form 공식문서의 <a href="https://codesandbox.io/s/nKlYo387">예제</a>이지만,
          <br /> 이미 async 검증한 것을 submit에서 다시 하는 것은 좋지 않다고 생각한다.
          <br /> 그런데 그렇게 하더라도 그 동작도 이상한데, sumbit의 async 검증에서 async validation이 적용된 field에 asyncValidating state가 false로 유실되는 버그도 있다.
          <br /> 그래서, 아래의 두가지 경우만을 고려했다. 전자는 submit에서 이미 async를 기다리지 않고 submit handler를 수행하여 요청해버리기때문에 그것을 기다리는 코드를 구현 해야하는데,
          <br /> submit handler의 args에는 async의 Promise객체를 받아올 수 없으며, 제공되는 어떠한 redux action으로도 그것을 다룰 수 없다.
          <br /> 그래서 정상적으로 동작하는 UX를 고려해보면, 아래의 후자처럼 blur이벤트에 asyncValidation이 작동할때 submit을 막는 것 뿐이다.
          <br /> 하지만 내가 기대하는 UX는 async validation이 진행중이라면 submit이벤트 발생 시, 진행중인 validation을 모두 처리하고 submit하는 것이다.
          <br /> 더러운 편법을 사용하면 모든 것을 가능하게 할 수 있지만, 그렇게 한다면 이 api를 사용할 이유가 없으므로 redux-form은 사용하지 않기로 한다. (github issue도 검토하였습니다. 관련 이슈는 없었는데, 이 이슈는 최근에 해결된 버그들 이후의 것이기 때문인 것 같습니다.)
           </p>
        <input type="button" className={this.state.profile === this.profileList[0] ? "selected" : ""} value={this.profileList[0]} onClick={this.applyProfile} />
        <input type="button" className={this.state.profile === this.profileList[1] ? "selected" : ""} value={this.profileList[1]} onClick={this.applyProfile} />
        {/* <input type="button" className={this.state.profile === this.profileList[2] ? "selected" : ""} value={this.profileList[2]} onClick={this.applyProfile} /> */}
        <form className="form-signin" onSubmit={handleSubmit}>
          <RF.Field
            name="username"
            type="text"
            onBlur={() => console.log('onBlur')}
            component={renderField}
            label="Username"
          />
          <RF.Field
            name="password"
            type="password"
            component={renderField}
            label="Password"
          />
          <div>
            <Button color="primary" block type="submit" disabled={submitting || (this.profileList[1] === this.state.profile && Boolean(asyncValidating))}>{submitting ? 'submitting' : asyncValidating ? 'validating ' + '\'' + asyncValidating + '\'' : 'Sign Up'}</Button>
            {/* <Button color="primary" block type="submit" disabled={submitting}>{  submitting? 'submitting' : asyncValidating? 'validating ' + '\'' + asyncValidating+ '\''   :'Sign Up'}</Button> */}
            <Button color="primary" block type="button"
              disabled={pristine || submitting}
              onClick={reset}>Clear Values</Button>
          </div>
        </form>
      </div>
    );

  }
};

export default RF.reduxForm({
  form: "loginForm", // a unique identifier for this form
  validate,
  asyncValidate,
  asyncBlurFields: ["username"],
  shouldAsyncValidate
})(AsyncValidationForm);
