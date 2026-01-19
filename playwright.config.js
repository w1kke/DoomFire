const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "test/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "node src/server.js",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: "4173",
      HOST: "127.0.0.1",
      NODE_ENV: "test",
    },
  },
});
