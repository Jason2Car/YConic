"use client";

import { useSession } from "next-auth/react";
import { redirect, useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams<{ enrollmentId: string }>();
  const router = useRouter();
  const enrollment = trpc.enrollment.getById.useQuery({ id: params.enrollmentId }, { enabled: status === "authenticated" });
  const submitProfile = trpc.enrollment.submitProfile.useMutation();

  const [identity, setIdentity] = useState({ name: "", email: "", jobTitle: "" });
  const [roleContext, setRoleContext] = useState({ team: "", responsibilities: "" });
  const [experience, setExperience] = useState({ yearsRelevant: 0, previousRoles: "", domains: "" });
  const [skills, setSkills] = useState<Record<string, "none" | "partial" | "proficient">>({});
  const [prefs, setPrefs] = useState({ preferredLanguage: "" as string, explanationStyle: "conceptual_first" as string, accessibilityNeeds: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill identity from joinee data
  const joinee = enrollment.data?.joinee;
  if (joinee && !identity.name) {
    setIdentity({ name: joinee.name, email: joinee.email, jobTitle: joinee.jobTitle });
  }

  if (status === "loading" || enrollment.isLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  if (status === "unauthenticated") redirect("/login");

  const modules = enrollment.data?.sourceProject.modules ?? [];

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const profile = {
        identity,
        roleContext,
        priorExperience: {
          yearsRelevant: experience.yearsRelevant,
          previousRoles: experience.previousRoles.split(",").map((s) => s.trim()).filter(Boolean),
          domains: experience.domains.split(",").map((s) => s.trim()).filter(Boolean),
        },
        skillAssessment: modules.map((m) => ({ sourceModuleId: m.id, moduleTitle: m.title, knowledgeLevel: skills[m.id] ?? "none" as const })),
        learningPreferences: {
          preferredLanguage: (prefs.preferredLanguage || null) as "python" | "javascript" | "typescript" | null,
          explanationStyle: prefs.explanationStyle as "conceptual_first" | "example_first",
          accessibilityNeeds: prefs.accessibilityNeeds,
        },
      };

      await submitProfile.mutateAsync({ id: params.enrollmentId, profile });

      // Trigger AI personalization
      const res = await fetch("/api/ai/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: params.enrollmentId }),
      });
      if (!res.ok) { setError("AI personalization failed. Profile saved — you can retry from the next page."); }

      router.push(`/recruiter/enrollments/${params.enrollmentId}/personalize`);
    } catch {
      setError("Failed to submit profile. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a href="/recruiter/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Recruiter Dashboard</a>
      <h1 className="mt-2 text-2xl font-semibold">Joinee Profile</h1>
      <p className="text-sm text-zinc-400 mb-6">Fill in the employee&apos;s details for personalized onboarding.</p>

      <div className="space-y-6">
        {/* Identity */}
        <section>
          <h2 className="text-sm font-medium mb-3">Identity</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} placeholder="Full name" className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
            <input value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          </div>
          <input value={identity.jobTitle} onChange={(e) => setIdentity({ ...identity, jobTitle: e.target.value })} placeholder="Job title" className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </section>

        {/* Role Context */}
        <section>
          <h2 className="text-sm font-medium mb-3">Role Context</h2>
          <input value={roleContext.team} onChange={(e) => setRoleContext({ ...roleContext, team: e.target.value })} placeholder="Team (e.g., Frontend Platform)" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          <textarea value={roleContext.responsibilities} onChange={(e) => setRoleContext({ ...roleContext, responsibilities: e.target.value })} placeholder="Day-to-day responsibilities" rows={2} className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </section>

        {/* Prior Experience */}
        <section>
          <h2 className="text-sm font-medium mb-3">Prior Experience</h2>
          <input type="number" value={experience.yearsRelevant} onChange={(e) => setExperience({ ...experience, yearsRelevant: +e.target.value })} placeholder="Years of relevant experience" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          <input value={experience.previousRoles} onChange={(e) => setExperience({ ...experience, previousRoles: e.target.value })} placeholder="Previous roles (comma-separated)" className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          <input value={experience.domains} onChange={(e) => setExperience({ ...experience, domains: e.target.value })} placeholder="Domains (e.g., web, mobile, ML)" className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </section>

        {/* Skill Assessment */}
        <section>
          <h2 className="text-sm font-medium mb-3">Skill Assessment</h2>
          <p className="text-xs text-zinc-500 mb-3">Rate the joinee&apos;s knowledge for each module topic.</p>
          <div className="space-y-2">
            {modules.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <span className="text-sm">{m.title}</span>
                <select value={skills[m.id] ?? "none"} onChange={(e) => setSkills({ ...skills, [m.id]: e.target.value as "none" | "partial" | "proficient" })}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs focus:outline-none">
                  <option value="none">No knowledge</option>
                  <option value="partial">Partial</option>
                  <option value="proficient">Proficient</option>
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Learning Preferences */}
        <section>
          <h2 className="text-sm font-medium mb-3">Learning Preferences</h2>
          <select value={prefs.preferredLanguage} onChange={(e) => setPrefs({ ...prefs, preferredLanguage: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none">
            <option value="">No language preference</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
          <select value={prefs.explanationStyle} onChange={(e) => setPrefs({ ...prefs, explanationStyle: e.target.value })}
            className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none">
            <option value="conceptual_first">Conceptual first</option>
            <option value="example_first">Example first</option>
          </select>
          <input value={prefs.accessibilityNeeds} onChange={(e) => setPrefs({ ...prefs, accessibilityNeeds: e.target.value })} placeholder="Accessibility needs (optional)" className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button onClick={handleSubmit} disabled={loading || !identity.name || !identity.email}
          className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50">
          {loading ? "Generating personalization plan..." : "Submit Profile & Generate Plan"}
        </button>
      </div>
    </div>
  );
}
