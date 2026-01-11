/**
 * Shared Type Definitions
 */

export interface CritiqueResult {
  technical: {
    pass: boolean;
    issues: string[];
  };
  taste: {
    pass: boolean;
    scores: {
      visualHierarchy: number;
      confidence: number;
      copyClarity: boolean;
      restraint: boolean;
    };
    issues: string[];
  };
  overall: boolean;
}
