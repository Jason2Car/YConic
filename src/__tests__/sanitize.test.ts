/**
 * Unit tests for sanitize functions.
 * Tests sanitizeStderr (Property 8: Error message safety) and sanitizeHtml.
 */
import { describe, it, expect } from "vitest";
import { sanitizeStderr } from "@/lib/sanitize";

// Feature: onboarding-project-builder, Property 8: Error message safety
describe("sanitizeStderr", () => {
    it("strips lines containing /piston/jobs/ paths", () => {
        const input = [
            "Traceback (most recent call last):",
            '  File "/piston/jobs/abc123/main.py", line 5, in <module>',
            "    result = 1 / 0",
            "ZeroDivisionError: division by zero",
        ].join("\n");

        const result = sanitizeStderr(input);

        expect(result).not.toContain("/piston/jobs/");
        expect(result).toContain("ZeroDivisionError: division by zero");
        expect(result).toContain("Traceback (most recent call last):");
        expect(result).toContain("    result = 1 / 0");
    });

    it("strips lines starting with /tmp/", () => {
        const input = [
            "/tmp/script_runner.sh: line 3: error",
            "SyntaxError: unexpected token",
        ].join("\n");

        const result = sanitizeStderr(input);

        expect(result).not.toContain("/tmp/");
        expect(result).toContain("SyntaxError: unexpected token");
    });

    it("preserves clean error messages unchanged", () => {
        const input = "TypeError: Cannot read property 'x' of undefined";
        expect(sanitizeStderr(input)).toBe(input);
    });

    it("handles empty string", () => {
        expect(sanitizeStderr("")).toBe("");
    });

    it("handles string with only internal paths (returns empty lines)", () => {
        const input = [
            '  File "/piston/jobs/xyz/main.py", line 1',
            "/tmp/runner.sh: error",
        ].join("\n");

        const result = sanitizeStderr(input);
        // Both lines stripped, only empty string remains
        expect(result.trim()).toBe("");
    });

    it("strips multiple piston paths in a multi-line traceback", () => {
        const input = [
            "Traceback (most recent call last):",
            '  File "/piston/jobs/abc/main.py", line 10, in <module>',
            '  File "/piston/jobs/abc/helper.py", line 5, in foo',
            "    raise ValueError('bad input')",
            "ValueError: bad input",
        ].join("\n");

        const result = sanitizeStderr(input);
        const lines = result.split("\n").filter(Boolean);

        expect(lines).not.toContainEqual(expect.stringContaining("/piston/jobs/"));
        expect(result).toContain("ValueError: bad input");
        expect(result).toContain("raise ValueError('bad input')");
    });

    it("does not strip user code paths that happen to contain 'piston'", () => {
        const input = "ImportError: No module named 'piston_engine'";
        expect(sanitizeStderr(input)).toBe(input);
    });

    it("preserves environment variable names in error messages (they're user-facing)", () => {
        const input = "Error: DATABASE_URL is not set";
        expect(sanitizeStderr(input)).toBe(input);
    });
});
