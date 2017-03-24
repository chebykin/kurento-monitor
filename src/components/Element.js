import React, {Component} from 'react';
import Sink from './Sink';
import Source from './Source';


export default class Element extends Component {
  constructor(props) {
    super(props);

    this.kElement = this.props.element.originalResponse;

    this.sinks = this.props.element.sinkConnections || {};
    this.sources = this.props.element.sourceConnections || {};

    this.flowingIn = false;
    this.flowingOut = false;

    this.media = {};

    if (this.props.element.originalResponse) {
      this.media.audioFlowingIn = this.props.element.audioFlowingIn;
      this.media.videoFlowingIn = this.props.element.videoFlowingIn;
      this.media.audioFlowingOut = this.props.element.audioFlowingOut;
      this.media.videoFlowingOut = this.props.element.videoFlowingOut;
    }

    this.mapEvents()
  }

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

  sourceElements() {
    let sources = [];

    Object.keys(this.sources).forEach((key) => {
      let connData = this.sources[key];
      sources.push(<Source data={connData} media={this.media} key={key}/>);
    });

    return sources;
  }

  sinkElements() {
    let sinks = [];

    Object.keys(this.sinks).forEach((key) => {
      let connData = this.sinks[key];
      sinks.push(<Sink data={connData} media={this.media} key={key}/>);
    });

    return sinks;
  }

  mapEvents() {
    // ElementConnected
    // ElementDisconnected
    // MediaStateChanged
    // ConnectionStateChanged

    let kElement = this.props.element.originalResponse;

    if (!kElement) return;

    kElement.on('ElementConnected', (event) => {
      console.log('ElementConnected', event);
    });

    kElement.on('ElementDisconnected', (event) => {
      console.log('ElementDisconnected', event);
    });

    kElement.on('MediaStateChanged', (event) => {
      console.log('MediaStateChanged', event);
    });

    kElement.on('ConnectionStateChanged', (event) => {
      console.log('ConnectionStateChanged', event);
    });
  }

  render() {
    return (
      <div className="endpoint card">
        <div className="card-header">
          {this.type()}
        </div>
        <ul className="list-group list-group-flush">
          {this.sourceElements()}
        </ul>
        <div className="card-block">
          <h4 className="card-title"></h4>
          <p className="card-text">
            <small className="text-muted">{this.name()}</small>
          </p>
        </div>
        <ul className="list-group list-group-flush">
          {this.sinkElements()}
        </ul>
      </div>
    )
  }
}