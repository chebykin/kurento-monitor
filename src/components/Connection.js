import React, { Component } from 'react';


export default class Connection extends Component {

  constructor(props) {
    super(props);

    let [idKurento, elementType] = this.peer().split('/')[1].split('.');
    this.id = idKurento.split('_')[0];
    this.elementType = elementType;
    this.isSink = this.props.connType === 'sink';
    console.log("parsed is ", elementType);
  }

  peer() {
    if (this.isSink) {
      return this.props.data.sink;
    } else {
      return this.props.data.source;
    }
  }

  render() {
    let connClass = `list-group-item conn conn-${this.props.connType}`;

    if (this.isSink && (
      this.props.media.audioFlowingIn
      || this.props.media.videoFlowingIn
      || this.props.media.dataFlowingIn
      )) {
      connClass += ' media-flow-in';
    }

    if (!this.isSink && (
        this.props.media.audioFlowingOut
        || this.props.media.videoFlowingOut
        || this.props.media.dataFlowingOut
      )) {
      connClass += ' media-flow-out';
    }

    let direction = this.isSink ? 'to' : 'from';

    return (
      <li className={connClass}>
        {this.id} <br/>
        {this.props.connType}&nbsp;{direction}<br/>
        {this.elementType}<br/>
        </li>
    );
  }
}
