import Connection from './Connection';


export default class Source extends Connection {
  connType = "Source";

  direction() {
    return 'to'
  }

  audioStyleClass() {
    return `media-state fa fa-volume-up ${this.props.media.audioFlowingIn ? " media-state-bright" : ""}`;
  }

  videoStyleClass() {
    return `media-state fa fa-video-camera ${this.props.media.audioFlowingIn ? " media-state-bright" : ""}`;
  }

  connStyleClass() {
    let connClass = `list-group-item conn conn-source`;

    if (this.props.media.audioFlowingIn || this.props.media.videoFlowingIn) {
      connClass += ' conn-bright';
    }

    return connClass;
  }
}
