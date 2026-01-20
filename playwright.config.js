const { defineConfig } = require("@playwright/test");

const agentPort = Number.parseInt(process.env.A2A_PORT || "4174", 10);
const agentBaseUrl = `http://127.0.0.1:${agentPort}`;

module.exports = defineConfig({
  testDir: "test/e2e",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  },
  webServer: [
    {
      command: `bun packages/project-cozy-doomfire/src/server.ts --port ${agentPort}`,
      cwd: "agent/eliza-develop",
      url: `${agentBaseUrl}/cozy-doomfire/health`,
      timeout: 180000,
      reuseExistingServer: !process.env.CI,
      env: {
        SERVER_PORT: String(agentPort),
        NODE_ENV: "test",
        LOG_LEVEL: "warn",
      },
    },
    {
      command: "node src/server.js",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: "4173",
        HOST: "127.0.0.1",
        NODE_ENV: "test",
        PLAYWRIGHT: "1",
        A2A_ENDPOINT: `${agentBaseUrl}/cozy-doomfire/a2a`,
      },
    },
  ],
});
