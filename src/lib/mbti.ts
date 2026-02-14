import type { ScorePackV1 } from "@/lib/scoring";

export type MbtiDimId = "EI" | "NS" | "FT" | "JP";

export type MbtiDimension = {
  id: MbtiDimId;
  left: "I" | "S" | "T" | "P";
  right: "E" | "N" | "F" | "J";
  score: number; // underlying trait score 0..100
  pRight: number; // 0..1
  confidence: number; // 0..1
};

export type MbtiLevel = "高阶" | "中阶" | "边界";

export type MbtiSuffix = {
  tag: "A" | "T";
  pT: number;
  confidence: number;
  basis: "Neuroticism";
};

export type MbtiResult = {
  type: string; // e.g. INFJ
  dimensions: MbtiDimension[];
  confidence: number; // overall 0..1
  level: MbtiLevel;
  suffix: MbtiSuffix;
};

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function dimFromScore(args: {
  id: MbtiDimId;
  left: MbtiDimension["left"];
  right: MbtiDimension["right"];
  score: number;
  scale?: number;
}): MbtiDimension {
  const scale = args.scale ?? 8;
  const pRight = sigmoid((args.score - 50) / scale);
  const confidence = clamp01(Math.abs(pRight - 0.5) * 2);
  return {
    id: args.id,
    left: args.left,
    right: args.right,
    score: args.score,
    pRight,
    confidence,
  };
}

export function computeMbtiFromScoresV1(scores: ScorePackV1): MbtiResult {
  const E = scores.traits.E;
  const O = scores.traits.O;
  const A = scores.traits.A;
  const C = scores.traits.C;
  const N = scores.traits.N;

  const dims: MbtiDimension[] = [
    dimFromScore({ id: "EI", left: "I", right: "E", score: E, scale: 8 }),
    dimFromScore({ id: "NS", left: "S", right: "N", score: O, scale: 8 }),
    dimFromScore({ id: "FT", left: "T", right: "F", score: A, scale: 8 }),
    dimFromScore({ id: "JP", left: "P", right: "J", score: C, scale: 8 }),
  ];

  const letters = dims.map((d) => (d.pRight >= 0.5 ? d.right : d.left)).join("");
  const overallConfidence = Math.min(...dims.map((d) => d.confidence));

  const level: MbtiLevel = overallConfidence >= 0.75 ? "高阶" : overallConfidence >= 0.6 ? "中阶" : "边界";

  const pT = sigmoid((N - 50) / 10);
  const suffixTag: MbtiSuffix["tag"] = pT > 0.5 ? "T" : "A";
  const suffixConfidence = clamp01(Math.abs(pT - 0.5) * 2);

  return {
    type: letters,
    dimensions: dims,
    confidence: Number(overallConfidence.toFixed(3)),
    level,
    suffix: {
      tag: suffixTag,
      pT: Number(pT.toFixed(3)),
      confidence: Number(suffixConfidence.toFixed(3)),
      basis: "Neuroticism",
    },
  };
}

