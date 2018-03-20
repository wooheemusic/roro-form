## 기본 설명
* react containment방식으로 JXS를 구성할 수 있다.
* 자식 노드로서, 모든 element 및  component를 사용할 수 있고, 만약 그것이 built-in input이나 이 Form의 Input이라면 이 Form에 종속성을 가진다.
* 불러오기 `import Form, { Input } from '...'`

## 기본 예제
```jsx
<Form {...this.state} control={this} onSubmit={this.handleSubmit} >
  <Input name="username" />
  <input name="password" type="password" />
  <button type="submit">Sign in</button>
  <button type="reset">reset</button>
</Form>
```

## 응용 예제
```jsx
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

## 특이사항
* Form attributes에 `{...this.state} control={this}`를 선언하는 것은 필수
* react expression에 this.ready와 함께 다양한 메소드들을 활용할 수 있다. 예) `this.ready && this.isAsyncValidating()`

## 검증 인터페이스
* 기본적인 검증 객체 
```
validator : String || { name : String, regex : RegExp || api : function, async : boolean [Optional], message : String [Optional] }
```
* attributes에 선언 
```jsx
<input validators={[ validator1, validator2, ...]} ... />
```
* 검증의 순서는 validators의 index와 동일하고, async일 경우는 순서에서 제외됨

## 메소드 리스트 (Form으로 구성하는 JSX에 사용)
* isSyncValid : boolean
  * 모든 필드가 synchromous valid한지 확인
* syncValidate(name : String, value : String [Optional]) : String 
  * name을 가진 필드를 검증, value를 입력하면 react state에서 제어하는 value를 무시하고 주어진 value로 검증
* syncValidateFull(name : String, value : String [Optional]) : Array 
  * name을 가진 필드를 검증, array로 메세지를 출력
* asyncValidate(name : String, value : String [Optional]) : undefined
  * name을 가진 필드를 검증, value를 입력하면 react state에서 제어하는 value를 무시하고 주어진 value로 검증
* isAsyncValidating(name : String [Optional]) : boolean
  * 진행중인 async validation이 있다면 true를 출력, name을 입력하면 해당 필드에 관해서만 출력.
  * idle을 체크하지 않음
* getAsyncRejection(name : String) : Array
  * 이미 async 검증을 했다면, 에러 메세지를 array로 출력
  * idle을 체크하지 않음
* getAsyncStatusArray(name : String) : Array 
  * 현재 async 검증의 상태를 리턴
  * `['resolved', 'processing', 'rejected', 'idle', ... ]`
* isAsyncValid(lowerBound = 'processing' : String, name : String [Optional]) : boolean
  * lowerBound가 processing이면, processing이 있어도 true, lowerBound가 resolved이면 모든 항목이 resolved이어야 합니다.
  * name은 특정 필드를 지칭, 없으면 모든 필드
* getProcessingPromises : Array<Promise>
  * state에서의 상태가 processing인 promise를 받아옵니다.
  * promise가 실제로 resolved여도 state가 processing이라면 리턴 값에 포함됩니다. react의 제어 플레임에 동기화되어 있음.

