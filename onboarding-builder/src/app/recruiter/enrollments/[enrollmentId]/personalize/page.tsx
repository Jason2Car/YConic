"use client";

import { useSession } from "next-auth/react";
import { redirect, useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const BADGE_COLORS: Record<string, string> = {
  standard: "bg-blue-900/50 text-blue-400",
  fast_track: "bg-yellow-900/50 text-yellow-400",
  supplemental: "bg-purple-900/50 text-purple-400",
  advanced: "bg-green-900/50 text-green-400",
};

const DEPTH_COLORS: Record<string, string> = {
  foundational: "bg-zinc-800 text-zinc-400",
  standard: "bg-zinc-800 text-zinc-300",
  advanced: "bg-zinc-800 text-zinc-200",
};

export default function PersonalizePage() {
  const { status } = useSession();
  const params = useParams<{ enrollmentId: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const enrollment = trpc.enrollment.getById.useQuery({ id: params.enrollmentId }, { enabled: status === "authenticated" });
  const approve = trpc.enrollment.approve.useMutation();
  const updateSpec = trpc.enrollment.updateSpec.useMutation({ onSuccess: () => utils.enrollment.getById.invalidate({ id: params.enrollmentId }) });

  const [regenerating, setRegenerating] = useState(false);
  const [regenerateNote, setRegenerateNote] = useState("");
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [approvedUrl, setApprovedUrl] = useState("");

  if (status === "loading" || enrollment.isLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  if (status === "unauthenticated") redirect("/login");

  const plan = enrollment.data?.personalizationPlan as { summary: string; specs: Array<{ sourceModuleId: string | null; title: string; adaptationType: string; contentDepth: string; rationale: string; type: string }> } | null;

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <a href="/recruiter/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">← Back</a>
        <h1 className="mt-2 text-2xl font-semibold">Personalization Plan</h1>
        <p className="mt-4 text-zinc-400">No plan generated yet. Go back to the profile page to submit the joinee&apos;s profile.</p>
        <a href={`/recruiter/enrollments/${params.enrollmentId}/profile`} className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900">Go to Profile</a>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      const result = await approve.mutateAsync({ id: params.enrollmentId });
      setApprovedUrl(`${window.location.origin}${result.learnUrl}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Approval failed");
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch("/api/ai/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: params.enrollmentId, regenerateNote }),
      });
      utils.enrollment.getById.invalidate({ id: params.enrollmentId });
      setShowRegenerate(false);
      setRegenerateNote("");
    } catch { /* handled by UI */ }
    setRegenerating(false);
  };

  if (approvedUrl) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <div className="rounded-xl border border-green-800 bg-green-950/30 p-8">
          <h1 className="text-2xl font-semibold text-green-400">Enrollment Approved!</h1>
          <p className="mt-2 text-sm text-zinc-400">Share this link with the employee:</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <code className="rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-200">{approvedUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(approvedUrl)} className="rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:text-white">Copy</button>
          </div>
          <a href="/recruiter/dashboard" className="mt-6 inline-block text-sm text-zinc-400 hover:text-white">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href="/recruiter/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Dashboard</a>
      <h1 className="mt-2 text-2xl font-semibold">Personalization Plan</h1>
      <p className="mt-1 text-sm text-zinc-400">{plan.summary}</p>

      <div className="mt-6 space-y-3">
        {plan.specs.map((spec, i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{spec.title}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${BADGE_COLORS[spec.adaptationType] ?? "bg-zinc-800 text-zinc-400"}`}>{spec.adaptationType.replace("_", " ")}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${DEPTH_COLORS[spec.contentDepth] ?? ""}`}>{spec.contentDepth}</span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{spec.type}</span>
              </div>
              <div className="flex gap-2">
                <select value={spec.adaptationType} onChange={(e) => updateSpec.mutate({ enrollmentId: params.enrollmentId, specIndex: i, patch: { adaptationType: e.target.value as "STANDARD" | "FAST_TRACK" | "SUPPLEMENTAL" | "ADVANCED" } })}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs focus:outline-none">
                  <option value="standard">Standard</option>
                  <option value="fast_track">Fast Track</option>
                  <option value="supplemental">Supplemental</option>
                  <option value="advanced">Advanced</option>
                </select>
                <select value={spec.contentDepth} onChange={(e) => updateSpec.mutate({ enrollmentId: params.enrollmentId, specIndex: i, patch: { contentDepth: e.target.value as "FOUNDATIONAL" | "STANDARD" | "ADVANCED" } })}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs focus:outline-none">
                  <option value="foundational">Foundational</option>
                  <option value="standard">Standard</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{spec.rationale}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={handleApprove} disabled={approve.isPending}
          className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50">
          {approve.isPending ? "Approving..." : "Approve & Generate"}
        </button>
        <button onClick={() => setShowRegenerate(true)} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-white">Regenerate</button>
      </div>

      {showRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Regenerate Plan</h2>
            <textarea value={regenerateNote} onChange={(e) => setRegenerateNote(e.target.value)} placeholder="Optional note for the AI (e.g., 'reduce supplemental modules')" rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRegenerate(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400">Cancel</button>
              <button onClick={handleRegenerate} disabled={regenerating} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50">
                {regenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
