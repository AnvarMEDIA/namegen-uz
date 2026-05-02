export interface BuildAnalysePromptInput {
  name: string;
}

export interface BuiltAnalysePrompt {
  system: string;
  user: string;
  temperature: number;
}

const SYSTEM =
  'You are an expert brand analyst specialising in the Uzbekistan and Central Asian market. ' +
  'Return ONLY a raw JSON object — no markdown, no code fences, no extra text.';

export function buildAnalysePrompt(input: BuildAnalysePromptInput): BuiltAnalysePrompt {
  const safeName = input.name.trim().slice(0, 40);
  const user =
    `Analyse the brand name "${safeName}" for the Uzbekistan market.\n` +
    `Return this exact JSON structure:\n` +
    `{\n` +
    `  "meaning": "what the name means, evokes, or sounds like (2-3 sentences)",\n` +
    `  "associations": ["visual/emotional association 1", "association 2", "association 3"],\n` +
    `  "target_audience": "specific target audience description (1-2 sentences)",\n` +
    `  "strengths": ["brand strength 1", "strength 2", "strength 3"],\n` +
    `  "brand_tip": "one concrete, actionable tip for brand development in Uzbekistan (1-2 sentences)",\n` +
    `  "similar_brands": ["well-known brand with similar feel 1", "similar brand 2", "similar brand 3"]\n` +
    `}\n` +
    `All values must be in Russian language. Return ONLY the JSON object.`;
  return { system: SYSTEM, user, temperature: 0.7 };
}
