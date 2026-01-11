import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { loadPrompt } from '../utils/promptLoader';
import { callLLM } from '../utils/llm';
import { getAntiPatternSummary } from '../memory/antiPatterns';
import { detectCheapSignals, hasCheapSignals, hasFatalSignals, detectMultipleNarratives, detectFirstScreenIssues } from './cheapSignals';
import { testDefense } from './defenseTest';

export interface TasteCriticResult {
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
  reasons: {
    confidence: string;
    restraint: string;
    visualHierarchy: string;
    cognitiveCalm: string;
    brandSeriousness: string;
    signatureAlignment: string;
  };
  issues: string[];
  cheapSignals: string[];
  severity: 'minor' | 'major' | 'fatal';
}

const MIN_SCORE = 8;

import { DefenseResult } from './defenseTest';

function determineSeverity(signals: ReturnType<typeof detectCheapSignals>, defenseResult: DefenseResult, scores: number[]): 'minor' | 'major' | 'fatal' {
  if (hasFatalSignals(signals)) {
    return 'fatal';
  }
  
  if (!defenseResult.passes && defenseResult.severity === 'fatal') {
    return 'fatal';
  }
  
  const minScore = Math.min(...scores);
  if (minScore < 6) {
    return 'fatal';
  }
  
  if (hasCheapSignals(signals)) {
    return 'major';
  }
  
  if (!defenseResult.passes) {
    return defenseResult.severity;
  }
  
  if (minScore < MIN_SCORE) {
    return 'major';
  }
  
  return 'minor';
}

export async function evaluateTaste(outputDir: string): Promise<TasteCriticResult> {
  const files = await readdir(outputDir, { recursive: true });
  const codeFiles = files.filter(file => {
    const ext = extname(file);
    return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
  });

  if (codeFiles.length === 0) {
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'No code files found',
        restraint: 'No code files found',
        visualHierarchy: 'No code files found',
        cognitiveCalm: 'No code files found',
        brandSeriousness: 'No code files found',
        signatureAlignment: 'No code files found',
      },
      issues: ['No code files found in output'],
      cheapSignals: [],
      severity: 'fatal',
    };
  }

  const fileContents: string[] = [];
  let allCode = '';
  let allCopy = '';

  for (const file of codeFiles.slice(0, 20)) {
    try {
      const content = await readFile(join(outputDir, file), 'utf-8');
      fileContents.push(`File: ${file}\n${content}`);
      allCode += content + '\n';
      
      const textMatches = content.match(/>([^<]{10,200})</g);
      if (textMatches) {
        allCopy += textMatches.join(' ') + ' ';
      }
    } catch {
      continue;
    }
  }

  const codeSample = fileContents.join('\n\n---\n\n');
  const structure = JSON.stringify({
    fileCount: codeFiles.length,
    totalLines: allCode.split('\n').length,
  }, null, 2);

  const cheapSignalsResult = detectCheapSignals(allCode, allCopy);
  const hasCheap = hasCheapSignals(cheapSignalsResult);
  const fatalSignals = hasFatalSignals(cheapSignalsResult);
  
  if (fatalSignals) {
    const cheapList = cheapSignalsResult.filter(s => s.detected && s.severity === 'fatal').map(s => s.reason);
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'Fatal cheap signals detected',
        restraint: 'Fatal cheap signals detected',
        visualHierarchy: 'Fatal cheap signals detected',
        cognitiveCalm: 'Fatal cheap signals detected',
        brandSeriousness: 'Fatal cheap signals detected',
        signatureAlignment: 'Fatal cheap signals detected',
      },
      issues: ['Fatal cheap signals detected - instant fail'],
      cheapSignals: cheapList,
      severity: 'fatal',
    };
  }

  const multipleNarratives = detectMultipleNarratives(allCopy);
  if (multipleNarratives) {
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'Multiple narratives detected',
        restraint: 'Multiple narratives detected',
        visualHierarchy: 'Multiple narratives detected',
        cognitiveCalm: 'Multiple narratives detected',
        brandSeriousness: 'Multiple narratives detected',
        signatureAlignment: 'Multiple narratives detected',
      },
      issues: ['Multiple competing narratives - violates single narrative rule'],
      cheapSignals: [],
      severity: 'fatal',
    };
  }

  const firstScreenIssue = detectFirstScreenIssues(allCode);
  if (firstScreenIssue.hasIssue) {
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'First screen hierarchy failed',
        restraint: 'First screen hierarchy failed',
        visualHierarchy: firstScreenIssue.issue,
        cognitiveCalm: 'First screen hierarchy failed',
        brandSeriousness: 'First screen hierarchy failed',
        signatureAlignment: 'First screen hierarchy failed',
      },
      issues: [`First screen absolutism: ${firstScreenIssue.issue}`],
      cheapSignals: [],
      severity: 'fatal',
    };
  }

  const defenseResult = await testDefense(allCode, structure);
  
  if (!defenseResult.passes && defenseResult.severity === 'fatal') {
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'Defense test failed fatally',
        restraint: 'Defense test failed fatally',
        visualHierarchy: 'Defense test failed fatally',
        cognitiveCalm: 'Defense test failed fatally',
        brandSeriousness: 'Defense test failed fatally',
        signatureAlignment: 'Defense test failed fatally',
      },
      issues: [...defenseResult.issues, 'Design choices cannot be justified over simpler alternatives'],
      cheapSignals: [],
      severity: 'fatal',
    };
  }

  if (hasCheap) {
    const cheapList = cheapSignalsResult.filter(s => s.detected).map(s => s.reason);
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'Cheap signals detected',
        restraint: 'Cheap signals detected',
        visualHierarchy: 'Cheap signals detected',
        cognitiveCalm: 'Cheap signals detected',
        brandSeriousness: 'Cheap signals detected',
        signatureAlignment: 'Cheap signals detected',
      },
      issues: ['Cheap signals detected'],
      cheapSignals: cheapList,
      severity: 'major',
    };
  }

  const promptTemplate = await loadPrompt('critic-taste');
  const constitutionPath = join(process.cwd(), 'constitution', 'premium-constitution.md');
  const rubricPath = join(process.cwd(), 'constitution', 'quality-rubric.md');
  const constitution = await readFile(constitutionPath, 'utf-8');
  const rubric = await readFile(rubricPath, 'utf-8');
  const antiPatterns = await getAntiPatternSummary();
  
  const fullPrompt = `${promptTemplate}

CRITICAL: You are evaluating premium work. Be ruthless.

Constitution:
${constitution}

Quality Rubric:
${rubric}

Memory (Anti-Patterns):
${antiPatterns}

Generated Code:
${codeSample.substring(0, 12000)}

Evaluate these 6 dimensions (each 0-10, MINIMUM 8 to pass):

1. CONFIDENCE: Calm, assured, non-needy. No begging language.
2. RESTRAINT: Fewer sections preferred. No visual clutter. Strong bias against section stacking.
3. VISUAL HIERARCHY: Obvious focal point in first screen. Clear reading order. Single narrative.
4. COGNITIVE CALM: Page feels quiet, not busy. No unnecessary variation. No decorative symmetry.
5. BRAND SERIOUSNESS: Would this embarrass a premium brand? Would this feel cheap?
6. SIGNATURE ALIGNMENT: Does this feel like LUXE AI output? Would this pass unnoticed as generic?

COPY CLARITY (Pass/Fail): Is value clear within 5 seconds? No buzzwords? Excessive copy fails.

Output JSON with:
- scores: object with confidence, restraint, visualHierarchy, cognitiveCalm, brandSeriousness, signatureAlignment (each 0-10), copyClarity (boolean)
- reasons: object with one-line reason for each dimension
- issues: array of specific problems

ANY score < 8 = FAIL. Be strict.`;

  const response = await callLLM(fullPrompt, { temperature: 0.4 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'Failed to parse response',
        restraint: 'Failed to parse response',
        visualHierarchy: 'Failed to parse response',
        cognitiveCalm: 'Failed to parse response',
        brandSeriousness: 'Failed to parse response',
        signatureAlignment: 'Failed to parse response',
      },
      issues: ['Failed to parse taste critic response'],
      cheapSignals: [],
      severity: 'fatal',
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const scores = parsed.scores || {};
    
    const confidence = Number(scores.confidence) || 0;
    const restraint = Number(scores.restraint) || 0;
    const visualHierarchy = Number(scores.visualHierarchy) || 0;
    const cognitiveCalm = Number(scores.cognitiveCalm) || 0;
    const brandSeriousness = Number(scores.brandSeriousness) || 0;
    const signatureAlignment = Number(scores.signatureAlignment) || 0;
    const copyClarity = scores.copyClarity === true;

    const allScores = [confidence, restraint, visualHierarchy, cognitiveCalm, brandSeriousness, signatureAlignment];
    const minScore = Math.min(...allScores);
    const pass = minScore >= MIN_SCORE && copyClarity;

    const reasons = parsed.reasons || {};
    const issues = Array.isArray(parsed.issues) ? parsed.issues : [];

    if (!pass) {
      issues.push(`Minimum score threshold not met (minimum: ${MIN_SCORE}, lowest: ${minScore})`);
    }

    const severity = determineSeverity(cheapSignalsResult, defenseResult, allScores);

    return {
      pass,
      scores: {
        confidence,
        restraint,
        visualHierarchy,
        cognitiveCalm,
        brandSeriousness,
        signatureAlignment,
        copyClarity,
      },
      reasons: {
        confidence: reasons.confidence || 'No reason provided',
        restraint: reasons.restraint || 'No reason provided',
        visualHierarchy: reasons.visualHierarchy || 'No reason provided',
        cognitiveCalm: reasons.cognitiveCalm || 'No reason provided',
        brandSeriousness: reasons.brandSeriousness || 'No reason provided',
        signatureAlignment: reasons.signatureAlignment || 'No reason provided',
      },
      issues,
      cheapSignals: [],
      severity,
    };
  } catch {
    return {
      pass: false,
      scores: {
        confidence: 0,
        restraint: 0,
        visualHierarchy: 0,
        cognitiveCalm: 0,
        brandSeriousness: 0,
        signatureAlignment: 0,
        copyClarity: false,
      },
      reasons: {
        confidence: 'Parse error',
        restraint: 'Parse error',
        visualHierarchy: 'Parse error',
        cognitiveCalm: 'Parse error',
        brandSeriousness: 'Parse error',
        signatureAlignment: 'Parse error',
      },
      issues: ['Failed to parse taste critic JSON'],
      cheapSignals: [],
      severity: 'fatal',
    };
  }
}
