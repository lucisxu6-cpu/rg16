import { NextResponse } from "next/server";

import { parseAndComputeAssessment } from "@/lib/assessments/definitions";
import { createAssessment } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { input, computed } = parseAndComputeAssessment(json);

    const created = await createAssessment({
      version: input.version,
      mode: input.mode,
      durationMs: input.durationMs,
      answersJson: computed.answersJson,
      scoresJson: computed.scoresJson,
      mbtiJson: computed.mbtiJson,
      qualityJson: computed.qualityJson,
    });

    return NextResponse.json({ assessmentId: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
