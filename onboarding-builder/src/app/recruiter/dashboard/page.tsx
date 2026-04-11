"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function RecruiterDashboard() {
  const { data: session, status } = useSession();
  const [showEnroll, setShowEnroll] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const utils = trpc.useUtils();
  const enrollments = trpc.enrollment.list.useQuery({}, { enabled: status === "authenticated", retry: false });
  const publishedProjects = trpc.project.list.useQuery(undefined, { enabled: status === "authenticated", retry: false });
  const createEnrollment = trpc.enrollment.create.useMutation({
    onSuccess: (enrollment) => {
      utils.enrollment.list.invalidate();
      setShowEnroll(false);
      window.location.href = `/recruiter/enrollments/${enrollment.id}/profile`;
    },
  });

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  if (status === "unauthenticated") redirect("/login");

  const published = publishedProjects.data?.filter((p) => p.published) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
          <p className="text-sm text-zinc-400">Manage employee onboarding enrollments</p>
        </div>
        <div className="flex gap-3">
          <a href="/dashboard" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Designer View</a>
          <button onClick={() => setShowEnroll(true)} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100">Add Employee</button>
        </div>
      </div>

      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Enroll New Employee</h2>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none">
              <option value="">Select a published project...</option>
              {published.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            {published.length === 0 && <p className="text-xs text-zinc-500">No published projects. Create and publish one from the Designer dashboard first.</p>}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Employee name" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Employee email" type="email" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job title" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEnroll(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400">Cancel</button>
              <button onClick={() => createEnrollment.mutate({ projectId, joineeName: name, joineeEmail: email, joineeJobTitle: jobTitle })}
                disabled={!projectId || !name || !email || !jobTitle || createEnrollment.isPending}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50">
                {createEnrollment.isPending ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {enrollments.isLoading && <p className="text-zinc-400">Loading enrollments...</p>}
        {enrollments.data?.length === 0 && <p className="text-zinc-500">No enrollments yet. Add an employee to get started.</p>}
        {enrollments.data?.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="min-w-0 flex-1">
              <a href={e.stage === "DELIVERED" ? "#" : `/recruiter/enrollments/${e.id}/${e.stage === "ENROLL" ? "profile" : "personalize"}`}
                className="text-sm font-medium hover:underline">{e.joinee.name}</a>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                <span>{e.joinee.email}</span>
                <span className="rounded bg-zinc-800 px-2 py-0.5">{e.stage}</span>
                <span>{e.sourceProject.title}</span>
              </div>
            </div>
            {e.stage === "DELIVERED" && e.joineeSlug && (
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/learn/${e.joineeSlug}`)}
                className="ml-4 rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-white">Copy Link</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
