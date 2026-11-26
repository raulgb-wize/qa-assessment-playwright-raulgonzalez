/**
 * Security & Data Governance Sanitizer
 *
 * Tier 3: Enterprise CI/CD Pipeline & AI Failure Triage
 * Scrubs sensitive data (Credit Card numbers, PII, Email addresses, Bearer tokens,
 * and Auth headers) from DOM snapshots, HTML/JSON artifacts, and network logs
 * before transmitting context to external AI models or MCP clients.
 */

export const REDACTION_TOKENS = {
  CREDIT_CARD: '[REDACTED_CREDIT_CARD]',
  EMAIL: '[REDACTED_EMAIL]',
  PHONE: '[REDACTED_PHONE]',
  SSN: '[REDACTED_SSN]',
  TOKEN: '[REDACTED_TOKEN]',
  AUTH: '[REDACTED_AUTH]',
  SECRET: '[REDACTED_SECRET]',
  PROMPT_INJECTION: '[REDACTED_INJECTION]',
} as const;

export class SecuritySanitizer {
  /**
   * Sensitive object keys whose values should always be masked.
   */
  private static readonly SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /passwd/i,
    /pwd/i,
    /secret/i,
    /(^|_)token/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,
    /private[_-]?key/i,
    /authorization/i,
    /auth[_-]?header/i,
    /cvv/i,
    /cvc/i,
    /credit[_-]?card/i,
    /card[_-]?number/i,
    /ssn/i,
    /session[_-]?id/i,
  ];

  /**
   * Luhn algorithm validation to identify valid credit card number sequences.
   */
  private static isValidLuhn(candidate: string): boolean {
    const digitsOnly = candidate.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(digitsOnly)) {
      return false;
    }
    let sum = 0;
    let shouldDouble = false;
    for (let i = digitsOnly.length - 1; i >= 0; i--) {
      let digit = parseInt(digitsOnly.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Sanitizes a raw text or DOM snapshot string by masking sensitive patterns:
   * - Credit Card numbers (formatted or unformatted Luhn-valid)
   * - Bearer tokens and JWTs
   * - HTTP Auth headers (Authorization, x-api-key, Cookie, Set-Cookie)
   * - Email addresses
   * - Social Security Numbers (SSN)
   * - Phone numbers
   * - Key-value secret assignments in JSON / query strings
   *
   * @param input Raw text containing potential PII or secrets
   * @returns Sanitized string with sensitive patterns replaced by tokens
   */
  public static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // 1. Authorization / Authentication HTTP headers
    // Matches: "Authorization: Bearer ...", "Authorization: Basic ...", "x-api-key: ...", "Cookie: ...", "Set-Cookie: ..."
    sanitized = sanitized.replace(
      /(^|[\r\n]|['"])(authorization\s*:\s*)(?:Bearer\s+[^\r\n'",]+|Basic\s+[^\r\n'",]+|[^\r\n'",]+)/gi,
      `$1$2${REDACTION_TOKENS.AUTH}`
    );
    sanitized = sanitized.replace(
      /(^|[\r\n]|['"])(x-api-key\s*:\s*)[^\r\n'",]+/gi,
      `$1$2${REDACTION_TOKENS.AUTH}`
    );
    sanitized = sanitized.replace(
      /(^|[\r\n]|['"])((?:set-)?cookie\s*:\s*)[^\r\n'",]+/gi,
      `$1$2${REDACTION_TOKENS.AUTH}`
    );

    // 2. Standalone Bearer tokens (e.g. "Bearer eyJhbGci..." or "Bearer a1b2c3d4...")
    sanitized = sanitized.replace(
      /\bBearer\s+([A-Za-z0-9\-_.~+/]+=*)/g,
      `Bearer ${REDACTION_TOKENS.TOKEN}`
    );

    // 3. JWT Tokens (standard 3-segment base64: eyJ...)
    sanitized = sanitized.replace(
      /\beyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]+/g,
      REDACTION_TOKENS.TOKEN
    );

    // 4. Formatted Credit Cards (4x4, 4-6-5 Amex, or 13-19 digits)
    // Matches standard delimited card numbers: 4111-2222-3333-4444 or 4111 2222 3333 4444
    sanitized = sanitized.replace(
      /\b(?:\d{4}[-\s]){3}\d{1,4}\b/g,
      REDACTION_TOKENS.CREDIT_CARD
    );
    // Matches Amex delimited: 3782-822463-10005 or 3782 822463 10005
    sanitized = sanitized.replace(
      /\b3[47]\d{2}[-\s]\d{6}[-\s]\d{5}\b/g,
      REDACTION_TOKENS.CREDIT_CARD
    );

    // Matches contiguous or unformatted card numbers validated by Luhn algorithm
    sanitized = sanitized.replace(/\b\d{13,19}\b/g, (match) => {
      if (SecuritySanitizer.isValidLuhn(match)) {
        return REDACTION_TOKENS.CREDIT_CARD;
      }
      return match;
    });

    // 5. Social Security Numbers (SSN: XXX-XX-XXXX)
    sanitized = sanitized.replace(
      /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
      REDACTION_TOKENS.SSN
    );

    // 6. Email addresses (e.g. user@domain.com, first.last+tag@sub.domain.org)
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      REDACTION_TOKENS.EMAIL
    );

    // 7. Phone numbers: formatted US and International numbers
    // e.g. +1-800-555-0199, (555) 123-4567, 555-123-4567, 555.123.4567
    sanitized = sanitized.replace(
      /(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,
      REDACTION_TOKENS.PHONE
    );

    // 8. Key-Value pairs in JSON or URL query strings for sensitive keys
    // e.g. "password": "xyz" or password=xyz
    sanitized = sanitized.replace(
      /(["']?(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|cvv|cvc)["']?\s*[:=]\s*["'])([^"'\r\n&]+)(["']?)/gi,
      `$1${REDACTION_TOKENS.SECRET}$3`
    );

    // 9. Sensitive HTML input fields values (e.g. <input type="password" value="mySecret">)
    sanitized = sanitized.replace(
      /(<input\b[^>]*?\btype=["']password["'][^>]*?\bvalue=["'])([^"']*)(["'])/gi,
      `$1${REDACTION_TOKENS.SECRET}$3`
    );
    sanitized = sanitized.replace(
      /(<input\b[^>]*?\bvalue=["'])([^"']*)(["'][^>]*?\btype=["']password["'])/gi,
      `$1${REDACTION_TOKENS.SECRET}$3`
    );

    return sanitized;
  }

  /**
   * Sanitizes a JSON payload object recursively.
   * Clones the object and redacts sensitive keys and values without mutating the original.
   * Preserves types, structures, arrays, and dates.
   *
   * @param obj Object containing potential sensitive fields
   * @returns Deep sanitized copy of the object
   */
  public static sanitizeObject<T>(obj: T, visited = new WeakSet()): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return SecuritySanitizer.sanitizeText(obj) as unknown as T;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle Date instances
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    // Handle RegExp instances
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as unknown as T;
    }

    // Guard against circular references
    if (visited.has(obj as object)) {
      return obj;
    }
    visited.add(obj as object);

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        SecuritySanitizer.sanitizeObject(item, visited)
      ) as unknown as T;
    }

    // Handle standard Records/Objects
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SecuritySanitizer.isSensitiveKey(key)) {
        result[key] = SecuritySanitizer.getRedactionTokenForKey(key, value);
      } else {
        result[key] = SecuritySanitizer.sanitizeObject(value, visited);
      }
    }

    return result as T;
  }

  /**
   * Sanitizes an HTML or DOM snapshot string, scrubbing both markup attributes and node content.
   *
   * @param html Raw HTML/DOM snapshot string
   * @returns Sanitized HTML string with all sensitive data scrubbed
   */
  public static sanitizeHtml(html: string): string {
    return SecuritySanitizer.sanitizeText(html);
  }

  /**
   * Sanitizes untrusted text/DOM content before sending it to an LLM prompt.
   * Applies full PII/secret redaction and neutralizes common prompt-injection
   * and role-spoofing patterns so dynamic page content cannot override system rules.
   *
   * @param input Raw untrusted error, stack, or DOM snapshot string
   * @returns Sanitized string safe to embed inside delimited LLM data blocks
   */
  public static sanitizeForLLM(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    let sanitized = SecuritySanitizer.sanitizeText(input);

    // Strip role-spoofing XML/chat delimiters
    sanitized = sanitized.replace(
      /<\s*\/?\s*(?:system|assistant|developer|instructions?|prompt|tool_call|untrusted_test_artifact)\b[^>]*>/gi,
      REDACTION_TOKENS.PROMPT_INJECTION
    );
    sanitized = sanitized.replace(
      /\[(?:INST|\/INST|SYSTEM|\/SYSTEM|SYS|\/SYS)\]/gi,
      REDACTION_TOKENS.PROMPT_INJECTION
    );
    sanitized = sanitized.replace(
      /^(\s*)(?:system|assistant|developer)\s*:\s*/gim,
      `$1${REDACTION_TOKENS.PROMPT_INJECTION} `
    );

    // Neutralize instruction-override and role-hijacking phrases
    sanitized = sanitized.replace(
      /\b(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+)?(?:previous|prior|above|system|earlier)\s+(?:instructions?|prompts?|rules?|directives?)\b/gi,
      REDACTION_TOKENS.PROMPT_INJECTION
    );
    sanitized = sanitized.replace(
      /\b(?:you are now|act as|pretend to be|new instructions?:|respond only with|output only)\b/gi,
      REDACTION_TOKENS.PROMPT_INJECTION
    );

    return sanitized;
  }

  /**
   * Sanitizes HTTP headers map (case-insensitive keys).
   *
   * @param headers Map of header name to value
   * @returns Sanitized copy of the headers map
   */
  public static sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>
  ): Record<string, string | string[] | undefined> {
    const sanitized: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === 'authorization' ||
        lowerKey === 'x-api-key' ||
        lowerKey === 'cookie' ||
        lowerKey === 'set-cookie' ||
        lowerKey === 'proxy-authorization'
      ) {
        sanitized[key] = Array.isArray(value)
          ? value.map(() => REDACTION_TOKENS.AUTH)
          : REDACTION_TOKENS.AUTH;
      } else if (typeof value === 'string') {
        sanitized[key] = SecuritySanitizer.sanitizeText(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((v) => SecuritySanitizer.sanitizeText(v));
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Checks if a key name matches any known sensitive credential/PII pattern.
   */
  private static isSensitiveKey(key: string): boolean {
    return SecuritySanitizer.SENSITIVE_KEY_PATTERNS.some((pattern) =>
      pattern.test(key)
    );
  }

  /**
   * Determines appropriate redaction token based on key name or value.
   */
  private static getRedactionTokenForKey(key: string, value: unknown): string {
    const lower = key.toLowerCase();
    if (lower.includes('card') || lower.includes('cvv') || lower.includes('cvc')) {
      return REDACTION_TOKENS.CREDIT_CARD;
    }
    if (lower.includes('ssn')) {
      return REDACTION_TOKENS.SSN;
    }
    if (lower.includes('email')) {
      return REDACTION_TOKENS.EMAIL;
    }
    if (lower.includes('phone')) {
      return REDACTION_TOKENS.PHONE;
    }
    if (lower.includes('token') && !lower.includes('csrf')) {
      return REDACTION_TOKENS.TOKEN;
    }
    if (lower.includes('auth')) {
      return REDACTION_TOKENS.AUTH;
    }
    return REDACTION_TOKENS.SECRET;
  }
}
