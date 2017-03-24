import React, { Component } from 'react';


export default class Connection extends Component {

  constructor(props) {
    super(props);

    let [idKurento, elementType] = this.peer().split('/')[1].split('.');
    this.id = idKurento.split('_')[0];
    this.elementType = elementType;
  }

  peer() {
    return this.props.data.peer;
  }

  /**
   * Pale icons for audio and video connections
   * Bright icons for audio and video connections with flowing data
   * Bright icons for any data connection state
   * @returns {Array}
   */
  icons() {
    let elements = [];

    if (this.props.data['audio']) {
      elements.push(<i className={this.audioStyleClass()} key="audio" title="AUDIO"></i>);
    }

    if (this.props.data['video']) {
      elements.push(<i className={this.videoStyleClass()} key="video" title="VIDEO"></i>);
    }

    if (this.props.data['data']) {
      elements.push(<i className="media-state media-state-bright fa fa-keyboard-o" key="data" title="DATA"></i>);
    }

    return elements;
  }

  render() {
    return (
      <li className={this.connStyleClass()}>
        {this.id} <br/>
        {this.connType}&nbsp;{this.direction()}<br/>
        {this.elementType}<br/>
        {this.icons()}
      </li>
    );
  }
}
