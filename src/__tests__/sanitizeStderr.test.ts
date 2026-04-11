import { describe, it, expect } from "vitest";
import { sanitizeStderr } from "@/lib/sanitizeStderr";

describe("sanitizeStderr", () => {
  it("strips lines containing /piston/jobs/ paths", () => {
    const input = `Traceback (most recent call last):
  File "/piston/jobs/abc123/main.py", line 3, in <module>
    x = 1 / 0
ZeroDivisionError: division by zero`;
    const result = sanitizeStderr(input);
    expect(result).not.toContain("/piston/jobs/");
    expect(result).toContain("ZeroDivisionError: division by zero");
  });

  it("strips lines starting with /tmp/", () => {
    const input = `/tmp/script.js:5
ReferenceError: foo is not defined`;
    const result = sanitizeStderr(input);
    expect(result).not.toMatch(/^\/tmp\//m);
    expect(result).toContain("ReferenceError: foo is not defined");
  });

  it("preserves clean error messages", () => {
    const input = "TypeError: Cannot read properties of undefined";
    expect(sanitizeStderr(input)).toBe(input);
  });

  it("handles empty string", () => {
    expect(sanitizeStderr("")).toBe("");
  });

  it("handles multiple piston paths in one output", () => {
    const input = `/piston/jobs/a1/run.sh: line 1
/piston/jobs/a1/main.py: error
SyntaxError: invalid syntax`;
    const result = sanitizeStderr(input);
    expect(result).toBe("SyntaxError: invalid syntax");
  });
});
