"use client";

import { useSession } from "next-auth/react";
import { redirect, useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function IntroPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const project = trpc.project.getById.useQuery({ id: params.projectId }, { enabled: status === "authenticated" });

  const [goals, setGoals] = useState("");
  const [baseline, setBaseline] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  if (status === "unauthenticated") redirect("/login");

  const handleSubmit = async () => {
    if (!goals.trim()) { setError("Please describe your onboarding goals."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.projectId, goals, baseline, repoUrl, githubToken }),
      });
      if (!res.ok) { setError("Failed to generate modules. Please try again."); setLoading(false); return; }
      router.push(`/builder/${params.projectId}/edit`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <a href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Dashboard</a>
        <h1 className="mt-2 text-2xl font-semibold">{project.data?.title ?? "Loading..."}</h1>
        <p className="text-sm text-zinc-400">Tell us about your onboarding goals so the AI can generate a starting layout.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Onboarding Goals *</label>
          <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={4} placeholder="What should a new joinee know or be able to do after completing this?"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Baseline Requirements</label>
          <textarea value={baseline} onChange={(e) => setBaseline(e.target.value)} rows={3} placeholder="What prior knowledge can you assume? (e.g., basic Python, Git fundamentals)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">GitHub Repository (optional)</label>
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          <p className="mt-1 text-xs text-zinc-500">We&apos;ll parse the repo to understand the codebase and tailor the onboarding.</p>
        </div>

        {repoUrl && (
          <div>
            <label className="block text-sm font-medium mb-2">GitHub Token (for private repos)</label>
            <input value={githubToken} onChange={(e) => setGithubToken(e.target.value)} type="password" placeholder="ghp_..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button onClick={handleSubmit} disabled={loading || !goals.trim()}
          className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 transition-colors">
          {loading ? "Generating module layout..." : "Generate Onboarding Layout"}
        </button>
      </div>
    </div>
  );
}
