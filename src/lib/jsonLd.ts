/**
 * Utilities for safely rendering JSON-LD structured data in Next.js applications.
 */

/**
 * Safely stringifies an object for embedding inside an HTML <script type="application/ld+json"> tag.
 * Replaces '<' with unicode escape '\\u003c' to prevent premature script tag closure
 * and Cross-Site Scripting (XSS) attacks if string values contain '</script>'.
 *
 * @param data - The structured data object to stringify
 * @returns Serialized JSON-safe string for dangerouslySetInnerHTML
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
