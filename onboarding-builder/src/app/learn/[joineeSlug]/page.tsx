"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

const BADGE_STYLES: Record<string, string> = {
  STANDARD: "bg-blue-900/50 text-blue-400",
  FAST_TRACK: "bg-yellow-900/50 text-yellow-400",
  SUPPLEMENTAL: "bg-purple-900/50 text-purple-400",
  ADVANCED: "bg-green-900/50 text-green-400",
};

interface QuizQuestion { prompt: string; options: string[]; correctIndex: number; explanation: string }
interface QuizResult { moduleId: string; passed: boolean; attemptedAt: string }
interface Progress { joineeSlug: string; completedModuleIds: string[]; quizResults: QuizResult[]; lastVisited: string }

function getProgress(slug: string): Progress {
  if (typeof window === "undefined") return { joineeSlug: slug, completedModuleIds: [], quizResults: [], lastVisited: new Date().toISOString() };
  const raw = localStorage.getItem(`opb_progress_${slug}`);
  return raw ? JSON.parse(raw) : { joineeSlug: slug, completedModuleIds: [], quizResults: [], lastVisited: new Date().toISOString() };
}

function saveProgress(p: Progress) {
  if (typeof window !== "undefined") localStorage.setItem(`opb_progress_${p.joineeSlug}`, JSON.stringify({ ...p, lastVisited: new Date().toISOString() }));
}

export default function LearnPage() {
  const params = useParams<{ joineeSlug: string }>();
  const data = trpc.enrollment.getBySlug.useQuery({ joineeSlug: params.joineeSlug });
  const [progress, setProgress] = useState<Progress>({ joineeSlug: params.joineeSlug, completedModuleIds: [], quizResults: [], lastVisited: "" });
  const [activeModule, setActiveModule] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => { setProgress(getProgress(params.joineeSlug)); }, [params.joineeSlug]);

  if (data.isLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading your onboarding...</p></div>;
  if (data.error) return <div className="flex min-h-screen items-center justify-center"><p className="text-red-400">Project not found.</p></div>;

  const project = data.data!.personalizedProject!;
  const modules = project.modules;
  const current = modules[activeModule];
  const completed = progress.completedModuleIds.length;
  const total = modules.length;
  const content = current?.content as Record<string, unknown> | null;
  const quiz = content?.selfCheckQuiz as { questions: QuizQuestion[] } | undefined;

  const markComplete = () => {
    if (!progress.completedModuleIds.includes(current.id)) {
      const updated = { ...progress, completedModuleIds: [...progress.completedModuleIds, current.id] };
      setProgress(updated);
      saveProgress(updated);
    }
    if (activeModule < modules.length - 1) { setActiveModule(activeModule + 1); setQuizSubmitted(false); setQuizAnswers({}); }
  };

  const submitQuiz = () => {
    if (!quiz) return;
    const passed = quiz.questions.every((q, i) => quizAnswers[`${i}`] === q.correctIndex);
    const result: QuizResult = { moduleId: current.id, passed, attemptedAt: new Date().toISOString() };
    const updated = { ...progress, quizResults: [...progress.quizResults.filter((r) => r.moduleId !== current.id), result] };
    setProgress(updated);
    saveProgress(updated);
    setQuizSubmitted(true);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-sm font-semibold truncate">{project.title}</h1>
          <p className="mt-1 text-xs text-zinc-500">Welcome, {data.data!.joinee.name}</p>
          <div className="mt-3 h-1.5 rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{completed}/{total} modules completed</p>
        </div>
        <div className="p-2 space-y-1">
          {modules.map((m, i) => (
            <button key={m.id} onClick={() => { setActiveModule(i); setQuizSubmitted(false); setQuizAnswers({}); }}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${i === activeModule ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
              <div className="flex items-center gap-2">
                {progress.completedModuleIds.includes(m.id) ? <span className="text-green-400">✓</span> : <span className="text-zinc-600">{i + 1}</span>}
                <span className="truncate">{m.title}</span>
              </div>
              <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] ${BADGE_STYLES[m.adaptationType] ?? ""}`}>
                {m.adaptationType.replace("_", " ")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {current && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">{current.title}</h2>
              <span className={`rounded px-2 py-0.5 text-xs ${BADGE_STYLES[current.adaptationType] ?? ""}`}>{current.adaptationType.replace("_", " ")}</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{current.contentDepth}</span>
            </div>
            {current.rationale && <p className="text-xs text-zinc-500 mb-4 italic">{current.rationale}</p>}

            {/* Rich text content */}
            {typeof content?.html === "string" && <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.html }} />}

            {/* Code editor content */}
            {typeof content?.starterCode === "string" && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
                  <span>Language: {String(content.language ?? "unknown")}</span>
                </div>
                <pre className="text-sm text-zinc-300 overflow-x-auto"><code>{String(content.starterCode)}</code></pre>
                {typeof content.hint === "string" && <p className="mt-3 text-xs text-zinc-500">Hint: {content.hint}</p>}
              </div>
            )}

            {/* Mermaid content */}
            {typeof content?.mermaidDefinition === "string" && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <pre className="text-sm text-zinc-300 overflow-x-auto"><code>{String(content.mermaidDefinition)}</code></pre>
              </div>
            )}

            {/* Self-check quiz for fast-tracked modules */}
            {quiz && quiz.questions.length > 0 && (
              <div className="mt-6 rounded-lg border border-yellow-800/50 bg-yellow-950/20 p-4">
                <h3 className="text-sm font-medium text-yellow-400 mb-3">Self-Check Quiz</h3>
                {quiz.questions.map((q, qi) => (
                  <div key={qi} className="mb-4">
                    <p className="text-sm mb-2">{q.prompt}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                          quizSubmitted ? (oi === q.correctIndex ? "bg-green-900/30 text-green-400" : quizAnswers[`${qi}`] === oi ? "bg-red-900/30 text-red-400" : "text-zinc-400")
                          : quizAnswers[`${qi}`] === oi ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                        }`}>
                          <input type="radio" name={`q${qi}`} checked={quizAnswers[`${qi}`] === oi} onChange={() => setQuizAnswers({ ...quizAnswers, [`${qi}`]: oi })} disabled={quizSubmitted} className="sr-only" />
                          <span className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-xs">
                            {quizAnswers[`${qi}`] === oi ? "●" : ""}
                          </span>
                          {opt}
                        </label>
                      ))}
                    </div>
                    {quizSubmitted && <p className="mt-1 text-xs text-zinc-500">{q.explanation}</p>}
                  </div>
                ))}
                {!quizSubmitted && (
                  <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50">Submit Quiz</button>
                )}
                {quizSubmitted && (
                  <p className={`text-sm font-medium ${progress.quizResults.find((r) => r.moduleId === current.id)?.passed ? "text-green-400" : "text-red-400"}`}>
                    {progress.quizResults.find((r) => r.moduleId === current.id)?.passed ? "✓ Passed!" : "✗ Review the explanations and try the next module."}
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button onClick={markComplete} className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100">
                {activeModule < modules.length - 1 ? "Complete & Next →" : "Complete Module ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
