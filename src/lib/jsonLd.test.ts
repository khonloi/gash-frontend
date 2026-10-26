import { describe, it, expect } from 'vitest';
import { safeJsonLdStringify } from './jsonLd';

describe('safeJsonLdStringify', () => {
  it('serializes standard objects to valid JSON equivalent', () => {
    const input = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'JOCKSPORT',
    };
    const output = safeJsonLdStringify(input);
    expect(JSON.parse(output)).toEqual(input);
  });

  it('escapes < characters to \\u003c to prevent script injection', () => {
    const malicious = {
      name: '</script><script>alert("xss")</script>',
    };
    const output = safeJsonLdStringify(malicious);
    expect(output).not.toContain('<');
    expect(output).toContain('\\u003c/script>\\u003cscript>alert(\\"xss\\")\\u003c/script>');
    // Ensure it still parses back to original text when consumed by standard JSON parsers
    expect(JSON.parse(output)).toEqual(malicious);
  });
});
