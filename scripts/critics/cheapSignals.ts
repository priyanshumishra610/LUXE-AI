export interface CheapSignal {
  detected: boolean;
  signal: string;
  reason: string;
  severity: 'minor' | 'major' | 'fatal';
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
        severity: 'fatal',
      });
    }
  }

  for (const needy of NEEDY_LANGUAGE) {
    if (lowerCopy.includes(needy)) {
      signals.push({
        detected: true,
        signal: 'needy-copy',
        reason: `Contains needy language: "${needy}"`,
        severity: 'fatal',
      });
    }
  }

  const ctaCount = (lowerCopy.match(/button|cta|get started|sign up|learn more/gi) || []).length;
  if (ctaCount > 2) {
    signals.push({
      detected: true,
      signal: 'multiple-ctas',
      reason: `Found ${ctaCount} CTAs competing for attention`,
      severity: 'fatal',
    });
  }

  const gradientCount = (lowerCode.match(/gradient|bg-gradient/gi) || []).length;
  if (gradientCount > 1) {
    signals.push({
      detected: true,
      signal: 'decorative-gradients',
      reason: `${gradientCount} gradients detected without clear hierarchy purpose`,
      severity: 'major',
    });
  }

  const animationCount = (lowerCode.match(/animate-|transition|transform|@keyframes/gi) || []).length;
  if (animationCount > 3) {
    signals.push({
      detected: true,
      signal: 'excessive-animation',
      reason: `${animationCount} animations detected, suggests visual noise`,
      severity: 'major',
    });
  }

  const sectionCount = (lowerCode.match(/section|main>|<div.*section/gi) || []).length;
  if (sectionCount > 5) {
    signals.push({
      detected: true,
      signal: 'too-many-sections',
      reason: `${sectionCount} sections detected, lacks restraint`,
      severity: 'major',
    });
  }

  if (lowerCode.includes('lorem ipsum') || lowerCode.includes('placeholder text')) {
    signals.push({
      detected: true,
      signal: 'placeholder-text',
      reason: 'Contains placeholder text',
      severity: 'fatal',
    });
  }

  const colorCount = (code.match(/#[0-9a-f]{6}|rgb\(|rgba\(/gi) || []).length;
  if (colorCount > 8) {
    signals.push({
      detected: true,
      signal: 'too-many-colors',
      reason: `${colorCount} color definitions, exceeds 3 primary colors rule`,
      severity: 'major',
    });
  }

  return signals;
}

export function hasCheapSignals(signals: CheapSignal[]): boolean {
  return signals.some(s => s.detected);
}

export function hasFatalSignals(signals: CheapSignal[]): boolean {
  return signals.some(s => s.detected && s.severity === 'fatal');
}

export function detectMultipleNarratives(copy: string): boolean {
  const lower = copy.toLowerCase();
  const narratives = [
    'about',
    'features',
    'testimonials',
    'pricing',
    'contact',
    'services',
    'products',
    'portfolio',
  ];
  
  const found = narratives.filter(n => lower.includes(n));
  return found.length > 4;
}

export function detectFirstScreenIssues(code: string): { hasIssue: boolean; issue: string } {
  const lower = code.toLowerCase();
  
  const h1Count = (code.match(/<h1/gi) || []).length;
  if (h1Count === 0) {
    return { hasIssue: true, issue: 'No H1 found in first screen' };
  }
  if (h1Count > 1) {
    return { hasIssue: true, issue: 'Multiple H1s competing for hierarchy' };
  }
  
  const competingElements = (lower.match(/<h[2-6]|<section|<div.*class.*section/gi) || []).length;
  if (competingElements > 4) {
    return { hasIssue: true, issue: 'Too many competing elements in first screen' };
  }
  
  const heroPattern = code.match(/<main[^>]*>[\s\S]{0,2000}<\/main>/i);
  if (heroPattern) {
    const heroContent = heroPattern[0];
    const buttonCount = (heroContent.match(/button|cta|btn/gi) || []).length;
    if (buttonCount > 1) {
      return { hasIssue: true, issue: 'Multiple CTAs in hero section' };
    }
  }
  
  return { hasIssue: false, issue: '' };
}
