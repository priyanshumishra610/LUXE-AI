export interface GemmaOptions {
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_OPTIONS: Required<GemmaOptions> = {
  temperature: 0.3,
  maxTokens: 2000,
};

export async function callGemma(
  prompt: string,
  options?: GemmaOptions
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.GEMMA_MODEL || 'gemma:2b-instruct-q4_0';

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      options: {
        temperature: opts.temperature,
        num_predict: opts.maxTokens,
      },
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.response || '';
}
