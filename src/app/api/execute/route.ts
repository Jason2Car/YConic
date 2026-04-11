import { NextRequest, NextResponse } from "next/server";

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";
const TIMEOUT_MS = 15_000;

const PISTON_LANG_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
};

// Strips internal Piston container paths from error output
function sanitizeOutput(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.match(/\/piston\/jobs\//))
    .join("\n");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.code !== "string" || typeof body.language !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, language } = body as { code: string; language: string };
  const pistonLang = PISTON_LANG_MAP[language];

  if (!pistonLang) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        language: pistonLang.language,
        version: pistonLang.version,
        files: [{ content: code }],
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { stdout: "", stderr: "Code execution service unavailable.", exitCode: 1, timedOut: false },
        { status: 503 }
      );
    }

    const data = await res.json();
    const run = data.run ?? {};

    return NextResponse.json({
      stdout: sanitizeOutput(run.stdout ?? ""),
      stderr: sanitizeOutput(run.stderr ?? ""),
      exitCode: run.code ?? 0,
      timedOut: false,
    });
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({
        stdout: "",
        stderr: "Execution timed out after 15 seconds.",
        exitCode: 1,
        timedOut: true,
      });
    }

    return NextResponse.json(
      { stdout: "", stderr: "Code execution is temporarily unavailable.", exitCode: 1, timedOut: false },
      { status: 503 }
    );
  }
}
