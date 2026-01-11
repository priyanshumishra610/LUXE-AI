import { ClientRequest } from './intake';
import { InterpretedIntent } from '../interpret';
import { interpret } from '../interpret';

const FORBIDDEN_INSTRUCTIONS = [
  'flashy',
  'eye-catching',
  'vibrant colors',
  'lots of animations',
  'busy design',
  'packed with features',
  'revolutionary',
  'next-gen',
  'cutting-edge',
];

function containsForbidden(input: string): boolean {
  const lower = input.toLowerCase();
  return FORBIDDEN_INSTRUCTIONS.some(term => lower.includes(term));
}

function cleanInput(input: string): string {
  let cleaned = input.trim();
  
  if (containsForbidden(cleaned)) {
    cleaned = cleaned.replace(
      new RegExp(FORBIDDEN_INSTRUCTIONS.join('|'), 'gi'),
      ''
    );
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  }
  
  return cleaned;
}

export async function normalize(request: ClientRequest): Promise<InterpretedIntent> {
  const cleaned = cleanInput(request.rawInput);
  
  if (cleaned.length === 0) {
    throw new Error('Client input is empty after normalization');
  }
  
  const interpreted = await interpret(cleaned);
  return interpreted;
}
