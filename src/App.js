/* globals kurentoClient */
import React, {Component} from 'react';
import async from 'async';
import './App.css';
import Pipeline from './components/Pipeline';

class App extends Component {
  KURENTO_URL = "ws://95.213.204.29:8889/kurento";
  ws;
  kurentoClientInstance;

  state = {
    pipelines: {}
  };

  kurentoError(e) {
    console.error(e)
  }

  kurentoClient(callback) {
    if (this.kurentoClientInstance) {
      callback(null, this.kurentoClientInstance)
    } else {
      kurentoClient(this.KURENTO_URL, callback);
    }
  }

  connect2Kurento() {
    console.log('hedy');

    let pipelines = {};

    this.manager((error, manager) => {
      if (error) return this.kurentoError(error);

      manager.getPipelines((error, kPipelines) => {
        if (error) return this.kurentoError(error);

        async.forEachOf(kPipelines, (kPipeline, key, pipelineCallback) => {
          let pipeline = {
            id: kPipeline.id,
            originalResponse: kPipeline,
            elements: {}
          };

          pipelines[kPipeline.id] = pipeline;

          kPipeline.getChildren((error, kElements) => {
            if (error) return this.kurentoError(error);

            async.forEachOf(kElements, (kElement, key, elementCallback) => {
              let element = {
                id: kElement.id,
                originalResponse: kElement,
                sinkConnections: [],
                sourcesConnections: []
              };

              async.parallel([
                (sinksCallback) => {
                  kElement.getSinkConnections((error, kConnections) => {
                    element.sinkConnections = {};

                    kConnections.forEach((conn) => {
                      let key = conn.type.toLowerCase();
                      if (!element.sinkConnections[conn.source]) {
                        element.sinkConnections[conn.source] = {
                          peer: conn.source
                        };
                      }

                      element.sinkConnections[conn.source][key] = conn;
                    });

                    sinksCallback();
                  });
                },
                (sourcesCallback) => {
                  kElement.getSourceConnections((error, kConnections) => {
                    element.sourceConnections= {};

                    kConnections.forEach((conn) => {
                      let key = conn.type.toLowerCase();
                      if (!element.sourceConnections[conn.sink]) {
                        element.sourceConnections[conn.sink] = {
                          peer: conn.sink
                        };
                      }

                      element.sourceConnections[conn.sink][key] = conn;
                    });

                    sourcesCallback();
                  });
                },
                (mediaInCallback) => {
                  kElement.isMediaFlowingIn('AUDIO', (error, is) => {
                    element.audioFlowingIn = is;
                    mediaInCallback();
                  });
                },
                (mediaInCallback) => {
                  kElement.isMediaFlowingIn('VIDEO', (error, is) => {
                    element.videoFlowingIn = is;
                    mediaInCallback();
                  });
                },
                (mediaInCallback) => {
                  kElement.isMediaFlowingOut('AUDIO', (error, is) => {
                    element.audioFlowingOut = is;
                    mediaInCallback();
                  });
                },
                (mediaInCallback) => {
                  kElement.isMediaFlowingOut('VIDEO', (error, is) => {
                    element.videoFlowingOut = is;
                    mediaInCallback();
                  });
                },
              ], (error) => {
                if (error) return this.kurentoError(error);

                pipeline.elements[element.id] = element;
                elementCallback()
              });
            }, (error) => {
              if (error) return this.kurentoError(error);

              pipelineCallback();
            });
          });
        }, (error) => {
          if (error) return this.kurentoError(error);

          this.connect2KurentoDone(pipelines);
          this.setupServerObjectEvents();
        });
      })
    });
  }

  setupServerObjectEvents() {
      this.manager((error, manager) => {
        if (error) return this.kurentoError(error);

        manager.on('ObjectCreated', (event) => {
          let [pipelineId, elementId] = event.object.split('/');

          if (pipelineId && !elementId) {
            this.createPipeline(pipelineId)
          } else if (pipelineId && elementId) {
            this.createElement(pipelineId, elementId, event.object);
          } else {
            console.error("Unable to read ObjectCreated event:", event);
          }
        });

        manager.on('ObjectDestroyed', (event) => {
          let [pipelineId, elementId] = event.objectId.split('/');

          if (pipelineId && !elementId) {
            this.destroyPipeline(pipelineId)
          } else if (pipelineId && elementId) {
            this.destroyElement(pipelineId, elementId, event.object);
          } else {
            console.error("Unable to read ObjectDestroyed event:", event);
          }
        });
      });
  }

  manager(callback) {
    this.kurentoClient((error, client) => {
      if (error) return this.kurentoError(error);

      client.getServerManager(callback);
    });
  }

  createPipeline(id) {
    let pipeline = {
      id: id,
      originalResponse: null,
      elements: {}
    };

    // REVIEW:
    let pipelines = this.state.pipelines;
    pipelines[id] = pipeline;
    this.setState({pipelines: pipelines});

    this.manager((error, manager) => {
      // TODO
    });
  }

  destroyPipeline(id) {
    console.log('destroy pipeline', id);
    // REVIEW:
    let pipelines = this.state.pipelines;
    delete pipelines[id];
    this.setState({pipelines: pipelines});
  }

  createElement(pipelineId, elementId, fullId) {
    let element = {
      id: fullId,
      originalResponse: null
    };

    let pipelines = this.state.pipelines;
    pipelines[pipelineId].elements[elementId] = element;
    this.setState({pipelines: pipelines});

    // TODO: populate element info
  }

  destroyElement(pipelineId, elementId) {
    console.log('destroy element', elementId);
    let pipelines = this.state.pipelines;
    delete pipelines[pipelineId].elements[elementId];
    this.setState({pipelines: pipelines});
  }

  connect2KurentoDone(pipelines) {
    this.setState({
      pipelines: pipelines
    });
  }

  componentDidMount() {
    this.connect2Kurento();
  }

  render() {
    let pipelines = [];

    for (let key of Object.keys(this.state.pipelines)) {
      let pipeline = this.state.pipelines[key];
      pipelines.push(<Pipeline pipeline={pipeline} key={key}></Pipeline>);
    }

    return (
      <div className="container">
        <div className="row">
          {pipelines}
        </div>
      </div>
    );
  }
}

export default App;
