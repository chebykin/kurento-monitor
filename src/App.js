/* globals kurentoClient */
import React, {Component} from 'react';
import async from 'async';
import './App.css';
import Pipeline from './components/Pipeline';

class App extends Component {
  KURENTO_URL = "ws://95.213.204.29:8889/kurento";
  ws;

  state = {
    pipelines: {}
  };

  kurentoError(e) {
    console.error(e)
  }

  connect2Kurento() {
    console.log('hedy');

    let pipelines = {};

    kurentoClient(this.KURENTO_URL, (error, client) => {
      if (error) return this.kurentoError(error);

      client.getServerManager((error, manager) => {
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
                      element.sinkConnections = kConnections;
                      sinksCallback();
                    });
                  },
                  (sourcesCallback) => {
                    kElement.getSourceConnections((error, kConnections) => {
                      element.sourcesConnections = kConnections;
                      sourcesCallback();
                    });
                  }
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
          });
        })
      });
    });
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
