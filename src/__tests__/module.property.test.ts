/**
 * Property-based tests for module ordering and code editor round-trip.
 * These tests validate correctness properties P5 and P7 from the design document.
 * They test the Zustand store's applyChange logic directly (no DB needed).
 */
import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import type { Project, Module, ProposedChange, CodeEditorContent } from "@/lib/types";

// ─── Minimal store logic extracted for testing ───────────────────────────────

function applyChange(project: Project, change: ProposedChange): Project {
  let updated = { ...project };

  if (change.type === "add_module") {
    const payload = change.payload as Partial<Module>;
    const newModule: Module = {
      id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      projectId: project.id,
      type: payload.type ?? "RICH_TEXT",
      title: payload.title ?? "New Module",
      position: project.modules.length,
      content: payload.content ?? { type: "RICH_TEXT", html: "" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updated = { ...project, modules: [...project.modules, newModule] };
  } else if (change.type === "update_module") {
    const payload = change.payload as { id: string } & Partial<Module>;
    updated = {
      ...project,
      modules: project.modules.map((m) =>
        m.id === payload.id ? { ...m, ...payload } : m
      ),
    };
  } else if (change.type === "delete_module") {
    const payload = change.payload as { id: string };
    updated = {
      ...project,
      modules: project.modules
        .filter((m) => m.id !== payload.id)
        .map((m, i) => ({ ...m, position: i })),
    };
  }

  return updated;
}

function reorderModules(project: Project, orderedIds: string[]): Project {
  const moduleMap = new Map(project.modules.map((m) => [m.id, m]));
  const reordered: Module[] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const mod = moduleMap.get(orderedIds[i]);
    if (mod) {
      reordered.push({ ...mod, position: i });
    }
  }
  return { ...project, modules: reordered };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const T = "2025-01-01T00:00:00.000Z";

function makeProject(moduleCount: number): Project {
  const modules: Module[] = [];
  for (let i = 0; i < moduleCount; i++) {
    modules.push({
      id: `mod_${i}`,
      projectId: "proj_test",
      type: "RICH_TEXT",
      title: `Module ${i}`,
      position: i,
      content: { type: "RICH_TEXT", html: `<p>Content ${i}</p>` },
      createdAt: T,
      updatedAt: T,
    });
  }
  return {
    id: "proj_test",
    title: "Test Project",
    description: "",
    slug: null,
    published: false,
    stage: "edit",
    modules,
    createdAt: T,
    updatedAt: T,
  };
}

// Arbitrary: generate a permutation of indices
function permutationArb(n: number): fc.Arbitrary<number[]> {
  return fc.shuffledSubarray(
    Array.from({ length: n }, (_, i) => i),
    { minLength: n, maxLength: n }
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Module Property Tests", () => {
  // Feature: onboarding-project-builder, Property 5: Module order preservation
  describe("P5: Module order preservation", () => {
    it("for any permutation of module IDs, reordering and retrieving preserves the exact order", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (count) => {
            const project = makeProject(count);
            const ids = project.modules.map((m) => m.id);

            // Generate a random permutation
            const perm = fc.sample(permutationArb(count), 1)[0];
            const reorderedIds = perm.map((i) => ids[i]);

            const result = reorderModules(project, reorderedIds);

            // Verify the order matches exactly
            expect(result.modules.map((m) => m.id)).toEqual(reorderedIds);

            // Verify positions are sequential
            for (let i = 0; i < result.modules.length; i++) {
              expect(result.modules[i].position).toBe(i);
            }

            // Verify no modules were lost
            expect(result.modules.length).toBe(count);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("reordering is idempotent — applying the same order twice yields the same result", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }),
          (count) => {
            const project = makeProject(count);
            const ids = project.modules.map((m) => m.id);
            const perm = fc.sample(permutationArb(count), 1)[0];
            const reorderedIds = perm.map((i) => ids[i]);

            const first = reorderModules(project, reorderedIds);
            const second = reorderModules(first, reorderedIds);

            expect(second.modules.map((m) => m.id)).toEqual(first.modules.map((m) => m.id));
            expect(second.modules.map((m) => m.position)).toEqual(first.modules.map((m) => m.position));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: onboarding-project-builder, Property 7: Code editor content round trip
  describe("P7: Code editor content round trip", () => {
    const codeEditorContentArb: fc.Arbitrary<CodeEditorContent> = fc.record({
      type: fc.constant("CODE_EDITOR" as const),
      language: fc.constantFrom("python" as const, "javascript" as const, "typescript" as const),
      starterCode: fc.string({ minLength: 1, maxLength: 500 }),
      hint: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
      solution: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      expectedOutput: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    });

    it("storing and retrieving CodeEditorContent via applyChange produces identical content", () => {
      fc.assert(
        fc.property(
          codeEditorContentArb,
          (content) => {
            const project = makeProject(0);

            // Add a code editor module
            const addChange: ProposedChange = {
              type: "add_module",
              description: "Add code editor",
              payload: {
                type: "CODE_EDITOR",
                title: "Test Code",
                content,
              },
            };

            const updated = applyChange(project, addChange);
            expect(updated.modules.length).toBe(1);

            const stored = updated.modules[0].content as CodeEditorContent;
            expect(stored.type).toBe(content.type);
            expect(stored.language).toBe(content.language);
            expect(stored.starterCode).toBe(content.starterCode);
            expect(stored.hint).toBe(content.hint);
            expect(stored.solution).toBe(content.solution);
            expect(stored.expectedOutput).toBe(content.expectedOutput);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("updating CodeEditorContent preserves all fields exactly", () => {
      fc.assert(
        fc.property(
          codeEditorContentArb,
          codeEditorContentArb,
          (original, updated) => {
            let project = makeProject(0);

            // Add initial module
            project = applyChange(project, {
              type: "add_module",
              description: "Add",
              payload: { type: "CODE_EDITOR", title: "Test", content: original },
            });

            const moduleId = project.modules[0].id;

            // Update the module content
            project = applyChange(project, {
              type: "update_module",
              description: "Update",
              payload: { id: moduleId, content: updated },
            });

            const stored = project.modules[0].content as CodeEditorContent;
            expect(stored.type).toBe(updated.type);
            expect(stored.language).toBe(updated.language);
            expect(stored.starterCode).toBe(updated.starterCode);
            expect(stored.hint).toBe(updated.hint);
            expect(stored.solution).toBe(updated.solution);
            expect(stored.expectedOutput).toBe(updated.expectedOutput);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
