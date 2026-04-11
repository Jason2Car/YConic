import { NextResponse } from "next/server";
import { z } from "zod";

const ExecuteSchema = z.object({
    language: z.enum(["python", "javascript", "typescript"]),
    code: z.string().min(1).max(50000),
});

const PISTON_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";

/** Map our language names to Piston runtime identifiers */
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    python: { language: "python", version: "3.10.0" },
    javascript: { language: "javascript", version: "18.15.0" },
    typescript: { language: "typescript", version: "5.0.3" },
};

export { sanitizeStderr } from "@/lib/sanitize";

/** POST /api/execute — sandboxed code execution via Piston API */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = ExecuteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { language, code } = parsed.data;
        const runtime = LANGUAGE_MAP[language];

        // 15-second timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(`${PISTON_URL}/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: runtime.language,
                    version: runtime.version,
                    files: [{ content: code }],
                }),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                return NextResponse.json(
                    { error: "Code execution is temporarily unavailable." },
                    { status: 503 }
                );
            }

            const result = await response.json();
            const run = result.run || {};

            return NextResponse.json({
                stdout: run.stdout || "",
                stderr: sanitizeStderr(run.stderr || ""),
                exitCode: run.code ?? 1,
                timedOut: false,
            });
        } catch (err) {
            clearTimeout(timeout);

            if (err instanceof DOMException && err.name === "AbortError") {
                return NextResponse.json({
                    stdout: "",
                    stderr: "Execution timed out after 15 seconds.",
                    exitCode: 1,
                    timedOut: true,
                });
            }

            return NextResponse.json(
                { error: "Code execution is temporarily unavailable." },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error("Execute route error:", error);
        return NextResponse.json(
            { error: "Code execution is temporarily unavailable." },
            { status: 503 }
        );
    }
}
