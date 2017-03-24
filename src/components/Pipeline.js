import React, {Component} from 'react';
import Element from './Element';


export default class Pipeline extends Component {
  render() {
    let elements = [];

    for (let key of Object.keys(this.props.pipeline.elements)) {
      let element = this.props.pipeline.elements[key];
      elements.push(<Element element={element} key={element.id}></Element>);
    }

    return (
      <div className="pipeline">
        <h3>Pipeline: {this.props.pipeline.id}</h3>
        <div className="card-deck">
          {elements}
        </div>
      </div>
    )
  }
}
