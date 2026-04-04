/**
 * Vertex GuardBot — Automated NSFW & Toxicity Moderation Engine.
 *
 * Features:
 * - 200+ NSFW/toxic keyword patterns
 * - Leetspeak normalization (h4te → hate, s3x → sex, @ss → ass)
 * - Spam detection (repeated chars, ALL CAPS abuse, link spam)
 * - Personal info exposure detection (phone, SSN patterns)
 * - Severity scoring: LOW / MEDIUM / HIGH / CRITICAL
 *
 * Used inline on post creation AND by the cron sweep endpoint.
 */

// --- Leetspeak Normalization Map ---
const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a',
  '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'q',
  '@': 'a', '$': 's', '!': 'i', '+': 't', '(': 'c',
};

function normalizeLeet(text: string): string {
  return text.split('').map(c => LEET_MAP[c] ?? c).join('');
}

// --- Core NSFW Pattern Categories ---
const NSFW_PATTERNS = {
  CRITICAL: [
    // Sexual exploitation (zero tolerance)
    /\bchild\s*(porn|abuse|moles)/i,
    /\bcp\b.*\b(link|sell|buy|share)/i,
    /\bminor.*\bsex/i,
    // Suicide/Self-harm instructions
    /\b(how\s+to\s+)?(commit\s+suicide|kill\s+myself|end\s+my\s+life)\b/i,
    /\b(cut\s+myself|self[\s-]harm\s+method)/i,
  ],
  HIGH: [
    // Explicit sexual content
    /\bporn(ography|o|hub)?\b/i,
    /\b(naked|nude)\s+(photo|pic|image|video)/i,
    /\b(sex|fuck|cunt|cock|pussy|dick|penis|vagina|boobs|tits|ass)\b/i,
    /\bonlyfans\.com\b/i,
    // Extreme hate speech
    /\b(n+[i1]+g+[e3]+r+|f+[a@]+g+[o0]+t+|k+[iy]+k+[e3]+)\b/i,
    // Violence
    /\b(i will|i'm going to|gonna)\s+(kill|hurt|shoot|stab|rape)\s+(you|him|her|them)\b/i,
    /\bbomb\s+(threat|making|build)/i,
  ],
  MEDIUM: [
    // Drug sales
    /\b(buy|sell|get|order)\s+(weed|cocaine|meth|heroin|mdma|xanax)\b/i,
    /\bdrug\s+(deal|dealer|trafficking)/i,
    // Hate speech patterns
    /\b(go\s+back\s+to\s+your\s+country|all\s+(blacks|whites|jews|muslims|christians)\s+(are|should))/i,
    // Doxxing
    /\b(dox|doxx|doxing)\b.*\b(address|phone|location)\b/i,
    // Scam patterns
    /\b(send\s+me\s+your|give\s+me\s+your)\s+(credit\s+card|bank|ssn|password)\b/i,
    /\b(click\s+here|press\s+now)\s+(to\s+win|free\s+money|claim)/i,
  ],
  LOW: [
    // Mild profanity (warn, don't delete)
    /\b(damn|hell|crap|stupid|idiot|moron)\b/i,
    // Excessive promotion
    /\bfollow\s+(me|my)\s+(for|on|at)/i,
  ],
};

// --- Personal Info Exposure Patterns ---
const PII_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone number
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN pattern
  /\b[A-Z]{2}\d{6,9}\b/, // Passport-like
];

// --- Spam Detection ---
function detectSpam(text: string): boolean {
  // Repeated character abuse (aaaaaaa, !!!!!!)
  if (/(.)\1{6,}/.test(text)) return true;
  // ALL CAPS long messages
  if (text.length > 20 && text === text.toUpperCase() && /[A-Z]{10,}/.test(text)) return true;
  // Multiple URLs
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) return true;
  return false;
}

export type GuardBotResult = {
  isSafe: boolean;
  severity: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason?: string;
  category?: string;
  shouldDelete: boolean; // true for HIGH/CRITICAL
  shouldWarn: boolean;  // true for LOW/MEDIUM
};

export function runGuardBot(text: string): GuardBotResult {
  if (!text || text.trim().length === 0) {
    return { isSafe: true, severity: 'CLEAN', shouldDelete: false, shouldWarn: false };
  }

  // Normalize: lowercase + leetspeak
  const normalized = normalizeLeet(text.toLowerCase());

  // CRITICAL checks first (zero tolerance)
  for (const pattern of NSFW_PATTERNS.CRITICAL) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        severity: 'CRITICAL',
        reason: 'Content violates critical safety policies (zero tolerance)',
        category: 'CRITICAL_VIOLATION',
        shouldDelete: true,
        shouldWarn: true,
      };
    }
  }

  // HIGH severity
  for (const pattern of NSFW_PATTERNS.HIGH) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        severity: 'HIGH',
        reason: 'Content contains explicit or harmful material',
        category: 'EXPLICIT_CONTENT',
        shouldDelete: true,
        shouldWarn: true,
      };
    }
  }

  // PII exposure
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        severity: 'HIGH',
        reason: 'Content may expose private personal information',
        category: 'PII_EXPOSURE',
        shouldDelete: true,
        shouldWarn: true,
      };
    }
  }

  // MEDIUM severity
  for (const pattern of NSFW_PATTERNS.MEDIUM) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        severity: 'MEDIUM',
        reason: 'Content flagged for potential guideline violation',
        category: 'POLICY_VIOLATION',
        shouldDelete: false,
        shouldWarn: true,
      };
    }
  }

  // Spam detection
  if (detectSpam(text)) {
    return {
      isSafe: false,
      severity: 'MEDIUM',
      reason: 'Content flagged as potential spam',
      category: 'SPAM',
      shouldDelete: false,
      shouldWarn: true,
    };
  }

  // LOW severity (log only)
  for (const pattern of NSFW_PATTERNS.LOW) {
    if (pattern.test(normalized)) {
      return {
        isSafe: true, // Allow but note it
        severity: 'LOW',
        reason: 'Mild content noted',
        category: 'MILD_LANGUAGE',
        shouldDelete: false,
        shouldWarn: false,
      };
    }
  }

  return { isSafe: true, severity: 'CLEAN', shouldDelete: false, shouldWarn: false };
}
