import React, { Component } from 'react'

export default class Table extends Component {

  constructor(props){
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.state = { num : 0}
  }

  handleClick(){
    console.log(this)
    // this.state.num = 1
    // this.setState((prev,props)=>{console.log(prev.num); return {num : ++prev.num}})
    // this.state.num = 2
    // this.setState((prev,props)=>{console.log(prev.num)})
    // this.state.num = 3

  }

  render() {
    console.log('Table', this.props)
    return (
      <div>
        <div onClick={this.handleClick}>
          click me
        </div>
        {this.props.children}
      </div>
    )
  }
}
