import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// import Kitchen from 'components/kitchen'
// import Table from 'components/table'
// import ReactForm from 'components/reactForm'

import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'
import ReduxForm, {handleSubmit } from 'components/reduxForm'

import LoginForm from 'components/login-form'
import './core.scss'

const reducer = combineReducers({
  form: formReducer // mounted under "form"
})

// combineReducers({
//   form: formReducer.validation({
//     loginForm: validate // "loginForm" is the form name given to reduxForm() decorator
//   })
// })

const store = createStore(reducer)

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Roro Form </h1>
        </header>
        {/* <Kitchen aaa="111">
          <div>not Table</div>
          <Table bbb="222">
            is there a spoon?
          </Table>
          <Table ccc="333">
            is there a spoon 2?
          </Table>
        </Kitchen > */}
        {/* <ReactForm /> */}
        <LoginForm name="Roro Form"/>
        <Provider store={store}>
          <ReduxForm onSubmit={handleSubmit}/>
        </Provider>
      </div>
    );
  }
}

export default App;
