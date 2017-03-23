import React, { Component } from 'react';


export default class Element extends Component {
  name() {
    return this.props.element.id.split('/')[1].split('.')[0].split('_')[0];
  }

  type() {
    return this.props.element.id.split('/')[1].split('.')[1];
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