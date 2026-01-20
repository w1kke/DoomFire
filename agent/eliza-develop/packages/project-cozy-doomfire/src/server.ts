import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '../../..');

// Bun resolves workspace packages from the current working directory.
if (process.cwd() !== MONOREPO_ROOT) {
  process.chdir(MONOREPO_ROOT);
}

const port = resolvePort(process.argv.slice(2));

if (!process.env.PGLITE_WASM_MODE) {
  process.env.PGLITE_WASM_MODE = 'node';
}

ensureElizaBuild();

const { AgentServer } = await import('@elizaos/server');
const { character } = await import('./character.ts');
const { default: doomfirePlugin } = await import('./plugin.ts');

const server = new AgentServer();

await server.start({
  port,
  agents: [
    {
      character,
      plugins: [doomfirePlugin],
    },
  ],
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

function resolvePort(args: string[]): number | undefined {
  const fromArgs = readPortArg(args);
  if (fromArgs !== undefined) {
    return fromArgs;
  }

  const envPort = process.env.SERVER_PORT || process.env.PORT;
  if (!envPort) {
    return undefined;
  }

  const parsed = Number.parseInt(envPort, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('SERVER_PORT must be an integer between 1 and 65535.');
  }
  return parsed;
}

function readPortArg(args: string[]): number | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--port' || value === '-p') {
      const next = args[index + 1];
      if (!next) {
        throw new Error('Missing value for --port.');
      }
      const parsed = Number.parseInt(next, 10);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error('Port must be an integer between 1 and 65535.');
      }
      return parsed;
    }
  }
  return undefined;
}

function ensureElizaBuild(): void {
  const serverDist = path.join(MONOREPO_ROOT, 'packages', 'server', 'dist', 'index.js');
  const coreDist = path.join(MONOREPO_ROOT, 'packages', 'core', 'dist', 'node', 'index.node.js');
  const sqlDist = path.join(
    MONOREPO_ROOT,
    'packages',
    'plugin-sql',
    'dist',
    'node',
    'index.node.js'
  );

  if (existsSync(serverDist) && existsSync(coreDist) && existsSync(sqlDist)) {
    return;
  }

  const result = spawnSync('bun', ['run', 'build:server'], {
    cwd: MONOREPO_ROOT,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error('Failed to build ElizaOS server dependencies.');
  }
}
