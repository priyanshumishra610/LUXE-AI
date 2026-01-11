import { callGemma } from './gemma';
import { callLLM, LLMOptions } from '../utils/llm';

export type ModelType = 'gemma' | 'external';

export interface RoutingConfig {
  defaultModel: ModelType;
  fallbackEnabled: boolean;
  gemmaOnly: boolean;
}

const DEFAULT_CONFIG: RoutingConfig = {
  defaultModel: 'gemma',
  fallbackEnabled: true,
  gemmaOnly: false,
};

let routingConfig: RoutingConfig = DEFAULT_CONFIG;

export function configureRouting(config: Partial<RoutingConfig>): void {
  routingConfig = { ...routingConfig, ...config };
}

export function getRoutingConfig(): RoutingConfig {
  return { ...routingConfig };
}

export async function routeLLM(
  prompt: string,
  options?: LLMOptions
): Promise<string> {
  if (routingConfig.gemmaOnly) {
    return callGemma(prompt, options);
  }

  if (routingConfig.defaultModel === 'gemma') {
    try {
      return await callGemma(prompt, options);
    } catch (error) {
      if (routingConfig.fallbackEnabled) {
        return callLLM(prompt, options);
      }
      throw error;
    }
  }

  try {
    return await callLLM(prompt, options);
  } catch (error) {
    if (routingConfig.fallbackEnabled) {
      return callGemma(prompt, options);
    }
    throw error;
  }
}
