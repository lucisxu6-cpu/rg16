export type AssessmentMode = "quick" | "full";

export type AssessmentPayloadBase = {
  version: string;
  mode: AssessmentMode;
  durationMs?: number;
  answers: Record<string, unknown>;
};

export type AssessmentComputeOutput = {
  answersJson: unknown;
  scoresJson: unknown;
  mbtiJson: unknown;
  qualityJson: unknown;
};

export type AssessmentDefinition<TParsed extends AssessmentPayloadBase = AssessmentPayloadBase> = {
  version: string;
  parse(raw: unknown): TParsed;
  compute(input: TParsed): AssessmentComputeOutput;
};
