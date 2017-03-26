/* globals kurentoClient */
import React, {Component} from 'react';
import async from 'async';
import './App.css';
import Pipeline from './components/Pipeline';
import Utils from './Utils';

class App extends Component {
  KURENTO_URL = "ws://95.213.204.29:8889/kurento";
  ws;
  kurentoClientInstance;

  loadElementsInterval = 300;
  loadElementsQueue = [];
  loadElementsLock = false;

  updateConnectionsInterval = 500;
  updateConnectionsQueue = [];
  updateConnectionsLock = false;

  state = {
    pipelines: {}
  };

  loadElementsWorker() {
    setInterval(() => {
      if (this.loadElementsLock) return;
      if (!this.loadElementsQueue.length) return;

      this.loadElementsLock = true;

      let pipelines = [];

      this.loadElementsQueue.forEach((element) => {
        if (!(element.pipelineId in pipelines)) {
          pipelines.push(element.pipelineId);
        }
      });
      let fetchedElements = [];

      console.log('have to load', pipelines);

      let errorCallback = (error) => {
        this.loadElementsLock = false;
        this.kurentoError(error);
      };

      this.manager((error, manager) => {
        if (error) return errorCallback(error);

        manager.getPipelines((error, kPipelines) => {
          if (error) return errorCallback(error);

          async.forEachOf(kPipelines, (kPipeline, key, pipelineCallback) => {
            if (pipelines.indexOf(kPipeline.id) < 0) {
              pipelineCallback();
              return;
            }

            kPipeline.getChildren((error, kChildren) => {
              if (error) return errorCallback(error);

              let children = [];

              kChildren.forEach((kChild) => {
                children.push(kChild.id);
              });

              this.loadElementsQueue.forEach((element) => {
                if (children.indexOf(element.fullId) >= 0) {
                  console.log('have to assign', element.fullId);

                  kChildren.forEach((kChild) => {
                    if (kChild.id ===element.fullId) {
                      fetchedElements.push(kChild);
                    }
                  });
                }
              });

              pipelineCallback();
            })
          }, (error) => {
            if (error) return this.kurentoError(error);

            this.assignKElements(fetchedElements);
            this.loadElementsQueue = [];
            this.loadElementsLock = false;
          })
        });
      });
    }, this.loadElementsInterval)
  }

  updateConnectionsWorker() {
    setInterval(() => {
      if (this.updateConnectionsLock) return;
      if (!this.updateConnectionsQueue.length) return;
      this.updateConnectionsLock = true;

      let fetchedConnections = [];

      async.forEachOf(this.updateConnectionsQueue, (queueElement, key, callback) => {
        let changes = {
          sinkConnections: [],
          sourcesConnections: []
        };

        this.fetchElementConnectionInfo(queueElement.kElement, changes, () => {
          fetchedConnections.push({
            queueElement,
            changes
          });

          callback();
        });
      }, (error) => {
        if (error) return this.kurentoError(error);

        let pipelines = this.state.pipelines;

        fetchedConnections.forEach((conn) => {
          let el = conn.queueElement;

          pipelines[el.pipelineId].elements[el.elementId] =
            {...pipelines[el.pipelineId].elements[el.elementId],...conn.changes}
        });

        this.setState({pipelines: pipelines});

        this.updateConnectionsQueue = [];
        this.updateConnectionsLock = false;
      });
    }, this.updateConnectionsInterval)
  }

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
    this.loadElementsWorker();
    this.updateConnectionsWorker();

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

              this.fetchElementConnectionInfo(kElement, element, () => {
                pipeline.elements[element.id] = element;
                elementCallback();
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

  fetchElementConnectionInfo(kElement, element, callback) {
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

      callback(element)
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
    console.warn('destroy pipeline', id);
    // REVIEW:
    let pipelines = this.state.pipelines;
    delete pipelines[id];
    this.setState({pipelines: pipelines});
  }

  createElement(pipelineId, elementId, fullId) {
    console.warn('create element', elementId);
    let element = {
      id: fullId,
      originalResponse: null
    };

    let pipelines = this.state.pipelines;
    pipelines[pipelineId].elements[elementId] = element;
    this.setState({pipelines: pipelines});

    this.loadElementsQueue.push({
      pipelineId: pipelineId,
      elementId: elementId,
      fullId: fullId
    })
  }

  destroyElement(pipelineId, elementId) {
    console.warn('destroy element', elementId);
    let pipelines = this.state.pipelines;
    delete pipelines[pipelineId].elements[elementId];
    this.setState({pipelines: pipelines});
  }

  assignKElements(kElements) {
    let pipelines = this.state.pipelines;

    kElements.forEach((kElement) => {
      let [pipelineId, elementId] = Utils.parseId(kElement.id);

      pipelines[pipelineId].elements[elementId].originalResponse = kElement;
    });

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

  connChanged(elementInfo) {
    if (this.updateConnectionsLock === true) {
      setTimeout(this.connChanged.bind(this, elementInfo), 200);
    }

    this.updateConnectionsQueue.push(elementInfo);
  }

  render() {
    let pipelines = [];

    for (let key of Object.keys(this.state.pipelines)) {
      let pipeline = this.state.pipelines[key];
      pipelines.push(<Pipeline pipeline={pipeline} key={key} connChanged={this.connChanged.bind(this)}></Pipeline>);
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
