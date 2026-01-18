# 08 — Sound asset policy (Pixabay)

## Plan (MVP)
- Use a single long fire crackle audio file (e.g., ~5 minutes) to reduce perceived looping.
- Loop it with slight randomization:
  - small gain modulation
  - tiny playbackRate drift
  - occasional short fade-in/out at loop boundary

## Source
Pixabay offers royalty-free sound effects with a simple content license.

For MVP:
- Download one crackling-fire MP3 from: https://pixabay.com/th/sound-effects/search/crackling%20fire/
- Store it in `assets/audio/fire_crackle.mp3` (not included in this zip).

## License cautions
From Pixabay's license summary/FAQ:
- You can use content for commercial and non-commercial purposes.
- You **cannot sell or redistribute** the content on a standalone basis.
- Depicted brands/trademarks in content have additional restrictions.

Practical rule for MVP:
- Use it as part of the rendered experience (not as a standalone downloadable asset in this prototype).
- Keep a record of the original download URL and any license certificate.
