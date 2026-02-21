import type { FunctionId } from "@/data/jung";

export type JungTypeId =
  | "ISTJ"
  | "ISFJ"
  | "INFJ"
  | "INTJ"
  | "ISTP"
  | "ISFP"
  | "INFP"
  | "INTP"
  | "ESTP"
  | "ESFP"
  | "ENFP"
  | "ENTP"
  | "ESTJ"
  | "ESFJ"
  | "ENFJ"
  | "ENTJ";

export type GrantStack = {
  dom: FunctionId;
  aux: FunctionId;
  ter: FunctionId;
  inf: FunctionId;
};

export type JungLevel = "高阶" | "中阶" | "低阶";

export type JungTypeMatch = {
  type: JungTypeId;
  score: number; // 0..100 (normalized)
  stack: GrantStack;
};

export type JungTypeResultV2 = {
  version: "v2";
  type: JungTypeId;
  stack: GrantStack;
  confidence: number; // 0..1
  level: JungLevel;
  top3: JungTypeMatch[];
  debug: {
    gap: number; // best - second (0..100)
    pairClarity: number; // 0..1
  };
};

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export const GRANT_STACKS: Readonly<Record<JungTypeId, GrantStack>> = {
  ISTJ: { dom: "Si", aux: "Te", ter: "Fi", inf: "Ne" },
  ISFJ: { dom: "Si", aux: "Fe", ter: "Ti", inf: "Ne" },
  INFJ: { dom: "Ni", aux: "Fe", ter: "Ti", inf: "Se" },
  INTJ: { dom: "Ni", aux: "Te", ter: "Fi", inf: "Se" },

  ISTP: { dom: "Ti", aux: "Se", ter: "Ni", inf: "Fe" },
  ISFP: { dom: "Fi", aux: "Se", ter: "Ni", inf: "Te" },
  INFP: { dom: "Fi", aux: "Ne", ter: "Si", inf: "Te" },
  INTP: { dom: "Ti", aux: "Ne", ter: "Si", inf: "Fe" },

  ESTP: { dom: "Se", aux: "Ti", ter: "Fe", inf: "Ni" },
  ESFP: { dom: "Se", aux: "Fi", ter: "Te", inf: "Ni" },
  ENFP: { dom: "Ne", aux: "Fi", ter: "Te", inf: "Si" },
  ENTP: { dom: "Ne", aux: "Ti", ter: "Fe", inf: "Si" },

  ESTJ: { dom: "Te", aux: "Si", ter: "Ne", inf: "Fi" },
  ESFJ: { dom: "Fe", aux: "Si", ter: "Ne", inf: "Ti" },
  ENFJ: { dom: "Fe", aux: "Ni", ter: "Se", inf: "Ti" },
  ENTJ: { dom: "Te", aux: "Ni", ter: "Se", inf: "Fi" },
};

function matchScoreNormalized(args: { f: Record<FunctionId, number>; stack: GrantStack }) {
  const wDom = 0.38;
  const wAux = 0.3;
  const wTer = 0.2;
  const wInf = 0.12;
  return (
    wDom * args.f[args.stack.dom] +
    wAux * args.f[args.stack.aux] +
    wTer * args.f[args.stack.ter] +
    wInf * args.f[args.stack.inf]
  );
}

function pairClarity01(f: Record<FunctionId, number>) {
  const d1 = Math.abs(f.Se - f.Si) / 100;
  const d2 = Math.abs(f.Ne - f.Ni) / 100;
  const d3 = Math.abs(f.Te - f.Ti) / 100;
  const d4 = Math.abs(f.Fe - f.Fi) / 100;
  return Math.min(d1, d2, d3, d4);
}

export function inferJungTypeV2(functionScores: Record<FunctionId, number>): JungTypeResultV2 {
  const matches: JungTypeMatch[] = (Object.keys(GRANT_STACKS) as JungTypeId[]).map((t) => {
    const stack = GRANT_STACKS[t];
    const score = matchScoreNormalized({ f: functionScores, stack });
    return { type: t, score: Number(score.toFixed(2)), stack };
  });

  matches.sort((a, b) => b.score - a.score);
  const best = matches[0];
  const second = matches[1] ?? matches[0];

  const gap = Math.max(0, best.score - second.score);
  const gapConf = clamp01(gap / 18);
  const pc = pairClarity01(functionScores);

  const confidence = clamp01(0.65 * gapConf + 0.35 * pc);
  const level: JungLevel = confidence >= 0.75 ? "高阶" : confidence >= 0.6 ? "中阶" : "低阶";

  return {
    version: "v2",
    type: best.type,
    stack: best.stack,
    confidence: Number(confidence.toFixed(3)),
    level,
    top3: matches.slice(0, 3),
    debug: {
      gap: Number(gap.toFixed(2)),
      pairClarity: Number(pc.toFixed(3)),
    },
  };
}
