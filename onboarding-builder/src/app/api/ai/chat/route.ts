import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOpenAI } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { ProposedChangeSchema } from "@/lib/ai/schemas";
import { EDIT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const grok = createOpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: process.env.GROK_BASE_URL,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, projectSnapshot } = await req.json();

  const contextMessage = `Current project state:\n${JSON.stringify(projectSnapshot, null, 2)}`;

  try {
    const result = streamObject({
      model: grok(process.env.GROK_MODEL ?? "grok-3"),
      schema: ProposedChangeSchema,
      system: EDIT_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: contextMessage },
        ...messages,
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "The AI assistant is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
