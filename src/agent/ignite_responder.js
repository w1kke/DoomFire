const PHASES = ["collecting", "stacking", "striking", "burning"];

function respondToIgnite({ event }) {
  if (!event || event.type !== "fire.applySettings") {
    return [
      {
        narration: {
          phase: "idle",
          text: "Awaiting Ignite.",
          stepIndex: 0,
        },
      },
    ];
  }

  const updates = PHASES.slice(0, 3).map((phase, index) => ({
    narration: {
      phase,
      text: phaseText(phase),
      stepIndex: index + 1,
    },
  }));

  updates.push({
    narration: {
      phase: "burning",
      text: phaseText("burning"),
      stepIndex: PHASES.length,
    },
    applied: { ...event.payload },
  });

  return updates;
}

function phaseText(phase) {
  switch (phase) {
    case "collecting":
      return "Collecting kindling...";
    case "stacking":
      return "Stacking the logs...";
    case "striking":
      return "Striking the match...";
    case "burning":
      return "The fire settles into a steady glow.";
    default:
      return "...";
  }
}

module.exports = {
  respondToIgnite,
};
