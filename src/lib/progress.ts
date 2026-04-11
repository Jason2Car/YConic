import type { JoineeProgress } from "@/lib/types";

const STORAGE_PREFIX = "opb_progress_";

/** Get progress for a project slug from localStorage. Returns empty progress on error. */
export function getProgress(slug: string): JoineeProgress {
    const empty: JoineeProgress = { projectSlug: slug, completedModuleIds: [], lastVisited: new Date().toISOString() };
    if (typeof globalThis.localStorage === "undefined") return empty;

    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
        if (!raw) return empty;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.completedModuleIds)) return empty;
        return {
            projectSlug: slug,
            completedModuleIds: parsed.completedModuleIds.filter((id: unknown) => typeof id === "string"),
            lastVisited: typeof parsed.lastVisited === "string" ? parsed.lastVisited : new Date().toISOString(),
        };
    } catch {
        return empty;
    }
}

/** Mark a module as complete for a project slug. Idempotent — adding the same ID twice is a no-op. */
export function markComplete(slug: string, moduleId: string): void {
    if (typeof globalThis.localStorage === "undefined") return;

    const progress = getProgress(slug);
    if (!progress.completedModuleIds.includes(moduleId)) {
        progress.completedModuleIds.push(moduleId);
    }
    progress.lastVisited = new Date().toISOString();

    try {
        localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(progress));
    } catch {
        // localStorage full or unavailable — silently fail
    }
}

/** Reset all progress for a project slug. */
export function resetProgress(slug: string): void {
    if (typeof globalThis.localStorage === "undefined") return;
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${slug}`);
    } catch {
        // silently fail
    }
}
