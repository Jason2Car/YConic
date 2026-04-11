"use client";

import { useSession, signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

function DemoMode() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Projects</h1>
          <p className="text-sm text-zinc-400">Demo mode — connect your database &amp; Google OAuth to get started</p>
        </div>
        <a href="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors">
          Sign In
        </a>
      </div>
      <div className="mt-8 space-y-3">
        {/* Demo project cards */}
        {[
          { title: "Frontend Team Onboarding", stage: "EDIT", date: "Apr 10, 2026" },
          { title: "Backend API Bootcamp", stage: "INTRO", date: "Apr 8, 2026" },
          { title: "Design System Guide", stage: "EDIT", date: "Apr 5, 2026" },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 opacity-60">
            <div>
              <p className="text-sm font-medium">{p.title}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                <span className="rounded bg-zinc-800 px-2 py-0.5">{p.stage}</span>
                <span>{p.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-dashed border-zinc-700 p-6 text-center">
        <p className="text-sm text-zinc-500">Set up your <code className="text-zinc-400">.env</code> file to enable full functionality</p>
        <p className="mt-1 text-xs text-zinc-600">DATABASE_URL · AUTH_GOOGLE_ID · AUTH_GOOGLE_SECRET · AUTH_SECRET · GROK_API_KEY</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const projects = trpc.project.list.useQuery(undefined, { enabled: status === "authenticated", retry: false });
  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      utils.project.list.invalidate();
      setShowCreate(false);
      setTitle("");
      setDescription("");
      window.location.href = `/builder/${project.id}/intro`;
    },
  });
  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => { utils.project.list.invalidate(); setDeleteId(null); },
  });

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  if (status === "unauthenticated") return <DemoMode />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Projects</h1>
          <p className="text-sm text-zinc-400">Welcome, {session?.user?.name}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors">
            New Project
          </button>
          <a href="/recruiter/dashboard" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Recruiter View</a>
          <button onClick={() => signOut()} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create New Project</h2>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description (optional)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" rows={3} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={() => createProject.mutate({ title, description })} disabled={!title.trim() || createProject.isPending}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50">
                {createProject.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Delete Project?</h2>
            <p className="text-sm text-zinc-400">This will permanently delete the project and all its modules.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400">Cancel</button>
              <button onClick={() => deleteProject.mutate({ id: deleteId })} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                {deleteProject.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project List */}
      <div className="mt-8 space-y-3">
        {projects.isLoading && <p className="text-zinc-400">Loading projects...</p>}
        {projects.data?.length === 0 && <p className="text-zinc-500">No projects yet. Create your first one!</p>}
        {projects.data?.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="min-w-0 flex-1">
              <a href={p.stage === "EDIT" ? `/builder/${p.id}/edit` : `/builder/${p.id}/intro`} className="text-sm font-medium hover:underline">
                {p.title}
              </a>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                <span className="rounded bg-zinc-800 px-2 py-0.5">{p.stage}</span>
                {p.published && <span className="rounded bg-green-900/50 px-2 py-0.5 text-green-400">Published</span>}
                <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button onClick={() => setDeleteId(p.id)} className="ml-4 text-xs text-zinc-500 hover:text-red-400">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
