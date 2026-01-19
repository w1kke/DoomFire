const DEFAULT_SETTINGS = Object.freeze({
  presetId: "cozy_amber",
  size: 0.7,
  intensity: 0.6,
  heat: 0.5,
  seed: 1,
});

const PALETTES = {
  cozy_amber: [
    [0, 0, 0],
    [32, 0, 0],
    [64, 16, 0],
    [96, 32, 0],
    [128, 64, 0],
    [160, 96, 0],
    [192, 128, 16],
    [224, 160, 48],
    [255, 192, 80],
    [255, 224, 128],
    [255, 240, 192],
    [255, 255, 255],
  ],
  copper_blue: [
    [0, 0, 0],
    [16, 8, 32],
    [32, 16, 64],
    [48, 32, 96],
    [64, 48, 128],
    [80, 64, 160],
    [96, 96, 192],
    [112, 128, 208],
    [128, 160, 224],
    [160, 192, 240],
    [208, 224, 248],
    [255, 255, 255],
  ],
  mystic_violet: [
    [0, 0, 0],
    [24, 0, 32],
    [48, 0, 64],
    [72, 16, 96],
    [96, 32, 128],
    [120, 48, 160],
    [144, 64, 192],
    [168, 96, 208],
    [192, 128, 224],
    [208, 160, 240],
    [224, 192, 248],
    [255, 255, 255],
  ],
  neon_lime: [
    [0, 0, 0],
    [8, 16, 0],
    [16, 32, 0],
    [32, 64, 0],
    [48, 96, 0],
    [64, 128, 0],
    [96, 160, 16],
    [128, 192, 32],
    [160, 224, 64],
    [192, 240, 96],
    [224, 248, 160],
    [255, 255, 255],
  ],
  rose_quartz: [
    [0, 0, 0],
    [32, 0, 16],
    [64, 0, 32],
    [96, 16, 48],
    [128, 32, 64],
    [160, 48, 80],
    [192, 64, 112],
    [208, 96, 144],
    [224, 128, 176],
    [240, 160, 208],
    [248, 192, 232],
    [255, 255, 255],
  ],
  ghost_flame: [
    [0, 0, 0],
    [8, 16, 24],
    [16, 32, 48],
    [24, 48, 72],
    [32, 64, 96],
    [48, 96, 128],
    [64, 128, 160],
    [96, 160, 192],
    [128, 192, 224],
    [160, 216, 240],
    [208, 240, 248],
    [255, 255, 255],
  ],
};

function createFireSimulation(settings = {}) {
  const normalized = normalizeSettings(settings);
  const palette = getPalette(normalized.presetId);
  const buffer = new Uint8Array(normalized.width * normalized.height);
  const rng = createRng(normalized.seed);
  const simulation = {
    width: normalized.width,
    height: normalized.height,
    buffer,
    rng,
    palette,
    settings: normalized,
  };

  seedBottomRow(simulation);
  return simulation;
}

function stepSimulation(simulation) {
  const { width, height, buffer, rng, settings } = simulation;
  const paletteMax = simulation.palette.length - 1;

  seedBottomRow(simulation);

  const decayMax = Math.max(1, Math.round(settings.intensity * 3));
  const spreadMax = Math.max(1, Math.round(settings.heat * 2));
  const next = buffer.slice();

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const belowIndex = (y + 1) * width + x;
      const belowValue = buffer[belowIndex];
      const decay = rng.nextInt(decayMax + 1);
      const spread = rng.nextInt(spreadMax * 2 + 1) - spreadMax;
      const dstX = clamp(x + spread, 0, width - 1);
      const nextValue = Math.max(belowValue - decay, 0);
      next[y * width + dstX] = clamp(nextValue, 0, paletteMax);
    }
  }

  buffer.set(next);
}

function renderFrame(simulation) {
  const { buffer, palette } = simulation;
  const frame = new Uint8ClampedArray(buffer.length * 4);

  for (let i = 0; i < buffer.length; i += 1) {
    const color = palette[Math.min(buffer[i], palette.length - 1)];
    const offset = i * 4;
    frame[offset] = color[0];
    frame[offset + 1] = color[1];
    frame[offset + 2] = color[2];
    frame[offset + 3] = 255;
  }

  return frame;
}

function seedBottomRow(simulation) {
  const { width, height, buffer, rng, palette, settings } = simulation;
  const maxIndex = palette.length - 1;
  const base = Math.round(settings.intensity * maxIndex);
  const jitterMax = Math.round(settings.heat * 2);

  const rowStart = (height - 1) * width;
  for (let x = 0; x < width; x += 1) {
    const jitter = rng.nextInt(jitterMax + 1);
    const value = clamp(base - jitter, 0, maxIndex);
    buffer[rowStart + x] = value;
  }
}

function normalizeSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const size = clampNumber(merged.size, 0, 1);
  const intensity = clampNumber(merged.intensity, 0, 1);
  const heat = clampNumber(merged.heat, 0, 1);
  const seed = clampInteger(merged.seed, 0, 2147483647);
  const presetId = typeof merged.presetId === "string" ? merged.presetId : "cozy_amber";

  const baseWidth = 64;
  const baseHeight = 32;
  const scale = 0.5 + size * 0.5;

  return {
    presetId,
    size,
    intensity,
    heat,
    seed,
    width: Math.max(8, Math.round(baseWidth * scale)),
    height: Math.max(4, Math.round(baseHeight * scale)),
  };
}

function getPalette(presetId) {
  return PALETTES[presetId] || PALETTES.cozy_amber;
}

function createRng(seed) {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return {
    next() {
      state = (state * 48271) % 2147483647;
      return state;
    },
    nextInt(max) {
      if (max <= 0) {
        return 0;
      }
      return this.next() % max;
    },
  };
}

function clampNumber(value, min, max) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  const rounded = Math.floor(value);
  return Math.min(Math.max(rounded, min), max);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

module.exports = {
  createFireSimulation,
  stepSimulation,
  renderFrame,
  normalizeSettings,
  getPalette,
};
