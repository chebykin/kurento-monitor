let Utils = {
  parseId: function(id) {
    let [pFull, eFull] = id.split('/');

    return [pFull, eFull, eFull.split('.')[1]];
  }
};

module.exports = Utils;
