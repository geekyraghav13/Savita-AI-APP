import { OPENROUTER_API_KEY } from './secrets';

export { OPENROUTER_API_KEY };

// Verified working on 2026-05-19. Tried in order, first success wins.
// `openrouter/free` is OpenRouter's auto-router that picks any available free model.
export const OPENROUTER_MODELS = [
  'openrouter/free',
  'openai/gpt-oss-120b:free',
  'google/gemma-4-26b-a4b-it:free',
  'openai/gpt-oss-20b:free',
];

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
