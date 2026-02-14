import { ASPECTS_V1, type AspectId, type TraitId } from "@/data/questions";
import type { MbtiResult } from "@/lib/mbti";
import type { QualityPack, ScorePackV1 } from "@/lib/scoring";

export type Band = "low" | "mid" | "high";

export function band(score: number): Band {
  if (score <= 40) return "low";
  if (score >= 60) return "high";
  return "mid";
}

function bandZh(b: Band) {
  if (b === "high") return "偏高";
  if (b === "low") return "偏低";
  return "中等";
}

function traitNameZh(id: TraitId) {
  switch (id) {
    case "O":
      return "开放性";
    case "C":
      return "尽责性";
    case "E":
      return "外向性";
    case "A":
      return "宜人性";
    case "N":
      return "神经质(情绪敏感)";
  }
}

function shortTraitRead(id: TraitId, b: Band) {
  if (id === "N") {
    if (b === "high") return "更容易紧张、担心或情绪起伏, 需要更明确的恢复策略。";
    if (b === "low") return "整体更稳, 抗压感更强, 但也可能忽略情绪信号。";
    return "在压力下会波动, 但通常能回到稳定区间。";
  }

  if (id === "E") {
    if (b === "high") return "从互动中获得能量, 更愿意表达与推动。";
    if (b === "low") return "更偏向内在加工, 需要独处恢复, 对高强度社交更敏感。";
    return "在社交与独处之间较平衡, 可按场景切换。";
  }

  if (id === "O") {
    if (b === "high") return "更容易被新观点与新体验驱动, 喜欢探索与重构。";
    if (b === "low") return "更偏务实与熟悉路径, 追求稳定、可预测与可落地。";
    return "既能探索也能落地, 更像“按需开放”。";
  }

  if (id === "A") {
    if (b === "high") return "更看重关系与他人感受, 冲突中更愿意修复。";
    if (b === "low") return "更直截了当, 更看重标准与边界, 但可能显得强硬。";
    return "能在同理与原则之间调节, 看情境做选择。";
  }

  // C
  if (b === "high") return "更容易自律、推进目标, 喜欢把事情收敛到可控结构。";
  if (b === "low") return "更随性灵活, 但可能在长期项目与复利习惯上吃亏。";
  return "推进与弹性兼具, 需要外部结构时也能搭起来。";
}

export type DeepReport = {
  headlineZh: string;
  summaryZh: string;
  traitReads: Array<{
    trait: TraitId;
    score: number;
    band: Band;
    titleZh: string;
    textZh: string;
  }>;
  aspectReads: Array<{
    aspect: AspectId;
    score: number;
    band: Band;
    titleZh: string;
    hintZh: string;
    textZh: string;
  }>;
  sections: Array<{ titleZh: string; bulletsZh: string[] }>;
  notesZh: string[];
};

export function buildDeepReport(args: {
  scores: ScorePackV1;
  mbti: MbtiResult;
  quality: QualityPack;
}): DeepReport {
  const { scores, mbti, quality } = args;

  const traitReads = (Object.keys(scores.traits) as TraitId[]).map((t) => {
    const score = scores.traits[t];
    const b = band(score);
    return {
      trait: t,
      score,
      band: b,
      titleZh: `${traitNameZh(t)} · ${bandZh(b)}`,
      textZh: shortTraitRead(t, b),
    };
  });

  const aspectReads = (Object.keys(scores.aspects) as AspectId[]).map((a) => {
    const score = scores.aspects[a];
    const b = band(score);
    const meta = ASPECTS_V1[a];
    return {
      aspect: a,
      score,
      band: b,
      titleZh: `${meta.nameZh} · ${bandZh(b)}`,
      hintZh: meta.hintZh,
      textZh:
        b === "high"
          ? "这块更像你的稳定优势区, 你会自然地用它解决问题。"
          : b === "low"
            ? "这块更像你的低频能力区, 需要外部结构或明确动机才会动用。"
            : "这块更像你的可调节区, 你会随情境在两端之间移动。",
    };
  });

  const E = scores.traits.E;
  const A = scores.traits.A;
  const C = scores.traits.C;
  const O = scores.traits.O;
  const N = scores.traits.N;

  const sections: DeepReport["sections"] = [
    {
      titleZh: "沟通与协作",
      bulletsZh: [
        E >= 60 ? "你更适合用“说出来”推进协作, 会议里主动对齐会更顺。" : "你更适合先在脑内成稿, 再用简短结论输出, 避免被即时讨论耗尽。",
        A >= 60 ? "先确认对方感受再谈方案, 你的说服力会更强。" : "把标准与边界写清楚, 你会更舒服也更高效。",
        C >= 60 ? "你可以自然承担流程与节奏, 但注意别把所有人都拉进你的标准。" : "给自己一个最低可行的流程, 避免靠意志力硬扛。",
      ],
    },
    {
      titleZh: "压力与恢复",
      bulletsZh: [
        N >= 60 ? "压力下更容易内耗, 建议把担忧外化: 写下来、拆成可执行步骤。" : "你相对稳, 但也要定期做情绪盘点, 防止“麻木式扛住”。",
        E >= 60 ? "恢复方式更偏向高质量互动或运动式排解。" : "恢复方式更偏向独处、散步、低刺激环境。",
        C >= 60 ? "当计划被打乱时可能更焦躁, 预留缓冲区会显著改善体验。" : "当任务堆积时可能更焦虑, 把任务切成 15 分钟块更有效。",
      ],
    },
    {
      titleZh: "成长策略（可落地）",
      bulletsZh: [
        O >= 60 ? "把探索变成产出: 每周固定一个“输出槽位”来固化洞见。" : "把改变变得可预测: 先从一个小习惯开始, 让新东西变熟悉。",
        A < 45 ? "练习“温和但坚定”: 先表达立场, 再给对方台阶, 关系成本会下降。" : "练习“清晰但不替人负责”: 同理同时保留边界, 避免过度消耗。",
        "把最不确定的那一维当作“可变参数”: 当你感觉像两种类型时, 优先看该维度的场景触发。",
      ],
    },
  ];

  const notesZh: string[] = [];
  if (quality.warnings.length > 0) notesZh.push(...quality.warnings);
  notesZh.push("后缀 -A/-T 基于神经质(情绪敏感)推导, 不属于经典 MBTI。");
  notesZh.push("类型清晰度（高阶/中阶/边界）由四个维度中最不确定的一维决定。");

  const headlineZh = `你的类型是 ${mbti.type}`;
  const summaryZh =
    "这份结果不是“盖章”, 而是你在连续维度上的一个投影。建议把它当作语言工具: 用来更快描述偏好、预测冲突点、以及选择更适配的恢复方式。";

  return { headlineZh, summaryZh, traitReads, aspectReads, sections, notesZh };
}

