/* globals BaseRtpEndpoint*/
import React, {Component} from 'react';
import Sink from './Sink';
import Source from './Source';
import Utils from '../Utils';


export default class Element extends Component {
  state = {
    sources: {},
    sinks: {}
  };

  constructor(props) {
    super(props);

    [this.pipelineId, this.elementId, this.elementType] = Utils.parseId(this.props.element.id);

    this.id = this.props.element.id;
    this.kElement = this.props.element.originalResponse;

    this.eventsMappend = false;
    this.mapEvents()
  }

  componentWillReceiveProps(nextProps) {
    this.updateState(nextProps);
  }

  componentWillUpdate() {
    // WARNING: cannot set state here
  }

  componentDidMount() {
    this.updateState(this.props);
  }

  componentWillUnmount() {
    this.unmapEvents();
  }

  componentDidUpdate() {

  }

  updateState(props) {
    this.setState({
      sinks: props.element.sinkConnections || {},
      sources: props.element.sourceConnections || {},
      media: {
        audioFlowingIn: props.element.audioFlowingIn,
        videoFlowingIn: props.element.videoFlowingIn,
        audioFlowingOut: props.element.audioFlowingOut,
        videoFlowingOut: props.element.videoFlowingOut,
      }
    });

    if (this.eventsMappend === false) {
      this.mapEvents();
    }
  }

  isBaseRtpEndpoint() {
    return this.elementType === 'WebRtcEndpoint' || this.elementType === 'RtpEndpoint';
  }

  isPlayerEndpoint() {
    return this.elementType === 'PlayerEndpoint';
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

    Object.keys(this.state.sources).forEach((key) => {
      let connData = this.state.sources[key];
      sources.push(<Source data={connData} media={this.state.media} key={key}/>);
    });

    return sources;
  }

  sinkElements() {
    let sinks = [];

    Object.keys(this.state.sinks).forEach((key) => {
      let connData = this.state.sinks[key];
      sinks.push(<Sink data={connData} media={this.state.media} key={key}/>);
    });

    return sinks;
  }

  onConnectionStateChanged(kElement) {
    this.props.connChanged({
      kElement,
      id: this.id,
      elementId: this.elementId,
      pipelineId: this.pipelineId,
    });
  }

  /**
   *
   * - ElementConnected
   * - ElementDisconnected
   * - MediaFlowOutStateChange
   * - MediaFlowInStateChange
   *
   *
   * RtpEndpointEvents/WebRtcEndpointEvents:
   *
   * - MediaStateChanged
   * - ConnectionStateChanged
   */
  mapEvents() {
    let kElement = this.props.element.originalResponse;

    if (!kElement) {
      return;
    }

    kElement.on('ElementConnected', (event) => {
      console.log('ElementConnected', event);
    });

    kElement.on('ElementDisconnected', (event) => {
      console.log('ElementDisconnected', event);
    });

    if (this.isBaseRtpEndpoint()) {
      kElement.on('ConnectionStateChanged', this.onConnectionStateChanged.bind(this, kElement));
      kElement.on('MediaStateChanged', this.onConnectionStateChanged.bind(this, kElement));
    }

    if (this.isPlayerEndpoint()) {
      kElement.on('EndOfStream', console.error);
    }

    kElement.on('Error', console.error);

    this.eventsMappend = true;
  }

  unmapEvents() {
    let kElement = this.props.element.originalResponse;

    if (!kElement) return;

    kElement.removeAllListeners();
    this.eventsMappend = false;
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