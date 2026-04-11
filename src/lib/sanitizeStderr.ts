/**
 * Strips internal Piston container paths and temp file paths from stderr
 * output to prevent leaking system details to end users.
 *
 * @param stderr - Raw stderr string from code execution
 * @returns Sanitized stderr with internal paths removed
 */
export function sanitizeStderr(stderr: string): string {
  return stderr
    .split("\n")
    .filter((line) => !line.match(/\/piston\/jobs\//))
    .filter((line) => !line.match(/^\/tmp\//))
    .join("\n");
}
