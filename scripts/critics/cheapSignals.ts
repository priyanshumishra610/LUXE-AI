export interface CheapSignal {
  detected: boolean;
  signal: string;
  reason: string;
}

const STARTUP_CLICHES = [
  'disrupt',
  'revolutionary',
  'game-changing',
  'innovative solution',
  'cutting-edge',
  'next-gen',
  'seamless experience',
  'empower',
  'unleash',
  'transform your',
];

const NEEDY_LANGUAGE = [
  'don\'t miss out',
  'limited time',
  'act now',
  'join thousands',
  'trusted by',
  'as seen in',
  'award-winning',
  'best-in-class',
];

const VISUAL_NOISE_INDICATORS = [
  'gradient',
  'animation',
  'hover effect',
  'transition',
  'transform',
];

export function detectCheapSignals(code: string, copy: string): CheapSignal[] {
  const signals: CheapSignal[] = [];
  const lowerCode = code.toLowerCase();
  const lowerCopy = copy.toLowerCase();

  for (const cliche of STARTUP_CLICHES) {
    if (lowerCopy.includes(cliche)) {
      signals.push({
        detected: true,
        signal: 'startup-cliche',
        reason: `Contains startup cliché: "${cliche}"`,
      });
    }
  }

  for (const needy of NEEDY_LANGUAGE) {
    if (lowerCopy.includes(needy)) {
      signals.push({
        detected: true,
        signal: 'needy-copy',
        reason: `Contains needy language: "${needy}"`,
      });
    }
  }

  const ctaCount = (lowerCopy.match(/button|cta|get started|sign up|learn more/gi) || []).length;
  if (ctaCount > 2) {
    signals.push({
      detected: true,
      signal: 'multiple-ctas',
      reason: `Found ${ctaCount} CTAs competing for attention`,
    });
  }

  const gradientCount = (lowerCode.match(/gradient|bg-gradient/gi) || []).length;
  if (gradientCount > 1) {
    signals.push({
      detected: true,
      signal: 'decorative-gradients',
      reason: `${gradientCount} gradients detected without clear hierarchy purpose`,
    });
  }

  const animationCount = (lowerCode.match(/animate-|transition|transform|@keyframes/gi) || []).length;
  if (animationCount > 3) {
    signals.push({
      detected: true,
      signal: 'excessive-animation',
      reason: `${animationCount} animations detected, suggests visual noise`,
    });
  }

  const sectionCount = (lowerCode.match(/section|main>|<div.*section/gi) || []).length;
  if (sectionCount > 5) {
    signals.push({
      detected: true,
      signal: 'too-many-sections',
      reason: `${sectionCount} sections detected, lacks restraint`,
    });
  }

  if (lowerCode.includes('lorem ipsum') || lowerCode.includes('placeholder text')) {
    signals.push({
      detected: true,
      signal: 'placeholder-text',
      reason: 'Contains placeholder text',
    });
  }

  const colorCount = (code.match(/#[0-9a-f]{6}|rgb\(|rgba\(/gi) || []).length;
  if (colorCount > 8) {
    signals.push({
      detected: true,
      signal: 'too-many-colors',
      reason: `${colorCount} color definitions, exceeds 3 primary colors rule`,
    });
  }

  return signals;
}

export function hasCheapSignals(signals: CheapSignal[]): boolean {
  return signals.some(s => s.detected);
}
