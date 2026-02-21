import { z } from "zod";

import { QUESTIONNAIRE_VERSION_V1 } from "@/data/questions";
import { QUESTIONNAIRE_VERSION_V2 } from "@/data/jung";
import { computeMbtiFromScoresV1 } from "@/lib/mbti";
import { scoreAssessmentV2 } from "@/lib/jungScoring";
import { inferJungTypeV2 } from "@/lib/jungType";
import { scoreAssessmentV1 } from "@/lib/scoring";
import type {
  AssessmentComputeOutput,
  AssessmentDefinition,
  AssessmentPayloadBase,
} from "@/lib/assessments/types";

const LikertSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const BaseVersionSchema = z.object({
  version: z.string().min(1),
});

const V1CreateSchema = z.object({
  version: z.literal(QUESTIONNAIRE_VERSION_V1),
  mode: z.enum(["quick", "full"]).default("quick"),
  durationMs: z.number().int().nonnegative().optional(),
  answers: z.record(z.string(), LikertSchema),
});

const V2CreateSchema = z.object({
  version: z.literal(QUESTIONNAIRE_VERSION_V2),
  mode: z.enum(["quick", "full"]).default("full"),
  durationMs: z.number().int().nonnegative().optional(),
  answers: z.record(z.string(), z.string()),
});

type V1CreateInput = z.infer<typeof V1CreateSchema>;
type V2CreateInput = z.infer<typeof V2CreateSchema>;

const V1Definition: AssessmentDefinition<V1CreateInput> = {
  version: QUESTIONNAIRE_VERSION_V1,
  parse(raw: unknown) {
    return V1CreateSchema.parse(raw);
  },
  compute(input: V1CreateInput): AssessmentComputeOutput {
    const { scores, quality } = scoreAssessmentV1({
      version: input.version,
      answers: input.answers,
      durationMs: input.durationMs,
    });

    const mbti = computeMbtiFromScoresV1(scores);

    return {
      answersJson: input.answers,
      scoresJson: scores,
      mbtiJson: mbti,
      qualityJson: quality,
    };
  },
};

const V2Definition: AssessmentDefinition<V2CreateInput> = {
  version: QUESTIONNAIRE_VERSION_V2,
  parse(raw: unknown) {
    return V2CreateSchema.parse(raw);
  },
  compute(input: V2CreateInput): AssessmentComputeOutput {
    const { scores, quality } = scoreAssessmentV2({
      version: input.version,
      answers: input.answers,
      durationMs: input.durationMs,
    });

    const jungType = inferJungTypeV2(scores.functions);

    return {
      answersJson: input.answers,
      scoresJson: scores,
      mbtiJson: jungType,
      qualityJson: quality,
    };
  },
};

export const ASSESSMENT_DEFINITIONS: ReadonlyArray<AssessmentDefinition> = [
  V1Definition,
  V2Definition,
];

const definitionByVersion = new Map(
  ASSESSMENT_DEFINITIONS.map((d) => [d.version, d] as const),
);

export function resolveAssessmentDefinition(raw: unknown): AssessmentDefinition {
  const base = BaseVersionSchema.parse(raw);
  const def = definitionByVersion.get(base.version);
  if (!def) {
    throw new Error(`Unsupported questionnaire version: ${base.version}`);
  }
  return def;
}

export function parseAndComputeAssessment(raw: unknown) {
  const def = resolveAssessmentDefinition(raw);
  const parsed = def.parse(raw) as AssessmentPayloadBase;
  const computed = def.compute(parsed);

  return {
    input: parsed,
    computed,
  };
}
