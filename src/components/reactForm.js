import { Form, Text } from 'react-form';
import React from 'react'


const required = (name) => {
  return (value) => !value || value.trim() === '' ? name + ' is a required field' : null
}

//username => !username || username.trim() === '' ? 'Username is a required field' : null

const asyncValidate = (username, ...x) => new Promise((resolve, reject) => {
  console.log('validation starts', x)
  setTimeout((...y) => {
    console.log('async validating', y)
    // Simulate username check
    if (['aaa', 'tanner', 'billy', 'bob'].includes(username)) {
      resolve({ error: 'That username is taken', success: null })
    }
    // Simulate request faulure
    if (username === 'reject') {
      reject('Failure while making call to validate username does not exist')
    }
    // Sumulate username success check
    resolve({
      success: 'Awesome! your username is good to go!'
    })
  }, 2000)
}
)

const handleSubmit = (values, e, formApi, ...x) => {
  alert(values)
  e.preventDefault()
  console.log('submit start', values, e, formApi, x)
}

const ErrorTemplate = ({ message }) => (<div> {message}</div>)

let ReactForm = (props) => {
  console.log(props)
  return (
    // <Form validateOnSubmit>
    <Form onSubmit={handleSubmit}>
      {(formApi) => {
        console.log('formApi', formApi)
        return (
          <form id="form6">
            <h1>react-form</h1>
            <div>
              <label htmlFor="username">username</label>
              <Text
                field="username" id="username"
                validate={required('username')} asyncValidate={!(formApi.validating && formApi.validating.username) && asyncValidate} />
              {formApi.errors && formApi.errors.username && <ErrorTemplate message={formApi.errors.username} />}
            </div>
            <div>
              <label htmlFor="password">password</label>
              <Text
                field="password" id="password"
                validate={required('password')} />
              {formApi.errors && formApi.errors.password && <ErrorTemplate message={formApi.errors.password} />}
            </div>
            <button type="submit" disabled={formApi.validating && formApi.validating.username} className="mb-4 btn btn-primary">
              Submit
        </button>
          </form>
        )
      }}
    </Form>
  )
}

export default ReactForm