# Skill: DoomFire renderer (Canvas/WebGL)

## Goal
Implement the classic DOOM fire effect as a deterministic, parameterized component.

## Suggested reference
- Deconstruction of the PSX DOOM fire effect: https://fabiensanglard.net/doom_fire_psx/

## Core algorithm
- Maintain a 2D buffer (width x height) of intensity indices.
- Seed the bottom row with high intensity values.
- Propagate upwards with a small random decay/spread.
- Map intensity indices through a palette to RGB.

## Parameters mapping
- `intensity` -> base seeding strength + number of propagation steps per frame.
- `size` -> render scale (pixel size) and/or simulation grid size.
- `heat` -> palette gradient (more white-hot top-end) + faster flicker.
- `presetId` -> palette selection.

## Determinism
- Use a seeded PRNG for spread jitter.
- Include `seed` in applied settings.
