import { JUNG_FUNCTIONS_META, JUNG_QUESTIONS_V2, type FunctionId, type Likert } from "@/data/jung";
import type { QualityPack } from "@/lib/scoring";

export type JungAnswerMap = Record<string, string | undefined>;

export type JungScorePackV2 = {
  version: string;
  functions: Record<FunctionId, number>; // 0..100
  raw: Record<FunctionId, number>; // 0..max
  max: Record<FunctionId, number>;
};

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function mean(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]) {
  if (nums.length <= 1) return 0;
  const m = mean(nums);
  const v = mean(nums.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function parseLikert(v: unknown): Likert | null {
  if (typeof v === "number" && v >= 1 && v <= 5) return v as Likert;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 1 && n <= 5) return n as Likert;
  }
  return null;
}

function initFuncRecord<T>(init: () => T): Record<FunctionId, T> {
  const out = {} as Record<FunctionId, T>;
  for (const id of Object.keys(JUNG_FUNCTIONS_META) as FunctionId[]) out[id] = init();
  return out;
}

export function scoreAssessmentV2(args: {
  version: string;
  answers: JungAnswerMap;
  durationMs?: number;
}): { scores: JungScorePackV2; quality: QualityPack } {
  const { version, answers, durationMs } = args;

  const total = JUNG_QUESTIONS_V2.length;
  let answered = 0;

  const raw = initFuncRecord(() => 0);
  const max = initFuncRecord(() => 0);

  // Quality: likert variance + repeated choice positions + completion + speed.
  const likertVals: number[] = [];
  const choicePositions: number[] = []; // 0..3 based on option index; only for non-likert

  for (const q of JUNG_QUESTIONS_V2) {
    const a = answers[q.id];
    if (a != null) answered += 1;

    if (q.type === "likert") {
      max[q.func] += 1;
      const lv = parseLikert(a) ?? 3;
      let w = (lv - 1) / 4;
      if (q.reverse) w = 1 - w;
      raw[q.func] += w;
      likertVals.push(lv);
      continue;
    }

    // For forced/situation: each function is "available" once per question.
    for (const opt of q.options) max[opt.func] += 1;

    if (a == null) continue;
    const idx = q.options.findIndex((o) => o.id === a);
    if (idx >= 0) choicePositions.push(idx);

    const chosen = q.options.find((o) => o.id === a);
    if (chosen) raw[chosen.func] += 1;
  }

  const completion = total === 0 ? 0 : answered / total;
  const std = stddev(likertVals);

  // Choice distribution bias (always picking first/second/etc).
  const posCounts = new Map<number, number>();
  for (const p of choicePositions) posCounts.set(p, (posCounts.get(p) ?? 0) + 1);
  const posTotal = choicePositions.length;
  const maxPosShare = posTotal === 0 ? 1 : Math.max(...Array.from(posCounts.values()).map((c) => c / posTotal));

  // Longest run of identical choice positions.
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < choicePositions.length; i++) {
    if (choicePositions[i] === choicePositions[i - 1]) run += 1;
    else run = 1;
    if (run > maxRun) maxRun = run;
  }

  const avgMsPerItem = durationMs != null && total > 0 ? durationMs / total : undefined;

  const completionScore = clamp01(completion);
  const varianceScore = clamp01(std / 1.2);
  const choiceBiasScore = clamp01(1 - maxPosShare) / 0.6; // normalize: <=0.4 is "very biased"
  const straightlineScore =
    choicePositions.length === 0 ? 1 : clamp01(1 - maxRun / Math.max(1, choicePositions.length));
  const speedScore =
    avgMsPerItem == null
      ? 1
      : avgMsPerItem <= 500
        ? 0
        : avgMsPerItem >= 1400
          ? 1
          : (avgMsPerItem - 500) / (1400 - 500);

  const quality = Math.round(
    100 *
      (0.38 * completionScore + 0.18 * varianceScore + 0.18 * choiceBiasScore + 0.14 * straightlineScore + 0.12 * speedScore),
  );

  const warnings: string[] = [];
  if (completion < 1) warnings.push("未完成全部题目, 结果可靠性会下降。");
  if (std < 0.6) warnings.push("李克特题作答分布较一致, 建议更贴近真实而不是“应该”。");
  if (posTotal >= 10 && maxPosShare > 0.72) warnings.push("选择分布偏向某一位置（A/B/C/D）, 可能存在随手点选。");
  if (choicePositions.length >= 12 && maxRun >= Math.ceil(choicePositions.length * 0.5))
    warnings.push("连续选择同一位置较多, 建议放慢并按真实偏好作答。");
  if (avgMsPerItem != null && avgMsPerItem < 520) warnings.push("作答速度偏快, 建议放慢以提升稳定性。");

  const functions = initFuncRecord(() => 50);
  for (const id of Object.keys(functions) as FunctionId[]) {
    const m = max[id];
    functions[id] = m <= 0 ? 50 : Math.round((raw[id] / m) * 100);
  }

  return {
    scores: { version, functions, raw, max },
    quality: {
      answered,
      total,
      completion,
      std: Number(std.toFixed(2)),
      maxRun,
      avgMsPerItem: avgMsPerItem != null ? Math.round(avgMsPerItem) : undefined,
      quality,
      warnings,
    },
  };
}

