const { renderPreview } = require("./preview_renderer.js");

function createHost() {
  let liveSessionStarted = false;

  return {
    renderPreview(bundle, policy) {
      return renderPreview(bundle, policy);
    },
    startLiveSession() {
      liveSessionStarted = true;
    },
    isLive() {
      return liveSessionStarted;
    },
  };
}

module.exports = {
  createHost,
};
