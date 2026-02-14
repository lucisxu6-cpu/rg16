import { NextResponse } from "next/server";
import { z } from "zod";

import { QUESTIONNAIRE_VERSION_V1 } from "@/data/questions";
import { QUESTIONNAIRE_VERSION_V2 } from "@/data/jung";
import { computeMbtiFromScoresV1 } from "@/lib/mbti";
import { scoreAssessmentV2 } from "@/lib/jungScoring";
import { inferJungTypeV2 } from "@/lib/jungType";
import { scoreAssessmentV1 } from "@/lib/scoring";
import { createAssessment } from "@/lib/store";

export const runtime = "nodejs";

const LikertSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const CreateAssessmentSchema = z.discriminatedUnion("version", [
  z.object({
    version: z.literal(QUESTIONNAIRE_VERSION_V1),
    mode: z.enum(["quick", "full"]).default("quick"),
    durationMs: z.number().int().nonnegative().optional(),
    answers: z.record(z.string(), LikertSchema),
  }),
  z.object({
    version: z.literal(QUESTIONNAIRE_VERSION_V2),
    mode: z.enum(["quick", "full"]).default("full"),
    durationMs: z.number().int().nonnegative().optional(),
    answers: z.record(z.string(), z.string()),
  }),
]);

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = CreateAssessmentSchema.parse(json);

    if (input.version === QUESTIONNAIRE_VERSION_V1) {
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
    }

    const { scores, quality } = scoreAssessmentV2({
      version: input.version,
      answers: input.answers,
      durationMs: input.durationMs,
    });

    const jungType = inferJungTypeV2(scores.functions);

    const created = await createAssessment({
      version: input.version,
      mode: input.mode,
      durationMs: input.durationMs,
      answersJson: input.answers,
      scoresJson: scores,
      mbtiJson: jungType,
      qualityJson: quality,
    });

    return NextResponse.json({ assessmentId: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
