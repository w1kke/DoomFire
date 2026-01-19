const DEFAULT_SETTINGS = Object.freeze({
  presetId: "cozy_amber",
  size: 0.5,
  intensity: 0.5,
  heat: 0.5,
});

function createIgniteController({ initialSettings = {}, dispatchEvent } = {}) {
  let staged = { ...DEFAULT_SETTINGS, ...initialSettings };
  let applied = { ...DEFAULT_SETTINGS, ...initialSettings };
  let narration = { phase: "idle", text: "Ready.", stepIndex: 0 };

  function updateStaged(partial) {
    staged = { ...staged, ...partial };
  }

  function ignite() {
    const event = {
      type: "fire.applySettings",
      payload: { ...staged },
    };

    if (typeof dispatchEvent === "function") {
      dispatchEvent(event);
    }

    return event;
  }

  function applyAgentUpdate(update) {
    if (update && update.applied) {
      applied = { ...applied, ...update.applied };
    }
    if (update && update.narration) {
      narration = { ...narration, ...update.narration };
    }
  }

  function getState() {
    return {
      staged: { ...staged },
      applied: { ...applied },
      narration: { ...narration },
    };
  }

  return {
    updateStaged,
    ignite,
    applyAgentUpdate,
    getState,
  };
}

module.exports = {
  createIgniteController,
};
