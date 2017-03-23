import React, { Component } from 'react';


export default class Element extends Component {
  name() {
    if (typeof(this.props.element.id) === 'string') {
      return this.props.element.id.split('/')[1].split('.')[0].split('_')[0];
    } else {
      return "not set";
    }
  }

  type() {
    if (typeof(this.props.element.id) === 'string') {
      return this.props.element.id.split('/')[1].split('.')[1];
    } else {
      return "not set";
    }
  }

  render() {
    return (
      <div className="endpoint card">
        <div className="card-block">
          <h4 className="card-title">{this.type()}</h4>
          <p className="card-text">{this.name()}</p>
        </div>
      </div>
    )
  }
}