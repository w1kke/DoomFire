const { createDoomfireAgentPlugin } = require("./doomfire_agent_plugin.js");
const { createAgentService } = require("./service.js");

const plugin = createDoomfireAgentPlugin();
const server = createAgentService({ plugin });

const port = Number(process.env.AGENT_PORT) || 4174;
const host = process.env.AGENT_HOST || "127.0.0.1";
server.listen(port, host, () => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`Agent running at http://${host}:${port}`);
  }
});
