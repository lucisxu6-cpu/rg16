import { NextResponse } from "next/server";
import { z } from "zod";

import { QUESTIONNAIRE_VERSION_V1 } from "@/data/questions";
import { computeMbtiFromScoresV1 } from "@/lib/mbti";
import { scoreAssessmentV1 } from "@/lib/scoring";
import { createAssessment } from "@/lib/store";

export const runtime = "nodejs";

const LikertSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const CreateAssessmentSchema = z.object({
  version: z.literal(QUESTIONNAIRE_VERSION_V1),
  mode: z.enum(["quick", "full"]).default("quick"),
  durationMs: z.number().int().nonnegative().optional(),
  answers: z.record(z.string(), LikertSchema),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = CreateAssessmentSchema.parse(json);

    const { scores, quality } = scoreAssessmentV1({
      version: input.version,
      answers: input.answers,
      durationMs: input.durationMs,
    });

    const mbti = computeMbtiFromScoresV1(scores);

    const created = await createAssessment({
      version: input.version,
      mode: input.mode,
      durationMs: input.durationMs,
      answersJson: input.answers,
      scoresJson: scores,
      mbtiJson: mbti,
      qualityJson: quality,
    });

    return NextResponse.json({ assessmentId: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
