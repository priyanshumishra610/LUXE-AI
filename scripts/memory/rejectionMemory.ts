import { RejectionRecord, CritiqueResult } from '../types';
import { appendRejection } from './memoryStore';
import { randomUUID } from 'crypto';

export async function recordRejection(
  intent: string,
  critiqueResult: CritiqueResult,
  humanFeedback: string,
  criticDisagreement?: string
): Promise<void> {
  const record: RejectionRecord = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    intent,
    critiqueResult,
    humanFeedback,
    criticDisagreement,
  };

  await appendRejection(record);
}
