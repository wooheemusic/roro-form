##  기본 설명
  react containment방식으로 JXS를 구성할 수 있다.
  자식 노드로서, 모든 element 및  component를 사용할 수 있고, 만약 그것이 built-in input이나 이 Form의 Input이라면 이 Form에 종속성을 가진다.
  
## 사용 예
```
<Form {...this.state} control={this}
  className="form-signin"
  initState={initState}
  resetState={{}}
  onSubmit={this.handleSubmit}
  onSuccess={this.onSuccess}
  onFailure={this.onFailer}
>
  <h1> Login Form </h1>
  <div className="input-container">
    <Input name="username"
      required
      validators={['required', 'wwww', 'email']}
      assertTrue={{ name: 'emailExist', api: () => { return asyncApi(3000, true) }, async: true, message: 'not exist' }} // api should return a boolean
      assertFalse={{ name: 'asserFALSE', regex: /^.{12,14}$/ }}
      className="form-control"
      disabled={submitting || this.ready && this.isAsyncValidating('username')} // (false && username && username.promises.length > 0)} 
    />
    <div>&nbsp;{this.ready && (
      (this.isAsyncValidating('username') && 'asyncValidating')
      || (this.isTouched('username') && this.syncValidate('username'))
      || this.getAsyncRejection('username')[0]
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
        assertTrue={{ name: 'passwordCheck', api: () => { return asyncApi(4000, false) }, async: true, message: 'not valid' }}
        required
        validators={[{ name: '5~10', regex: /^.{5,15}$/ }, { name: 'passwordCheck', api: () => { return asyncApi(3000, true) }, async: true, message: 'not valid' }]}
        disabled={submitting || this.ready && this.isAsyncValidating('password')}
      />
      <div>&nbsp;{this.ready && (
        (this.isAsyncValidating('password') && 'asyncValidating')
        || (this.isTouched('password') && this.syncValidate('password'))
        || this.getAsyncRejection('password')[0]
      )
      }</div>
    </div>
  </div>
  <Button color="primary" type="submit" block disabled={submitting}>{this.ready && this.isAsyncValidating() ? 'validating' : submitting ? 'submitting' : 'Sign in'}</Button>
  <Button color="primary" type="reset" block disabled={submitting}>clear</Button>
</Form>
```
