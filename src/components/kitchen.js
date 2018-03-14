import React from 'react'
import { reduxForm, reducer } from 'redux-form'
import Table from 'components/table'

class Kitchen extends React.Component {

  constructor(props) {
    super(props)
    this.doSomething = this.doSomething.bind(this)
  }

  doSomething() {
    return 'i did something'
  }

  render() {
    console.log('Kitchen', this.props)
    console.log('Kitchen', this.props.children)
    const { children } = this.props;

    const childrenWithProps = React.Children.map(children, child => {
      if (child.type === Table)
        return React.cloneElement(child, { doSomething: this.doSomething }, 'aaaaaaa', 'bbbbbb')
      else if (child.type === 'input'){
        return React.cloneElement(child, {  })
      } else
        return child
    });

    return (
      <div>
        i am kitchen
        {this.props.foo}
        {childrenWithProps}
      </div>
    )
  }
}

// let Kitchen = props => (
//   <div>
//     i am kitchen
//     {props.foo}
//     {props.children}
//   </div>
// )

Kitchen.defaultProps = {
  foo: 'fooooooooo'
}

export default Kitchen