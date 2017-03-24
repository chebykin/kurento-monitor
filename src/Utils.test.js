let test = require('tape');
let Utils = require('./Utils');

// TODO: rewrite using another framework
test('returns 2', (assert) => {
  assert.plan(3);

  let id = '17935fa2-5842-4d3d-ad4f-0915bae49748_kurento.MediaPipeline/ad609bed-f240-4c8b-aca1-ce9431055cf3_kurento.WebRtcEndpoint';
  let a = Utils.parseId(id);
  assert.equal(a[0], '17935fa2-5842-4d3d-ad4f-0915bae49748_kurento.MediaPipeline');
  assert.equal(a[1], 'ad609bed-f240-4c8b-aca1-ce9431055cf3_kurento.WebRtcEndpoint');
  assert.equal('WebRtcEndpoint', a[2]);
});
