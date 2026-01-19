function createLiveSession({ widget }) {
  const allowedSurfaces = Array.isArray(widget?.surfaceContract?.surfaceIds)
    ? widget.surfaceContract.surfaceIds
    : [];
  const allowedEvents = new Set(
    Array.isArray(widget?.events) ? widget.events.map((event) => event.type) : []
  );
  const surfaces = {};
  let live = false;
  let liveBadgeVisible = false;

  function start({ userInitiated }) {
    if (!userInitiated) {
      return {
        ok: false,
        error: {
          code: "user_gesture_required",
          message: "Live session requires explicit user action",
        },
      };
    }
    live = true;
    liveBadgeVisible = true;
    return { ok: true };
  }

  function isLive() {
    return live;
  }

  function isLiveBadgeVisible() {
    return liveBadgeVisible;
  }

  function getSurface(surfaceId) {
    return surfaces[surfaceId] || null;
  }

  function applyMessage(message) {
    if (!live) {
      return {
        ok: false,
        error: { code: "session_not_started", message: "Session is not live" },
      };
    }

    if (!message || typeof message !== "object") {
      return {
        ok: false,
        error: { code: "invalid_message", message: "Message must be an object" },
      };
    }

    if (message.surfaceUpdate) {
      return applySurfaceUpdate(message.surfaceUpdate);
    }

    if (message.beginRendering) {
      return applyBeginRendering(message.beginRendering);
    }

    return {
      ok: false,
      error: {
        code: "message_type_unsupported",
        message: "Unsupported message type",
      },
    };
  }

  function applySurfaceUpdate(update) {
    if (!update || typeof update !== "object") {
      return {
        ok: false,
        error: { code: "invalid_surface_update", message: "Invalid surfaceUpdate" },
      };
    }
    const surfaceId = update.surfaceId;
    if (!allowedSurfaces.includes(surfaceId)) {
      return {
        ok: false,
        error: { code: "surface_not_allowed", message: "Surface not allowed" },
      };
    }

    if (!surfaces[surfaceId]) {
      surfaces[surfaceId] = { components: {}, rootId: null };
    }

    const list = update.components;
    if (Array.isArray(list)) {
      list.forEach((component) => {
        if (component && typeof component.id === "string") {
          surfaces[surfaceId].components[component.id] = component;
        }
      });
    }

    return { ok: true };
  }

  function applyBeginRendering(begin) {
    if (!begin || typeof begin !== "object") {
      return {
        ok: false,
        error: {
          code: "invalid_begin_rendering",
          message: "Invalid beginRendering",
        },
      };
    }
    const surfaceId = begin.surfaceId;
    if (!allowedSurfaces.includes(surfaceId)) {
      return {
        ok: false,
        error: { code: "surface_not_allowed", message: "Surface not allowed" },
      };
    }

    if (!surfaces[surfaceId]) {
      surfaces[surfaceId] = { components: {}, rootId: null };
    }

    surfaces[surfaceId].rootId = begin.root || null;
    return { ok: true };
  }

  function dispatchEvent(event) {
    if (!live) {
      return {
        ok: false,
        error: { code: "session_not_started", message: "Session is not live" },
      };
    }

    if (!event || typeof event !== "object") {
      return {
        ok: false,
        error: { code: "invalid_event", message: "Event must be an object" },
      };
    }

    if (!allowedEvents.has(event.type)) {
      return {
        ok: false,
        error: { code: "event_not_allowed", message: "Event not allowed" },
      };
    }

    return { ok: true };
  }

  return {
    start,
    isLive,
    isLiveBadgeVisible,
    getSurface,
    applyMessage,
    dispatchEvent,
  };
}

module.exports = {
  createLiveSession,
};
