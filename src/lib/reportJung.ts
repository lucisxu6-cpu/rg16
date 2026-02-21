import {
  JUNG_FUNCTIONS_META,
  JUNG_QUESTIONS_V2,
  type FunctionId,
  type JungQuestion,
  type Likert,
  LIKERT_SCALE_ZH,
} from "@/data/jung";
import type { JungScorePackV2 } from "@/lib/jungScoring";
import type { JungTypeResultV2 } from "@/lib/jungType";
import type { QualityPack } from "@/lib/scoring";

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

type EvidenceItem = {
  func: FunctionId;
  questionId: string;
  questionType: JungQuestion["type"];
  prompt: string;
  chosen: {
    id: string;
    title: string;
    desc: string;
  };
};

export type FunctionSection = {
  func: FunctionId;
  nameZh: string;
  score: number;
  band: Band;
  taglineZh: string;
  titleZh: string;
  realityZh: string[];
  blindSpotZh: string[];
  evidence: EvidenceItem[];
};

export type JungDeepReport = {
  headlineZh: string;
  summaryZh: string;
  stackLineZh: string;
  domAuxLineZh: string;
  levelZh: "高阶" | "中阶" | "低阶";
  levelCard: {
    currentZh: string;
    targetZh: string;
    diagnosisZh: string[];
    upgradePlanZh: string[];
  };
  strengthsZh: string[];
  risksZh: string[];
  functions: FunctionSection[];
  notesZh: string[];
};

function pickAnswerStr(answers: Record<string, unknown> | null | undefined, id: string) {
  const v = answers?.[id];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function parseLikert(v: string | null): Likert | null {
  if (!v) return null;
  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= 5) return n as Likert;
  return null;
}

function scaleLabel(v: Likert) {
  return LIKERT_SCALE_ZH.find((x) => x.v === v)?.top ?? `${v}`;
}

function functionTemplates(func: FunctionId, b: Band) {
  // Keep it concrete. Each array item should read like a "real life mapping".
  switch (func) {
    case "Se":
      return b === "high"
        ? {
            reality: [
              "你更相信当下可见的信息: 先看现场, 先动手, 先拿到反馈。",
              "你在变化里反而更清醒: 临场反应快, 容易抓住机会窗口。",
              "你更不喜欢“空想讨论”: 没有可验证动作时, 会觉得浪费时间。",
            ],
            blind: [
              "容易被当下刺激带节奏: 追求即时有效, 可能忽略长期代价。",
              "当环境噪音很大时, 可能更难听到自己内心真正想要什么。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太依赖“现场感”: 更倾向先想清楚或先看结构, 再出手。",
                "你对临时变动更敏感: 更喜欢可预期的节奏与准备。",
                "你更擅长在脑内完成一轮推演后再行动。",
              ],
              blind: [
                "可能错过“先试一下就知道”的机会, 把可验证问题拖成想象问题。",
                "当需要快速响应时, 容易觉得被推着走而烦躁。",
              ],
            }
          : {
              reality: [
                "你能在准备与行动之间切换: 该动手时能动手, 该观察时也能观察。",
                "你更看重“可验证”: 会用现实反馈校准自己的判断。",
                "你不太喜欢纯粹的空谈, 但也不会盲冲。",
              ],
              blind: ["当压力很大时, 可能会短暂走向“要么拖延, 要么冲动”的两极。"],
            };
    case "Si":
      return b === "high"
        ? {
            reality: [
              "你更信“被验证过的可靠”: 经验、流程、稳定节奏会让你更安心。",
              "你对细节和惯性更敏感: 很容易察觉哪里“跟以前不一样”。",
              "你擅长把事情做稳: 复盘、沉淀、复用, 形成可持续系统。",
            ],
            blind: [
              "面对全新玩法时, 可能更慢进入状态, 需要看到可靠证据才愿意冒险。",
              "可能把“过去有效”当成“未来也有效”, 对拐点反应偏慢。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太愿意被过去绑定: 更愿意每次都重来, 或直接换一种方式。",
                "你对稳定流程的耐受度较低: 重复与规训可能让你烦躁。",
                "你更依赖当下或未来的信号, 而不是历史经验。",
              ],
              blind: [
                "可能低估了“基础设施”的价值: 稳定节奏、复盘沉淀会决定长期复利。",
                "容易把可避免的坑当成“必须亲自踩过一次”。",
              ],
            }
          : {
              reality: [
                "你会在需要时回到经验与流程, 但不至于被它绑死。",
                "你能复用过去, 也能在必要时更新做法。",
              ],
              blind: ["当环境变化很快时, 你可能在“稳住”与“更新”之间纠结。"],
            };
    case "Ne":
      return b === "high"
        ? {
            reality: [
              "你看到的不是一条路, 而是一片路网: 很自然就能列出多个可能方案。",
              "你擅长连接: 把两个不相关的点拼在一起, 产生新玩法/新洞见。",
              "你在开放讨论里会变强: 头脑风暴会让你更清醒。",
            ],
            blind: [
              "容易“太多可能性”: 如果没有收敛机制, 会陷入反复更换方向。",
              "可能低估执行成本, 觉得“先试试”就能解决一切。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太喜欢发散: 更倾向尽快定一个方向, 往深处走。",
                "你更在意一致性与主线, 对开放式讨论耐心较低。",
                "你更擅长“把一件事做透”, 而不是“同时开很多坑”。",
              ],
              blind: [
                "可能错过替代路径: 当主线走不通时, 需要刻意练习“多准备几条路”。",
              ],
            }
          : {
              reality: ["你能发散也能收敛: 既能提出备选, 也能在需要时定方向。"],
              blind: ["当不确定性很大时, 你可能会在“发散够不够”上反复摇摆。"],
            };
    case "Ni":
      return b === "high"
        ? {
            reality: [
              "你更关注“这事最终指向什么”: 会自动提炼主旨与趋势, 形成一个内在判断。",
              "你擅长收敛: 信息再杂, 你也会逼近一个最关键的变量与主线。",
              "你会出现“突然懂了”的时刻: 很像在脑内把碎片拼成图。",
            ],
            blind: [
              "容易过早收敛: 还没收集够证据就认定结论, 可能错失现实反馈。",
              "当别人要你解释过程时, 你可能觉得“我也说不清, 但我知道”。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太依赖洞察式收敛: 更相信一步一步试出来或把信息摊开讨论。",
                "你更偏好可见证据与可复现流程, 而不是“感觉未来会怎样”。",
              ],
              blind: [
                "可能低估了“趋势与方向”的重要性: 很努力, 但方向成本更大。",
              ],
            }
          : {
              reality: ["你能在需要时提炼主线, 但也会保留一定开放度。"],
              blind: ["当压力大时, 你可能会突然变得很执拗, 只认一个解释。"],
            };
    case "Te":
      return b === "high"
        ? {
            reality: [
              "你看问题首先看“怎么做成”: 目标、指标、路径、资源、节奏。",
              "你擅长把混乱变成可执行: 定义责任、拆任务、设节点。",
              "你更愿意用结果说话: 做出来比说服更重要。",
            ],
            blind: [
              "可能显得强势或“只看结果”: 忽略人的心理成本与长期信任。",
              "当模型不完善时, 容易用流程压住不确定性, 反而减少探索。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太被外部效率标准驱动: 更在意逻辑、价值或关系本身。",
                "你对流程化/指标化可能敏感: 觉得它压缩了真实与复杂性。",
              ],
              blind: [
                "可能在长期交付上吃亏: 没有节奏与节点, 容易被拖到最后。",
              ],
            }
          : {
              reality: ["你能在需要时用目标与结构推进, 也能保留空间给思考与人。"],
              blind: ["当环境极度不确定时, 你可能会在“要不要立刻结构化”上犹豫。"],
            };
    case "Ti":
      return b === "high"
        ? {
            reality: [
              "你更在意“讲得通”: 定义、边界、推理链条必须干净。",
              "你倾向先搭一个内部模型: 让所有细节能在同一套逻辑里解释。",
              "你不太吃“权威压你”: 你更信逻辑本身。",
            ],
            blind: [
              "可能卡在精确: 觉得没讲清楚就不行动, 影响节奏。",
              "别人情绪上头时, 你可能先去纠错, 对方会感觉你“不接情绪”。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太执着于概念精确: 更在意能否推进、是否符合价值或关系是否顺。",
                "你会更快进入行动或对齐, 而不是反复推理。",
              ],
              blind: [
                "可能在复杂系统里踩“逻辑坑”: 定义不清会让后面返工更大。",
              ],
            }
          : {
              reality: ["你能在需要时做逻辑清洁, 但不会无限上头。"],
              blind: ["当争议很大时, 你可能会被迫在“精确”与“推进”之间选边。"],
            };
    case "Fe":
      return b === "high"
        ? {
            reality: [
              "你很在意“场”是否顺: 氛围、情绪、关系成本会直接影响你的判断。",
              "你擅长对齐人心: 让不同立场的人愿意继续合作。",
              "你会自然调整表达: 让对方更容易接住你的信息。",
            ],
            blind: [
              "可能过度照顾: 把自己的需求往后放, 直到突然爆发或耗尽。",
              "可能为了维持和谐而拖延冲突, 让问题积累。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太被氛围驱动: 更直说结论, 觉得把事讲清楚更重要。",
                "你对“场面管理”耐心较低, 更愿意把关系成本显性化。",
              ],
              blind: [
                "可能无意中让人受伤: 你讲的是事实, 对方听到的是评价。",
              ],
            }
          : {
              reality: ["你能兼顾关系与事实: 重要时会照顾对方, 也能保持清晰。"],
              blind: ["当你疲惫时, 可能突然变得不想社交, 让别人误解为冷淡。"],
            };
    case "Fi":
      return b === "high"
        ? {
            reality: [
              "你做判断会先对齐内在价值: 真实、意义、边界对你很重要。",
              "你不太容易被外界同化: 哪怕没人理解, 你也会坚持“对我来说重要”。",
              "你对“违心”很敏感: 一旦违背价值, 你会迅速失去动力。",
            ],
            blind: [
              "可能显得难以协商: 当你认定价值冲突时, 会很难妥协。",
              "别人需要你解释时, 你可能只想说“就是不舒服”。",
            ],
          }
        : b === "low"
          ? {
              reality: [
                "你不太以个人价值为先: 更愿意考虑外部标准或关系协作。",
                "你可能更擅长做“对全局有利”的选择, 而不是“对我舒服”的选择。",
              ],
              blind: [
                "可能忽略自己的真实: 长期压下感受会导致耗竭或突然断联。",
              ],
            }
          : {
              reality: ["你能在价值与协作之间调节: 该坚持时坚持, 该配合时配合。"],
              blind: ["当冲突持续时, 你可能会突然进入“我到底想要什么”的反思期。"],
            };
  }
}

function makeEvidence(args: {
  answers: Record<string, unknown> | null | undefined;
}): Record<FunctionId, EvidenceItem[]> {
  const out = {
    Se: [],
    Si: [],
    Ne: [],
    Ni: [],
    Te: [],
    Ti: [],
    Fe: [],
    Fi: [],
  } as Record<FunctionId, EvidenceItem[]>;

  for (const q of JUNG_QUESTIONS_V2) {
    if (q.type === "likert") continue;
    const a = pickAnswerStr(args.answers, q.id);
    if (!a) continue;
    const chosen = q.options.find((o) => o.id === a);
    if (!chosen) continue;
    out[chosen.func].push({
      func: chosen.func,
      questionId: q.id,
      questionType: q.type,
      prompt: q.prompt,
      chosen: { id: chosen.id, title: chosen.title, desc: chosen.desc },
    });
  }

  // Backfill with strong likert endorsements if some functions have no evidence.
  for (const q of JUNG_QUESTIONS_V2) {
    if (q.type !== "likert") continue;
    const a = pickAnswerStr(args.answers, q.id);
    const lv = parseLikert(a);
    if (!lv) continue;
    const endorsed = q.reverse ? 6 - lv : lv;
    if (endorsed < 5) continue;
    out[q.func].push({
      func: q.func,
      questionId: q.id,
      questionType: "likert",
      prompt: q.prompt,
      chosen: { id: String(lv), title: scaleLabel(lv), desc: "（李克特校准题）" },
    });
  }

  return out;
}

function funcLabelZh(func: FunctionId) {
  const m = JUNG_FUNCTIONS_META[func];
  return `${func}（${m.nameZh}）`;
}

function stackLine(stack: JungTypeResultV2["stack"]) {
  return `${stack.dom} → ${stack.aux} → ${stack.ter} → ${stack.inf}`;
}

function normalizeLevelZh(level: unknown): "高阶" | "中阶" | "低阶" {
  if (level === "高阶" || level === "中阶" || level === "低阶") return level;
  if (level === "边界") return "低阶";
  return "低阶";
}

function weakestPair(functions: Record<FunctionId, number>) {
  const pairs: Array<[FunctionId, FunctionId]> = [
    ["Se", "Si"],
    ["Ne", "Ni"],
    ["Te", "Ti"],
    ["Fe", "Fi"],
  ];

  let best = { a: pairs[0][0], b: pairs[0][1], diff: Math.abs(functions[pairs[0][0]] - functions[pairs[0][1]]) };
  for (const [a, b] of pairs.slice(1)) {
    const diff = Math.abs(functions[a] - functions[b]);
    if (diff < best.diff) best = { a, b, diff };
  }
  return best;
}

function buildLevelCard(args: {
  level: "高阶" | "中阶" | "低阶";
  scores: Record<FunctionId, number>;
  quality: QualityPack;
  typeResult: JungTypeResultV2;
}): JungDeepReport["levelCard"] {
  const { level, scores, quality, typeResult } = args;
  const weakPair = weakestPair(scores);
  const diagnosisZh: string[] = [
    `当前层级: ${level}（置信度 ${Math.round(typeResult.confidence * 100)}%，类型差值 gap ${typeResult.debug.gap}，对偶清晰度 ${Math.round(typeResult.debug.pairClarity * 100)}%）。`,
    `最难区分的一组是 ${weakPair.a}/${weakPair.b}（差值 ${weakPair.diff} 分），这是层级提升时最需要关注的分辨点。`,
    `本次作答质量 ${quality.quality}/100${quality.warnings.length > 0 ? `，注意: ${quality.warnings[0]}` : "，结果稳定性较好。"
    }`,
  ];

  if (level === "低阶") {
    return {
      currentZh: "低阶（起步阶段）",
      targetZh: "目标: 从低阶提升到中阶（先提高稳定性与功能分辨度）",
      diagnosisZh,
      upgradePlanZh: [
        `做“决策日志”14 天: 每天记录 1 个关键决策, 标注你更像在用哪条功能路径（如 ${typeResult.stack.dom}/${typeResult.stack.aux}）。`,
        `针对 ${weakPair.a}/${weakPair.b} 做 A/B 训练: 同一问题分别写两种解法, 对比哪种更自然且结果更好。`,
        "两周后复测一次, 保持同样作答环境（时间、状态、节奏）以减少噪音对层级的干扰。",
      ],
    };
  }

  if (level === "中阶") {
    return {
      currentZh: "中阶（可塑阶段）",
      targetZh: "目标: 从中阶提升到高阶（加强跨场景一致性）",
      diagnosisZh,
      upgradePlanZh: [
        `每周至少 2 次刻意调用第三功能 ${typeResult.stack.ter}: 在熟悉任务里练“非惯性做法”，提升适配宽度。`,
        `为劣势功能 ${typeResult.stack.inf} 设压力预案: 当你出现冲动/僵住时，先执行固定的 3 步降噪流程。`,
        `按“工作/关系/独处”三个场景做月度复盘，确认同一功能栈是否稳定出现，而不是只在单一场景成立。`,
      ],
    };
  }

  return {
    currentZh: "高阶（稳定阶段）",
    targetZh: "目标: 维持高阶并扩展可迁移性（避免高分低适应）",
    diagnosisZh,
    upgradePlanZh: [
      `保持主辅优势的同时，持续补位低频功能，尤其是 ${typeResult.stack.inf} 在压力场景下的稳定表达。`,
      `针对最弱分辨对偶 ${weakPair.a}/${weakPair.b} 继续训练，以防在复杂场景中“回落到单一路径”。`,
      "把你的高阶策略沉淀为可执行模板（复盘表、沟通脚本、决策清单），提高可复制性。",
    ],
  };
}

export function buildJungDeepReport(args: {
  scores: JungScorePackV2;
  typeResult: JungTypeResultV2;
  quality: QualityPack;
  answers: Record<string, unknown> | null | undefined;
}): JungDeepReport {
  const { scores, typeResult, quality } = args;

  const f = scores.functions;
  const dom = typeResult.stack.dom;
  const aux = typeResult.stack.aux;
  const inf = typeResult.stack.inf;
  const levelZh = normalizeLevelZh(typeResult.level as unknown);
  const levelCard = buildLevelCard({
    level: levelZh,
    scores: f,
    quality,
    typeResult,
  });

  const evidence = makeEvidence({ answers: args.answers });

  const functionIds = Object.keys(JUNG_FUNCTIONS_META) as FunctionId[];
  const sortedByScore = [...functionIds].sort((a, b) => f[b] - f[a]);
  const top2 = sortedByScore.slice(0, 2);
  const bottom2 = sortedByScore.slice(-2);

  const strengthsZh: string[] = [
    `你的优势更集中在: ${top2.map((x) => funcLabelZh(x)).join(" + ")}。`,
    `你的主导/辅助栈为: ${stackLine(typeResult.stack)}（Grant 经典栈）。`,
    `你更自然的“看世界/做判断”路径大概率是: ${funcLabelZh(dom)} + ${funcLabelZh(aux)}。`,
  ];

  const risksZh: string[] = [
    `相对低频的区域更可能在: ${bottom2.map((x) => funcLabelZh(x)).join("、")}。`,
    `当压力很大时, 你更可能以 ${funcLabelZh(inf)} 的方式“失控式补偿”（例如冲动/逃避/过度刺激或过度规训）。`,
  ];

  const sections: FunctionSection[] = functionIds
    .map((func) => {
      const score = f[func];
      const b = band(score);
      const meta = JUNG_FUNCTIONS_META[func];
      const t = functionTemplates(func, b);
      const isDomOrAux = func === dom || func === aux;
      const ev = evidence[func].slice(0, isDomOrAux ? 3 : 2);
      return {
        func,
        nameZh: meta.nameZh,
        score,
        band: b,
        taglineZh: meta.taglineZh,
        titleZh: `${funcLabelZh(func)} · ${bandZh(b)}（${score}/100）`,
        realityZh: t.reality,
        blindSpotZh: t.blind,
        evidence: ev,
      };
    })
    .sort((a, b) => b.score - a.score);

  const notesZh: string[] = [];
  if (quality.warnings.length > 0) notesZh.push(...quality.warnings);
  notesZh.push("说明: 这里的“功能”描述的是偏好路径, 不等同于能力高低。");
  notesZh.push("说明: 功能栈为 Grant 经典模型的推断, 结果会受作答状态与题目覆盖影响。");
  notesZh.push("层级说明: 低阶/中阶/高阶反映的是当前结果的稳定度与跨场景一致性, 不是“人格高低”。");
  notesZh.push("建议: 把结果当作语言工具, 用来解释冲突点与恢复方式, 而不是给自己贴死标签。");

  return {
    headlineZh: `你的类型是 ${typeResult.type}`,
    summaryZh:
      "我们先测量荣格八维（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）的使用偏好, 再用功能栈匹配推断类型。深度报告会把每个功能落到现实场景, 并展示你在关键题上的选择作为依据。",
    stackLineZh: `功能栈: ${stackLine(typeResult.stack)}`,
    domAuxLineZh: `主导/辅助: ${funcLabelZh(dom)} + ${funcLabelZh(aux)}（置信度 ${Math.round(typeResult.confidence * 100)}% / ${levelZh}）`,
    levelZh,
    levelCard,
    strengthsZh,
    risksZh,
    functions: sections,
    notesZh,
  };
}
