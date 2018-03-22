## 기본 설명
* react containment방식으로 JXS를 구성할 수 있다.
* 자식 노드로서, 모든 element 및  component를 사용할 수 있고, 만약 그것이 built-in input이나 이 Form의 Input이라면 이 Form에 종속성을 가진다.
* 불러오기 `import Form, { Input } from '...'`

## 셈플 페이지
  http://roro-form.surge.sh/

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

```

## 특이사항
* Form attributes에 `{...this.state} control={this}`를 선언하는 것은 필수
* react expression에 this.ready와 함께 다양한 메소드들을 활용할 수 있다. 
  * 예) `this.ready && this.isAsyncValidating()`

## 검증 인터페이스
* 기본적인 검증 객체 
```
validator : String || { name : String, regex : RegExp || api : function, async : boolean [Optional], message : String [Optional] }
```
  * name은 중복될 수 없고, html5 attribute 이름들과 같을 수 없습니다.
  * api는 Boolean을 리턴하는 promise를 리턴해야합니다. 
* attributes에 선언 
```jsx
<input validators={[ validator1, validator2, ...]} ... />
```
* 검증의 순서는 validators의 index와 동일하고, async일 경우는 순서에서 제외됩니다.
* html5 built-in attribute(required, pattern, ...)등을 해석하여 validator를 만들어서 가장 끝(required는 앞) 혹은 같은 이름의 String으로 선언된 순서에 삽입됩니다.

## 메소드 리스트 (Form으로 구성하는 JSX에 사용)
* 'getValue(name : String) : String'
  * state로부터 value를 받아옵니다

* 'isTouched(name : String) : Boolean'
  * state로부터 touched를 확인합니다.

* 'isSyncValid : boolean'
  * 모든 필드가 synchromous valid한지 확인
  
* 'syncValidate(name : String, value : String [Optional]) : String '
  * name을 가진 필드를 검증, value를 입력하면 react state에서 제어하는 value를 무시하고 주어진 value로 검증
  
* 'syncValidateFull(name : String, value : String [Optional]) : Array<String>'
  * name을 가진 필드를 검증, array로 메세지를 출력
  
* 'asyncValidate(name : String, value : String [Optional]) : undefined'
  * name을 가진 필드를 검증, value를 입력하면 react state에서 제어하는 value를 무시하고 주어진 value로 검증
  
* 'isAsyncValidating(name : String [Optional]) : Boolean'
  * (해당 필드에 관해) processing이 있다면 true

* 'isAsyncRejected(name : String [Optional]) : Boolean'
  * (해당 필드에 관해) rejected가 있다면 true
  
* 'getAsyncError(name : String) : Array<{ name : String, message: String }>'
  * rejected된 검증에 관하여 결과를 리턴

* 'isAsyncIdleField(name : String) : Boolean'
  * async 검증을 수행하였는지 확인합니다.

* 'getAsyncIdleFields : Array<String>'
  * async 검증하지 않은 field 이름의 배열을 리턴합니다.
  
* 'isAsyncValid(name : String [Optional], lowerBound = 'processing' : String [Optional]) : boolean'
  * lowerBound가 processing이면, processing이 있어도 true, lowerBound가 resolved이면 모든 항목이 resolved이어야 합니다. 
  * name은 특정 필드를 지칭, 없으면 모든 필드
  * resolved여도 현재 state의 value와 다르다면 false
  
* 'getProcessingPromises : Array<Promise>'
  * state에서의 상태가 processing인 promise를 받아옵니다.
  * promise가 실제로 resolved여도 state가 processing이라면 리턴 값에 포함됩니다. react의 제어 플레임에 동기화되어 있습니다.

## Submit Interface
* Form attributes는 submit에 관련하여, onSubmit, onSuccess, onFailure를 구현할 수 있습니다.
* OnSubmit은 프로미스를 리턴해야합니다.
* 내부에서 프로미스를 다루는 코드는 아래와 같습니다. 
```
this.props.onSubmit(e).then(this.props.onSuccess || this.handleAfterSubmitCompletion, this.props.onFailure || this.handleAfterSubmitCompletion)
```
* handleAfterSubmitCompletion은 submitting을 false로 만드는 함수입니다.

## issues
```
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
// issue 3 : customizing 혹은 logging을 위해 다양한 hook을 제공해야한다. promise의 대부분 stack에서 logging할 수 있도록 할 것이다.
// issue 3 : suppressBuiltInValidation 구현, Input은 default true, input은 default false 

// extra
// issue 9 : loop performance 개선
// issue 9 : PureComponent와 immutability, nested default, Object.assign 재고
// issue 9 : componentDidCatch 사용성 테스트, 좋은 인터페이스인가
// issue 9 : dev logging, dev minifying 구현 (__DEV__)
// issue 9 : chrome dev tool perfomance test
// issue 9 : 동적인 필드 추가 등, 타 api들의 재미있는 UI를 구현해야한다.
// issue 9 : versioning을 알아보고, npm 배포 방법을 알아본다
```
