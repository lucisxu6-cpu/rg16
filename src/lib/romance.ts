import type { FunctionId } from "@/data/jung";
import { GRANT_STACKS, type GrantStack, type JungTypeId } from "@/lib/jungType";

type MatchItem = {
  type: JungTypeId;
  score: number;
  reasonZh: string;
  sweetActionZh: string;
};

type FrictionItem = {
  type: JungTypeId;
  score: number;
  triggerZh: string;
  repairZh: string;
};

export type RomanticProfile = {
  secureMatches: MatchItem[];
  sparkMatches: MatchItem[];
  frictionMatches: FrictionItem[];
  emotionalNeedsZh: string[];
  shareLineZh: string;
  modelNotesZh: string[];
};

const OPPOSITE_FUNC: Record<FunctionId, FunctionId> = {
  Se: "Si",
  Si: "Se",
  Ne: "Ni",
  Ni: "Ne",
  Te: "Ti",
  Ti: "Te",
  Fe: "Fi",
  Fi: "Fe",
};

const EMOTIONAL_NEEDS: Record<FunctionId, string[]> = {
  Se: [
    "你会被“有现场感、愿意一起行动”的人吸引。",
    "在关系里你需要真实反馈与共同体验，空泛承诺对你无效。",
  ],
  Si: [
    "你更看重稳定与可预期，连续的可靠感会让你快速投入。",
    "你希望被认真记住细节，被尊重长期节奏而不是被催促。",
  ],
  Ne: [
    "你会被“能一起脑暴、一起想象未来”的人点燃。",
    "你需要关系里有新鲜感与可能性，不喜欢一成不变的互动。",
  ],
  Ni: [
    "你会被“能读懂你深层动机”的人吸引，而非只看表面表现。",
    "你需要关系里有长期方向感，最好能共同构建未来叙事。",
  ],
  Te: [
    "你会被“做事有担当、能落地”的人吸引。",
    "你需要关系里的目标一致与边界清晰，模糊拉扯会消耗你。",
  ],
  Ti: [
    "你会被“讲得通、逻辑干净”的人吸引。",
    "你需要关系里有理性沟通空间，情绪爆发式对抗会让你抽离。",
  ],
  Fe: [
    "你会被“会回应情绪、懂关系温度”的人吸引。",
    "你需要关系里的被在意感与互动仪式感，冷处理会让你不安。",
  ],
  Fi: [
    "你会被“真诚、有价值一致感”的人吸引。",
    "你需要关系里有尊重与边界，不被强行改造是核心安全感。",
  ],
};

function top2By<T extends { score: number }>(items: T[]) {
  return [...items].sort((a, b) => b.score - a.score).slice(0, 2);
}

function secureScore(me: GrantStack, other: GrantStack) {
  let s = 0;
  if (other.dom === me.aux) s += 2.8;
  if (other.aux === me.dom) s += 2.6;
  if (other.dom === me.dom) s += 1.1;
  if (other.aux === me.aux) s += 1.1;
  if (other.dom === me.inf || other.aux === me.inf) s += 0.9;
  if ([other.dom, other.aux].includes(OPPOSITE_FUNC[me.dom])) s -= 0.6;
  return s;
}

function sparkScore(me: GrantStack, other: GrantStack) {
  let s = 0;
  if (other.dom === me.inf) s += 3.2;
  if (other.aux === me.inf) s += 1.4;
  if (other.dom === OPPOSITE_FUNC[me.dom]) s += 1.6;
  if (other.aux === OPPOSITE_FUNC[me.aux]) s += 1.2;
  if (other.dom === me.dom && other.aux === me.aux) s -= 1;
  return s;
}

function frictionScore(me: GrantStack, other: GrantStack) {
  let s = 0;
  if (other.dom === OPPOSITE_FUNC[me.dom]) s += 2.6;
  if (other.aux === OPPOSITE_FUNC[me.aux]) s += 2.2;
  if (other.dom === OPPOSITE_FUNC[me.aux]) s += 1.2;
  if (other.aux === OPPOSITE_FUNC[me.dom]) s += 1.1;
  if (![other.dom, other.aux].includes(me.dom) && ![other.dom, other.aux].includes(me.aux)) s += 0.8;
  if (other.dom === me.inf) s += 1.2;
  return s;
}

function secureReason(me: GrantStack, other: GrantStack) {
  if (other.dom === me.aux || other.aux === me.dom) {
    return `你常用的 ${me.dom}/${me.aux}，对方的主辅功能能接住，互动更容易形成“被理解感”。`;
  }
  if (other.dom === me.inf || other.aux === me.inf) {
    return `对方更容易温和激活你的低频功能 ${me.inf}，让你在关系里有成长感。`;
  }
  return `你们在决策与表达节奏上更容易达成一致，冲突升级概率相对更低。`;
}

function sparkReason(me: GrantStack, other: GrantStack) {
  if (other.dom === me.inf) {
    return `对方主导 ${other.dom} 正好击中你低频侧 ${me.inf}，会出现“上头但很难忽视”的张力。`;
  }
  return `你们在信息处理路径上差异明显，容易产生强烈新鲜感与心动反差。`;
}

function sweetAction(me: GrantStack) {
  return `约会沟通先说感受再说结论（先 ${me.aux} 再 ${me.dom}），更容易拉高亲密感。`;
}

function frictionTrigger(me: GrantStack, other: GrantStack) {
  return `你偏 ${me.dom}/${me.aux}，对方偏 ${other.dom}/${other.aux}，在压力下容易出现“动机归因偏差”（把风格差异误读成人格问题）。`;
}

function frictionRepair(me: GrantStack, other: GrantStack) {
  return `冲突时先用 1 句共情确认（${other.aux} 友好表达），再给 1 条可执行边界（${me.aux} 风格），能显著降温。`;
}

export function buildRomanticProfile(args: { type: JungTypeId; stack: GrantStack }): RomanticProfile {
  const me = args.stack;
  const allTypes = Object.keys(GRANT_STACKS) as JungTypeId[];
  const candidates = allTypes.filter((t) => t !== args.type).map((t) => {
    const stack = GRANT_STACKS[t];
    return {
      type: t,
      stack,
      secure: secureScore(me, stack),
      spark: sparkScore(me, stack),
      friction: frictionScore(me, stack),
    };
  });

  const secureMatches = top2By(
    candidates.map((c) => ({
      type: c.type,
      score: Number(c.secure.toFixed(2)),
      reasonZh: secureReason(me, c.stack),
      sweetActionZh: sweetAction(me),
    })),
  );

  const secureSet = new Set(secureMatches.map((x) => x.type));

  const sparkMatches = top2By(
    candidates
      .filter((c) => !secureSet.has(c.type))
      .map((c) => ({
        type: c.type,
        score: Number(c.spark.toFixed(2)),
        reasonZh: sparkReason(me, c.stack),
        sweetActionZh: "先制造共同体验，再谈价值观与边界，情感推进会更顺。",
      })),
  );

  const frictionMatches = top2By(
    candidates.map((c) => ({
      type: c.type,
      score: Number(c.friction.toFixed(2)),
      triggerZh: frictionTrigger(me, c.stack),
      repairZh: frictionRepair(me, c.stack),
    })),
  );

  const emotionalNeedsZh = EMOTIONAL_NEEDS[me.dom];

  const shareLineZh = `我的类型是 ${args.type}，恋爱高稳定官配更偏 ${secureMatches
    .map((x) => x.type)
    .join(" / ")}，高张力心动更偏 ${sparkMatches.map((x) => x.type).join(" / ")}。`;

  const modelNotesZh = [
    "匹配结论基于社会心理学中的“相似吸引 + 互补增益 + 冲突修复成本”三因素模型。",
    "它回答的是“更容易相处/更容易拉扯”的概率，不是决定论；具体关系仍取决于成熟度与沟通习惯。",
  ];

  return {
    secureMatches,
    sparkMatches,
    frictionMatches,
    emotionalNeedsZh,
    shareLineZh,
    modelNotesZh,
  };
}
