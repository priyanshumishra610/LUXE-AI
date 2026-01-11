export interface SignatureScore {
  calm: number;
  hierarchy: number;
  restraint: number;
  confidence: number;
  total: number;
}

export function evaluateSignature(code: string, structure: string): SignatureScore {
  let calm = 10;
  let hierarchy = 10;
  let restraint = 10;
  let confidence = 10;

  const lowerCode = code.toLowerCase();
  const lowerStructure = structure.toLowerCase();

  const sectionCount = (lowerStructure.match(/section/gi) || []).length;
  if (sectionCount > 4) {
    restraint -= (sectionCount - 4) * 1.5;
  }

  const ctaCount = (lowerCode.match(/button|cta/gi) || []).length;
  if (ctaCount > 1) {
    calm -= (ctaCount - 1) * 1;
    confidence -= (ctaCount - 1) * 0.5;
  }

  const animationCount = (lowerCode.match(/animate-|transition/gi) || []).length;
  if (animationCount > 2) {
    calm -= (animationCount - 2) * 0.5;
  }

  const headingCount = (lowerCode.match(/<h1|<h2/gi) || []).length;
  if (headingCount > 2) {
    hierarchy -= (headingCount - 2) * 1;
  }

  if (!lowerCode.includes('h1')) {
    hierarchy -= 2;
  }

  if (lowerCode.includes('flex') && !lowerCode.includes('justify-center') && !lowerCode.includes('items-center')) {
    hierarchy -= 1;
  }

  if (lowerCode.match(/font-\w+|text-\w+/gi) && (lowerCode.match(/font-\w+|text-\w+/gi) || []).length > 4) {
    restraint -= 1;
  }

  calm = Math.max(0, Math.min(10, calm));
  hierarchy = Math.max(0, Math.min(10, hierarchy));
  restraint = Math.max(0, Math.min(10, restraint));
  confidence = Math.max(0, Math.min(10, confidence));

  return {
    calm,
    hierarchy,
    restraint,
    confidence,
    total: (calm + hierarchy + restraint + confidence) / 4,
  };
}
