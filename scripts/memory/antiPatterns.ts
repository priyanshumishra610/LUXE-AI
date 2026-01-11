import { readRejections, readAntiPatterns, updateAntiPatterns } from './memoryStore';
import { AntiPattern } from '../types';

const MIN_OCCURRENCES = 2;
const ESCALATION_THRESHOLD = 3;
const HIGH_SEVERITY_THRESHOLD = 5;

const PATTERN_CATEGORIES: Record<string, string> = {
  'visual-noise': 'layout',
  'buzzword-usage': 'copy',
  'over-animation': 'layout',
  'excess-elements': 'structure',
  'weak-hierarchy': 'layout',
  'try-hard-tone': 'tone',
  'startup-cliche': 'copy',
  'needy-copy': 'tone',
  'multiple-ctas': 'structure',
  'decorative-gradients': 'layout',
  'excessive-animation': 'layout',
  'too-many-sections': 'structure',
  'placeholder-text': 'copy',
  'too-many-colors': 'layout',
};

function extractPatternsFromIssues(issues: string[]): string[] {
  const patterns: string[] = [];
  
  for (const issue of issues) {
    const lower = issue.toLowerCase();
    
    if (lower.includes('noise') || lower.includes('clutter')) {
      patterns.push('visual-noise');
    }
    if (lower.includes('buzzword') || lower.includes('cliché') || lower.includes('cliche')) {
      patterns.push('buzzword-usage');
    }
    if (lower.includes('over-animation') || lower.includes('excessive animation')) {
      patterns.push('over-animation');
    }
    if (lower.includes('too many') || lower.includes('excessive') || lower.includes('too many sections')) {
      patterns.push('excess-elements');
    }
    if (lower.includes('hierarchy') || lower.includes('unclear priority') || lower.includes('focal point')) {
      patterns.push('weak-hierarchy');
    }
    if (lower.includes('try-hard') || lower.includes('desperate') || lower.includes('needy')) {
      patterns.push('try-hard-tone');
    }
    if (lower.includes('cheap signals')) {
      patterns.push('cheap-signals');
    }
    if (lower.includes('defense test') || lower.includes('cannot be justified')) {
      patterns.push('unjustified-complexity');
    }
  }
  
  return patterns;
}

function calculateSeverity(occurrences: number): number {
  if (occurrences >= HIGH_SEVERITY_THRESHOLD) {
    return 3;
  }
  if (occurrences >= ESCALATION_THRESHOLD) {
    return 2;
  }
  return 1;
}

export async function extractAntiPatterns(): Promise<AntiPattern[]> {
  const rejections = await readRejections();
  const existing = await readAntiPatterns();
  
  const patternMap = new Map<string, AntiPattern>();
  
  for (const existingPattern of existing) {
    patternMap.set(existingPattern.pattern, existingPattern);
  }
  
  for (const rejection of rejections) {
    const technicalPatterns = extractPatternsFromIssues(rejection.critiqueResult.technical.issues);
    const tastePatterns = extractPatternsFromIssues(rejection.critiqueResult.taste.issues);
    const allPatterns = [...technicalPatterns, ...tastePatterns];
    
    for (const pattern of allPatterns) {
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, {
          pattern,
          occurrences: 0,
          lastSeen: rejection.timestamp,
          examples: [],
          category: PATTERN_CATEGORIES[pattern] || 'general',
          severity: 1,
        });
      }
      
      const entry = patternMap.get(pattern)!;
      entry.occurrences++;
      if (rejection.timestamp > entry.lastSeen) {
        entry.lastSeen = rejection.timestamp;
      }
      if (entry.examples.length < 3 && rejection.humanFeedback) {
        entry.examples.push(rejection.humanFeedback);
      }
      entry.severity = calculateSeverity(entry.occurrences);
    }
  }
  
  const antiPatterns = Array.from(patternMap.values())
    .filter(p => p.occurrences >= MIN_OCCURRENCES)
    .sort((a, b) => {
      if (b.severity !== a.severity) {
        return b.severity - a.severity;
      }
      return b.occurrences - a.occurrences;
    });
  
  await updateAntiPatterns(antiPatterns);
  return antiPatterns;
}

export async function getAntiPatternSummary(): Promise<string> {
  const patterns = await extractAntiPatterns();
  
  if (patterns.length === 0) {
    return 'No anti-patterns identified yet.';
  }
  
  const summaries = patterns.map(p => {
    const severity = p.severity === 3 ? 'HIGH' : p.severity === 2 ? 'MEDIUM' : 'LOW';
    return `- ${p.pattern} [${severity}]: ${p.occurrences} occurrences (category: ${p.category || 'general'})`;
  });
  
  return `Known anti-patterns to avoid (system is increasingly strict on these):\n${summaries.join('\n')}`;
}
