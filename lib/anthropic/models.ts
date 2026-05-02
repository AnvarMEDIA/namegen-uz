export const MODELS = {
  generate: 'claude-sonnet-4-6',
  analyse: 'claude-sonnet-4-6',
  connotation: 'claude-opus-4-7',
} as const;

export const ANTHROPIC_VERSION = '2023-06-01';
export const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';

export type ModelKey = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelKey];
