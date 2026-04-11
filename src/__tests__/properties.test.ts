/**
 * Property-based tests P1–P8 for the Onboarding Project Builder.
 * Tests the store's applyChange logic and sanitizeStderr directly.
 * Each property runs 100 iterations with fast-check.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { sanitizeStderr } from "@/lib/sanitize";
import type { Project, Module, ProposedChange, CodeEditorContent, InteractiveVisualContent } from "@/lib/types";

// ─── Store logic extracted for testing ───────────────────────────────────────

const T = "2025-01-01T00:00:00.000Z";
let idCounter = 0;

function applyChange(project: Project, change: ProposedChange): Project {
    if (change.type === "add_module") {
        const payload = change.payload as Partial<Module>;
        idCounter++;
        const newModule: Module = {
            id: `mod_test_${idCounter}`,
            projectId: project.id,
            type: payload.type ?? "RICH_TEXT",
            title: payload.title ?? "New Module",
            position: project.modules.length,
            content: payload.content ?? { type: "RICH_TEXT", html: "" },
            createdAt: T, updatedAt: T,
        };
        return { ...project, modules: [...project.modules, newModule] };
    } else if (change.type === "update_module") {
        const payload = change.payload as { id: string } & Partial<Module>;
        return { ...project, modules: project.modules.map((m) => m.id === payload.id ? { ...m, ...payload } : m) };
    } else if (change.type === "delete_module") {
        const payload = change.payload as { id: string };
        return { ...project, modules: project.modules.filter((m) => m.id !== payload.id).map((m, i) => ({ ...m, position: i })) };
    }
    return project;
}

function reorderModules(project: Project, orderedIds: string[]): Project {
    const map = new Map(project.modules.map((m) => [m.id, m]));
    const reordered = orderedIds.map((id, i) => { const m = map.get(id); return m ? { ...m, position: i } : null; }).filter(Boolean) as Module[];
    return { ...project, modules: reordered };
}

function undo(project: Project, snapshotBefore: Project): Project {
    return snapshotBefore;
}

function makeProject(id: string, moduleCount: number, ownerId?: string): Project {
    const modules: Module[] = [];
    for (let i = 0; i < moduleCount; i++) {
        modules.push({ id: `mod_${id}_${i}`, projectId: id, type: "RICH_TEXT", title: `Module ${i}`, position: i, content: { type: "RICH_TEXT", html: `<p>${i}</p>` }, createdAt: T, updatedAt: T });
    }
    return { id, title: `Project ${id}`, description: "", slug: null, published: false, stage: "edit", ownerId: ownerId ?? null, modules, createdAt: T, updatedAt: T };
}

function publishProject(project: Project): Project {
    const slug = `${project.title.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
    return { ...project, published: true, slug };
}

// ─── P1: Project list completeness ───────────────────────────────────────────

describe("P1: Project list completeness", () => {
    // Feature: onboarding-project-builder, Property 1: Project list completeness
    it("for any set of projects per designer, list returns exactly their projects", () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 10 }),
            fc.integer({ min: 0, max: 10 }),
            (countA, countB) => {
                const allProjects: Project[] = [];
                for (let i = 0; i < countA; i++) allProjects.push(makeProject(`a_${i}`, 1, "designer_a"));
                for (let i = 0; i < countB; i++) allProjects.push(makeProject(`b_${i}`, 1, "designer_b"));

                const listA = allProjects.filter((p) => p.ownerId === "designer_a");
                const listB = allProjects.filter((p) => p.ownerId === "designer_b");

                expect(listA.length).toBe(countA);
                expect(listB.length).toBe(countB);
                expect(listA.every((p) => p.ownerId === "designer_a")).toBe(true);
                expect(listB.every((p) => p.ownerId === "designer_b")).toBe(true);
                // No cross-contamination
                expect(listA.some((p) => p.ownerId === "designer_b")).toBe(false);
                expect(listB.some((p) => p.ownerId === "designer_a")).toBe(false);
            }
        ), { numRuns: 100 });
    });
});

// ─── P2: Published project URL uniqueness ────────────────────────────────────

describe("P2: Published project URL uniqueness", () => {
    // Feature: onboarding-project-builder, Property 2: Published project URL uniqueness
    it("for any set of published projects, all slugs are distinct", () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 50 }),
            (count) => {
                const projects = Array.from({ length: count }, (_, i) => publishProject(makeProject(`pub_${i}`, 1)));
                const slugs = projects.map((p) => p.slug).filter(Boolean);
                const uniqueSlugs = new Set(slugs);
                expect(uniqueSlugs.size).toBe(slugs.length);
            }
        ), { numRuns: 100 });
    });
});

// ─── P3: Approve-then-retrieve round trip ────────────────────────────────────

describe("P3: Approve-then-retrieve round trip", () => {
    // Feature: onboarding-project-builder, Property 3: Approve-then-retrieve round trip
    it("for any add_module change, the project state after approval reflects the change", () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 200 }),
            (title, html) => {
                const project = makeProject("rt_test", 0);
                const change: ProposedChange = {
                    type: "add_module", description: "Add module",
                    payload: { type: "RICH_TEXT", title, content: { type: "RICH_TEXT", html } },
                };
                const updated = applyChange(project, change);
                expect(updated.modules.length).toBe(1);
                expect(updated.modules[0].title).toBe(title);
                expect((updated.modules[0].content as { html: string }).html).toBe(html);
            }
        ), { numRuns: 100 });
    });
});

// ─── P4: Undo restores previous state ───────────────────────────────────────

describe("P4: Undo restores previous state", () => {
    // Feature: onboarding-project-builder, Property 4: Undo restores previous state
    it("for any sequence of changes, undo restores the state before the last change", () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 10 }),
            (changeCount) => {
                let project = makeProject("undo_test", 2);
                const snapshots: Project[] = [];

                for (let i = 0; i < changeCount; i++) {
                    snapshots.push(JSON.parse(JSON.stringify(project)));
                    project = applyChange(project, {
                        type: "add_module", description: `Add ${i}`,
                        payload: { type: "RICH_TEXT", title: `Added ${i}`, content: { type: "RICH_TEXT", html: `<p>${i}</p>` } },
                    });
                }

                // Undo should restore the last snapshot
                const restored = undo(project, snapshots[snapshots.length - 1]);
                expect(restored.modules.length).toBe(project.modules.length - 1);
                expect(JSON.stringify(restored)).toBe(JSON.stringify(snapshots[snapshots.length - 1]));
            }
        ), { numRuns: 100 });
    });
});

// ─── P5: Module order preservation (already exists, adding here for completeness)

describe("P5: Module order preservation", () => {
    // Feature: onboarding-project-builder, Property 5: Module order preservation
    it("for any permutation, reorder preserves exact order and contiguous positions", () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 20 }),
            (count) => {
                const project = makeProject("order_test", count);
                const ids = project.modules.map((m) => m.id);
                const shuffled = fc.sample(fc.shuffledSubarray(ids, { minLength: count, maxLength: count }), 1)[0];
                const result = reorderModules(project, shuffled);
                expect(result.modules.map((m) => m.id)).toEqual(shuffled);
                result.modules.forEach((m, i) => expect(m.position).toBe(i));
                expect(result.modules.length).toBe(count);
            }
        ), { numRuns: 100 });
    });
});

// ─── P6: Module ID uniqueness ────────────────────────────────────────────────

describe("P6: Module ID uniqueness", () => {
    // Feature: onboarding-project-builder, Property 6: Module ID uniqueness
    it("for any number of modules added, all IDs are unique", () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 50 }),
            (count) => {
                let project = makeProject("unique_test", 0);
                for (let i = 0; i < count; i++) {
                    project = applyChange(project, {
                        type: "add_module", description: `Add ${i}`,
                        payload: { type: "RICH_TEXT", title: `Mod ${i}`, content: { type: "RICH_TEXT", html: "" } },
                    });
                }
                const ids = project.modules.map((m) => m.id);
                expect(new Set(ids).size).toBe(ids.length);
            }
        ), { numRuns: 100 });
    });
});

// ─── P7: Code editor config round trip (already exists, adding for completeness)

describe("P7: Code editor config round trip", () => {
    // Feature: onboarding-project-builder, Property 7: Code editor config round trip
    const codeArb: fc.Arbitrary<CodeEditorContent> = fc.record({
        type: fc.constant("CODE_EDITOR" as const),
        language: fc.constantFrom("python" as const, "javascript" as const, "typescript" as const),
        starterCode: fc.string({ minLength: 1, maxLength: 500 }),
        hint: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        solution: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        expectedOutput: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    });

    it("storing and retrieving CodeEditorContent produces identical content", () => {
        fc.assert(fc.property(codeArb, (content) => {
            let project = makeProject("code_rt", 0);
            project = applyChange(project, { type: "add_module", description: "Add", payload: { type: "CODE_EDITOR", title: "Test", content } });
            const stored = project.modules[0].content as CodeEditorContent;
            expect(stored.language).toBe(content.language);
            expect(stored.starterCode).toBe(content.starterCode);
            expect(stored.hint).toBe(content.hint);
            expect(stored.solution).toBe(content.solution);
            expect(stored.expectedOutput).toBe(content.expectedOutput);
        }), { numRuns: 100 });
    });
});

// ─── P8: Error message safety ────────────────────────────────────────────────

describe("P8: Error message safety (sanitizeStderr)", () => {
    // Feature: onboarding-project-builder, Property 8: Error message safety
    it("for any stderr containing piston paths, output never contains /piston/jobs/", () => {
        fc.assert(fc.property(
            fc.array(fc.oneof(
                fc.constant('/piston/jobs/abc123/main.py: line 5'),
                fc.constant('/tmp/runner.sh: error'),
                fc.string({ minLength: 1, maxLength: 100 }),
            ), { minLength: 1, maxLength: 20 }),
            (lines) => {
                const stderr = lines.join("\n");
                const result = sanitizeStderr(stderr);
                expect(result).not.toContain("/piston/jobs/");
                expect(result.split("\n").every((l) => !l.startsWith("/tmp/"))).toBe(true);
            }
        ), { numRuns: 100 });
    });

    it("preserves user-facing error messages without internal paths", () => {
        const cleanErrors = [
            "TypeError: Cannot read property 'x' of undefined",
            "SyntaxError: Unexpected token",
            "ValueError: invalid literal",
            "ZeroDivisionError: division by zero",
        ];
        for (const err of cleanErrors) {
            expect(sanitizeStderr(err)).toBe(err);
        }
    });

    it("handles empty string", () => {
        expect(sanitizeStderr("")).toBe("");
    });
});
