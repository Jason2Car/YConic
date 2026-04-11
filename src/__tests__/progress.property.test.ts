/**
 * Property-based tests for Joinee progress persistence (localStorage).
 * These tests validate correctness properties P9 and P10 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { getProgress, markComplete, resetProgress } from "@/lib/progress";

// Mock localStorage for Node.js environment
const store: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// Arbitrary: generate a slug-like string
const slugArb = fc.string({ minLength: 3, maxLength: 20 }).map((s) =>
    s.replace(/[^a-z0-9]/gi, "").slice(0, 15) || "testslug"
);

// Arbitrary: generate a unique module ID
const moduleIdArb = fc.string({ minLength: 5, maxLength: 15 }).map((s) =>
    `mod-${s.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "default"}`
);

// Arbitrary: generate an array of unique module IDs
const uniqueModuleIdsArb = fc.array(moduleIdArb, { minLength: 0, maxLength: 20 })
    .map((ids) => [...new Set(ids)]);

describe("Progress Persistence", () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    // Feature: onboarding-project-builder, Property 9: Progress indicator accuracy
    it("P9: progress count equals number of completed module IDs for any combination", () => {
        fc.assert(
            fc.property(
                slugArb,
                uniqueModuleIdsArb,
                uniqueModuleIdsArb,
                (slug, allModuleIds, completedCandidates) => {
                    localStorageMock.clear();

                    // Only mark modules that exist in the total set
                    const validCompleted = completedCandidates.filter((id) => allModuleIds.includes(id));
                    for (const id of validCompleted) {
                        markComplete(slug, id);
                    }

                    const progress = getProgress(slug);
                    const completedCount = progress.completedModuleIds.length;

                    // The count should equal exactly the number of unique completed IDs
                    expect(completedCount).toBe(validCompleted.length);

                    // All completed IDs should be in the progress record
                    for (const id of validCompleted) {
                        expect(progress.completedModuleIds).toContain(id);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: onboarding-project-builder, Property 10: Progress persistence round trip
    it("P10: completed modules are fully recoverable after write-then-read", () => {
        fc.assert(
            fc.property(
                slugArb,
                uniqueModuleIdsArb,
                (slug, moduleIds) => {
                    localStorageMock.clear();

                    // Mark each module as complete
                    for (const id of moduleIds) {
                        markComplete(slug, id);
                    }

                    // Read back progress (simulates page refresh)
                    const recovered = getProgress(slug);

                    // Should contain exactly the marked IDs — no additions, no losses
                    expect(new Set(recovered.completedModuleIds)).toEqual(new Set(moduleIds));
                    expect(recovered.completedModuleIds.length).toBe(moduleIds.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("P10: markComplete is idempotent — marking the same ID twice does not duplicate", () => {
        fc.assert(
            fc.property(
                slugArb,
                moduleIdArb,
                fc.integer({ min: 2, max: 10 }),
                (slug, moduleId, repeatCount) => {
                    localStorageMock.clear();

                    for (let i = 0; i < repeatCount; i++) {
                        markComplete(slug, moduleId);
                    }

                    const progress = getProgress(slug);
                    const occurrences = progress.completedModuleIds.filter((id) => id === moduleId).length;
                    expect(occurrences).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("resetProgress clears all progress for a slug", () => {
        fc.assert(
            fc.property(
                slugArb,
                uniqueModuleIdsArb.filter((ids) => ids.length > 0),
                (slug, moduleIds) => {
                    localStorageMock.clear();

                    for (const id of moduleIds) {
                        markComplete(slug, id);
                    }
                    resetProgress(slug);

                    const progress = getProgress(slug);
                    expect(progress.completedModuleIds).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("getProgress returns empty progress for unknown slugs", () => {
        localStorageMock.clear();
        const progress = getProgress("nonexistent-slug");
        expect(progress.completedModuleIds).toEqual([]);
        expect(progress.projectSlug).toBe("nonexistent-slug");
    });

    it("getProgress handles corrupt localStorage data gracefully", () => {
        localStorageMock.clear();
        localStorageMock.setItem("opb_progress_test-slug", "not valid json{{{");
        const progress = getProgress("test-slug");
        expect(progress.completedModuleIds).toEqual([]);
    });
});
