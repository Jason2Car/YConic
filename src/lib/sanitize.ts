import sanitizeHtmlLib from "sanitize-html";

const ALLOWED_TAGS = ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "code", "pre", "a", "br", "span", "div", "blockquote", "hr", "s"];
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  span: ["class"],
  div: ["class"],
  pre: ["class"],
  code: ["class"],
};

/**
 * Sanitizes HTML content to prevent XSS. Works on both server and client.
 * Uses sanitize-html (no DOM dependency).
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}

/**
 * Strips internal Piston container paths and temp file paths from stderr
 * to avoid leaking system details to the end user.
 */
export function sanitizeStderr(stderr: string): string {
  return stderr
    .split("\n")
    .filter((line) => !line.match(/\/piston\/jobs\//))
    .filter((line) => !line.match(/^\/tmp\//))
    .join("\n");
}
