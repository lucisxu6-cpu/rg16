import { ASPECTS_V1, QUESTIONS_V1, type AspectId, type Likert, type TraitId } from "@/data/questions";

export type AnswerMap = Record<string, Likert | undefined>;

export type ScorePackV1 = {
  version: string;
  traits: Record<TraitId, number>;
  aspects: Record<AspectId, number>;
};

export type QualityPack = {
  answered: number;
  total: number;
  completion: number; // 0..1
  std: number;
  maxRun: number;
  avgMsPerItem?: number;
  quality: number; // 0..100
  warnings: string[];
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

export function scoreAssessmentV1(args: {
  version: string;
  answers: AnswerMap;
  durationMs?: number;
}): { scores: ScorePackV1; quality: QualityPack } {
  const { version, answers, durationMs } = args;

  const total = QUESTIONS_V1.length;
  const orderedRaw: number[] = [];

  // Fill missing answers with neutral=3 (still penalize completion).
  let answered = 0;
  for (const q of QUESTIONS_V1) {
    const a = answers[q.id];
    if (a != null) answered += 1;
    orderedRaw.push(a ?? 3);
  }

  const completion = total === 0 ? 0 : answered / total;
  const std = stddev(orderedRaw);

  // Longest run of identical answers (straight-lining).
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < orderedRaw.length; i++) {
    if (orderedRaw[i] === orderedRaw[i - 1]) run += 1;
    else run = 1;
    if (run > maxRun) maxRun = run;
  }

  const avgMsPerItem = durationMs != null && total > 0 ? durationMs / total : undefined;

  const completionScore = clamp01(completion);
  const varianceScore = clamp01(std / 1.2);
  const straightlineScore = clamp01(1 - maxRun / Math.max(1, total));
  const speedScore =
    avgMsPerItem == null
      ? 1
      : avgMsPerItem <= 400
        ? 0
        : avgMsPerItem >= 1200
          ? 1
          : (avgMsPerItem - 400) / (1200 - 400);

  const quality = Math.round(
    100 * (0.35 * completionScore + 0.25 * varianceScore + 0.2 * straightlineScore + 0.2 * speedScore),
  );

  const warnings: string[] = [];
  if (completion < 1) warnings.push("未完成全部题目, 结果可靠性会下降。");
  if (std < 0.55) warnings.push("作答分布过于一致, 可能存在迎合或随意作答。");
  if (maxRun >= Math.ceil(total * 0.55)) warnings.push("连续选择同一选项较多, 建议放慢并按真实状态作答。");
  if (avgMsPerItem != null && avgMsPerItem < 450) warnings.push("作答速度偏快, 建议放慢以提升稳定性。");

  const aspects = {} as Record<AspectId, number>;
  const aspectBuckets = {} as Record<AspectId, number[]>;
  for (const aspectId of Object.keys(ASPECTS_V1) as AspectId[]) {
    aspects[aspectId] = 0;
    aspectBuckets[aspectId] = [];
  }

  for (const q of QUESTIONS_V1) {
    const raw = answers[q.id] ?? 3;
    const keyed = q.reverse ? 6 - raw : raw;
    aspectBuckets[q.aspect].push(keyed);
  }

  for (const aspectId of Object.keys(ASPECTS_V1) as AspectId[]) {
    const avg = mean(aspectBuckets[aspectId]);
    const norm = ((avg - 1) / 4) * 100;
    aspects[aspectId] = Math.round(norm);
  }

  const traits: Record<TraitId, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const traitBuckets: Record<TraitId, number[]> = { O: [], C: [], E: [], A: [], N: [] };

  for (const aspectId of Object.keys(ASPECTS_V1) as AspectId[]) {
    const t = ASPECTS_V1[aspectId].trait;
    traitBuckets[t].push(aspects[aspectId]);
  }

  for (const traitId of Object.keys(traits) as TraitId[]) {
    traits[traitId] = Math.round(mean(traitBuckets[traitId]));
  }

  return {
    scores: { version, traits, aspects },
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
