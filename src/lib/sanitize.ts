/**
 * Sanitizes HTML content to prevent XSS attacks from AI-generated or
 * user-provided HTML. Uses DOMPurify on the client side; on the server
 * (where `window` is unavailable), returns the raw HTML unchanged.
 *
 * @param html - The raw HTML string to sanitize
 * @returns The sanitized HTML string with only allowed tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify");
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "code", "pre", "a", "br", "span", "div", "blockquote"],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}


/**
 * Strips internal Piston container paths and temp file paths from stderr
 * to avoid leaking system details to the end user.
 *
 * @param stderr - Raw stderr output from code execution
 * @returns Sanitized stderr with internal paths removed
 */
export function sanitizeStderr(stderr: string): string {
  return stderr
    .split("\n")
    .filter((line) => !line.match(/\/piston\/jobs\//))
    .filter((line) => !line.match(/^\/tmp\//))
    .join("\n");
}
