export interface CritiqueResult {
  technical: {
    pass: boolean;
    issues: string[];
  };
  taste: {
    pass: boolean;
    scores: {
      confidence: number;
      restraint: number;
      visualHierarchy: number;
      cognitiveCalm: number;
      brandSeriousness: number;
      signatureAlignment: number;
      copyClarity: boolean;
    };
    issues: string[];
    cheapSignals?: string[];
  };
  overall: boolean;
}

export interface ApprovalRecord {
  id: string;
  timestamp: string;
  intent: string;
  critiqueResult: CritiqueResult;
  humanFeedback?: string;
}

export interface RejectionRecord {
  id: string;
  timestamp: string;
  intent: string;
  critiqueResult: CritiqueResult;
  humanFeedback: string;
  criticDisagreement?: string;
}

export interface AntiPattern {
  pattern: string;
  occurrences: number;
  lastSeen: string;
  examples: string[];
  category?: string;
  severity?: number;
}
