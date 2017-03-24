import Connection from './Connection';


export default class Sink extends Connection {
  connType = "Sink";

  direction() {
    return 'to'
  }

  audioStyleClass() {
    return `media-state fa fa-volume-up ${this.props.media.audioFlowingOut ? " media-state-bright" : ""}`;
  }

  videoStyleClass() {
    return `media-state fa fa-video-camera ${this.props.media.audioFlowingOut ? " media-state-bright" : ""}`;
  }

  connStyleClass() {
    let connClass = `list-group-item conn conn-sink`;

    if (this.props.media.audioFlowingOut || this.props.media.videoFlowingOut) {
      connClass += ' conn-bright';
    }

    return connClass;
  }
}
