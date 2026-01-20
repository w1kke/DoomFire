# Testing

## E2E (Playwright)
Run the Playwright regression suite (starts the host and agent servers via `playwright.config.js`):

```bash
npm run test:e2e
```

To check for flakes locally:

```bash
npx playwright test --repeat-each=3
```

## Full suite

```bash
npm test
```

## Notes
- The Playwright config sets `PLAYWRIGHT=1` for the host server, which injects `window.__PLAYWRIGHT__` and exposes `window.__doomfireTest`.
- Default ports: host `4173`, agent `4174`.
- Override the agent port locally with `A2A_PORT=PORT` if `4174` is in use.
- Playwright runs with `workers: 1` because the host is single-session and uses in-memory live state.
- Viewport/device scale are fixed in Playwright for stable canvas hashes.
- Install browser binaries if needed: `npx playwright install`.
- The Playwright E2E webServer starts the Eliza agent via `bun`.
