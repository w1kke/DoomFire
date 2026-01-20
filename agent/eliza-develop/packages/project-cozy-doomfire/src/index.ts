import type { IAgentRuntime, Project, ProjectAgent } from '@elizaos/core';

import { character } from './character.ts';
import doomfirePlugin from './plugin.ts';

const initCharacter = (_runtime: IAgentRuntime) => {};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => initCharacter(runtime),
  plugins: [doomfirePlugin],
};

const project: Project = {
  agents: [projectAgent],
};

export { character, doomfirePlugin };
export default project;
