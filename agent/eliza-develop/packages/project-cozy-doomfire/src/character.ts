import type { Character } from '@elizaos/core';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import rawCharacter from '../../../../character.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../../../..');
const SYSTEM_PROMPT_PATH = path.join(ROOT_DIR, 'agent', 'SYSTEM_PROMPT.md');

function loadSystemPrompt(): string | undefined {
  try {
    const prompt = readFileSync(SYSTEM_PROMPT_PATH, 'utf8').trim();
    return prompt.length > 0 ? prompt : undefined;
  } catch {
    return undefined;
  }
}

const systemPrompt = loadSystemPrompt();

export const character: Character = {
  ...rawCharacter,
  system: systemPrompt || rawCharacter.system,
  plugins: rawCharacter.plugins ?? [],
  bio: rawCharacter.bio ?? [],
};
