export type Likert = 1 | 2 | 3 | 4 | 5;

export type TraitId = "O" | "C" | "E" | "A" | "N";

export type AspectId =
  | "O_Intellect"
  | "O_Openness"
  | "C_Industriousness"
  | "C_Orderliness"
  | "E_Enthusiasm"
  | "E_Assertiveness"
  | "A_Compassion"
  | "A_Politeness"
  | "N_Volatility"
  | "N_Withdrawal";

export type QuestionV1 = {
  id: string;
  text: string;
  aspect: AspectId;
  reverse?: boolean;
};

export const ASPECTS_V1: Readonly<
  Record<
    AspectId,
    {
      id: AspectId;
      trait: TraitId;
      nameZh: string;
      hintZh: string;
    }
  >
> = {
  O_Intellect: {
    id: "O_Intellect",
    trait: "O",
    nameZh: "理性探索",
    hintZh: "抽象思考、学习欲、概念理解",
  },
  O_Openness: {
    id: "O_Openness",
    trait: "O",
    nameZh: "体验开放",
    hintZh: "好奇、审美、对新体验的接纳",
  },
  C_Industriousness: {
    id: "C_Industriousness",
    trait: "C",
    nameZh: "执行与进取",
    hintZh: "自驱、坚持、目标推进",
  },
  C_Orderliness: {
    id: "C_Orderliness",
    trait: "C",
    nameZh: "秩序与规划",
    hintZh: "条理、计划、结构化",
  },
  E_Enthusiasm: {
    id: "E_Enthusiasm",
    trait: "E",
    nameZh: "热情联结",
    hintZh: "外向能量、亲和、积极情绪",
  },
  E_Assertiveness: {
    id: "E_Assertiveness",
    trait: "E",
    nameZh: "主张表达",
    hintZh: "表达欲、影响力、带头行动",
  },
  A_Compassion: {
    id: "A_Compassion",
    trait: "A",
    nameZh: "同理关怀",
    hintZh: "共情、体贴、照顾他人感受",
  },
  A_Politeness: {
    id: "A_Politeness",
    trait: "A",
    nameZh: "礼貌克制",
    hintZh: "尊重规则、避免冒犯、讲分寸",
  },
  N_Volatility: {
    id: "N_Volatility",
    trait: "N",
    nameZh: "情绪波动",
    hintZh: "易急躁、易被点燃、情绪起伏",
  },
  N_Withdrawal: {
    id: "N_Withdrawal",
    trait: "N",
    nameZh: "压力退缩",
    hintZh: "担心、回避、在压力下变得收缩",
  },
};

// V1 item bank: 10 aspects x 6 items = 60 items.
// Note: Chinese items are原创/改写风格, 用于测量 Big Five/aspects, 不是医疗或临床量表。
export const QUESTIONS_V1: readonly QuestionV1[] = [
  // O - Intellect
  { id: "q001", aspect: "O_Intellect", text: "我喜欢把复杂问题拆开来想清楚。"},
  { id: "q002", aspect: "O_Intellect", text: "遇到新概念时, 我会主动去查资料弄懂它。"},
  { id: "q003", aspect: "O_Intellect", text: "我享受“脑子被打开”的学习瞬间。"},
  { id: "q004", aspect: "O_Intellect", text: "我对抽象理论通常没什么兴趣。", reverse: true},
  { id: "q005", aspect: "O_Intellect", text: "我愿意花时间理解一个系统背后的原理。"},
  { id: "q006", aspect: "O_Intellect", text: "我更偏好直觉拍板, 不太想做深度分析。", reverse: true},

  // O - Openness
  { id: "q007", aspect: "O_Openness", text: "我会被新鲜的体验或陌生的文化吸引。"},
  { id: "q008", aspect: "O_Openness", text: "我愿意尝试不同的表达方式（例如写作/音乐/视觉）。"},
  { id: "q009", aspect: "O_Openness", text: "我经常对“如果换一种可能性会怎样”感到好奇。"},
  { id: "q010", aspect: "O_Openness", text: "我更喜欢熟悉的套路, 不太愿意尝试新东西。", reverse: true},
  { id: "q011", aspect: "O_Openness", text: "艺术、审美或设计会显著影响我的体验。"},
  { id: "q012", aspect: "O_Openness", text: "我觉得想象力并不实用, 没必要花太多心思。", reverse: true},

  // C - Industriousness
  { id: "q013", aspect: "C_Industriousness", text: "我能持续推进一件事, 直到把它做完。"},
  { id: "q014", aspect: "C_Industriousness", text: "我会给自己设定目标, 并为之付出行动。"},
  { id: "q015", aspect: "C_Industriousness", text: "即使没人监督, 我也能保持投入。"},
  { id: "q016", aspect: "C_Industriousness", text: "我经常拖延到最后一刻才开始。", reverse: true},
  { id: "q017", aspect: "C_Industriousness", text: "我更像是“做事的人”, 而不是“想想的人”。"},
  { id: "q018", aspect: "C_Industriousness", text: "我容易半途而废, 热度过去就不想继续。", reverse: true},

  // C - Orderliness
  { id: "q019", aspect: "C_Orderliness", text: "我喜欢把事情按顺序和结构整理好。"},
  { id: "q020", aspect: "C_Orderliness", text: "做事之前, 我倾向于先规划路径与步骤。"},
  { id: "q021", aspect: "C_Orderliness", text: "我会用清单/日历/系统来管理生活或工作。"},
  { id: "q022", aspect: "C_Orderliness", text: "我不太在意秩序, 想到哪做到哪也可以。", reverse: true},
  { id: "q023", aspect: "C_Orderliness", text: "环境的整洁度会影响我的专注。"},
  { id: "q024", aspect: "C_Orderliness", text: "我很难坚持一个固定的流程或习惯。", reverse: true},

  // E - Enthusiasm
  { id: "q025", aspect: "E_Enthusiasm", text: "和人聊得来会让我“充电”。"},
  { id: "q026", aspect: "E_Enthusiasm", text: "我容易被氛围带动, 也会带动他人。"},
  { id: "q027", aspect: "E_Enthusiasm", text: "我表达情绪（开心/兴奋）通常比较自然。"},
  { id: "q028", aspect: "E_Enthusiasm", text: "长时间社交会让我明显疲惫。", reverse: true},
  { id: "q029", aspect: "E_Enthusiasm", text: "我更愿意把喜悦分享出来, 而不是自己消化。"},
  { id: "q030", aspect: "E_Enthusiasm", text: "我更偏好独处, 不太喜欢热闹场合。", reverse: true},

  // E - Assertiveness
  { id: "q031", aspect: "E_Assertiveness", text: "在群体里, 我不介意表达观点并推动决定。"},
  { id: "q032", aspect: "E_Assertiveness", text: "我敢于提出要求, 也能拒绝不合理的事。"},
  { id: "q033", aspect: "E_Assertiveness", text: "我在关键时刻愿意站出来承担责任。"},
  { id: "q034", aspect: "E_Assertiveness", text: "我通常避免成为焦点或发号施令。", reverse: true},
  { id: "q035", aspect: "E_Assertiveness", text: "即使意见不同, 我也愿意把话讲清楚。"},
  { id: "q036", aspect: "E_Assertiveness", text: "我更容易沉默, 让别人来带节奏。", reverse: true},

  // A - Compassion
  { id: "q037", aspect: "A_Compassion", text: "我能很快感知到别人的情绪变化。"},
  { id: "q038", aspect: "A_Compassion", text: "我在意让对方被理解, 而不只是把事办完。"},
  { id: "q039", aspect: "A_Compassion", text: "我愿意花精力照顾他人的感受与需求。"},
  { id: "q040", aspect: "A_Compassion", text: "别人情绪化时, 我通常觉得麻烦。", reverse: true},
  { id: "q041", aspect: "A_Compassion", text: "我会在意自己说的话是否伤到人。"},
  { id: "q042", aspect: "A_Compassion", text: "我更关注事实对错, 不太在意感受。", reverse: true},

  // A - Politeness
  { id: "q043", aspect: "A_Politeness", text: "我会尽量保持礼貌和分寸, 即使我不认同。"},
  { id: "q044", aspect: "A_Politeness", text: "我不喜欢“赢辩论”, 更想让关系别破。"},
  { id: "q045", aspect: "A_Politeness", text: "我倾向于按规则办事, 不太愿意越界。"},
  { id: "q046", aspect: "A_Politeness", text: "我觉得强硬一点也没关系, 冒犯就冒犯。", reverse: true},
  { id: "q047", aspect: "A_Politeness", text: "我愿意让一步, 换取更平稳的合作。"},
  { id: "q048", aspect: "A_Politeness", text: "我经常用讽刺或尖锐的方式表达不满。", reverse: true},

  // N - Volatility
  { id: "q049", aspect: "N_Volatility", text: "我有时会因为小事突然变得烦躁。"},
  { id: "q050", aspect: "N_Volatility", text: "我在压力下容易情绪起伏明显。"},
  { id: "q051", aspect: "N_Volatility", text: "当事情不顺时, 我更容易被点燃。"},
  { id: "q052", aspect: "N_Volatility", text: "我通常能保持情绪稳定, 不太会爆。", reverse: true},
  { id: "q053", aspect: "N_Volatility", text: "我偶尔会把情绪带到沟通里, 语气会变冲。"},
  { id: "q054", aspect: "N_Volatility", text: "我很少因为情绪而冲动做决定。", reverse: true},

  // N - Withdrawal
  { id: "q055", aspect: "N_Withdrawal", text: "我会担心未来可能发生的不好的情况。"},
  { id: "q056", aspect: "N_Withdrawal", text: "在陌生或不确定的场景里, 我会紧张。"},
  { id: "q057", aspect: "N_Withdrawal", text: "遇到压力时, 我更想躲起来自己消化。"},
  { id: "q058", aspect: "N_Withdrawal", text: "我很少焦虑, 通常很放松。", reverse: true},
  { id: "q059", aspect: "N_Withdrawal", text: "我会反复回想做过的事, 担心哪里做错了。"},
  { id: "q060", aspect: "N_Withdrawal", text: "即使遇到大事, 我也能很快平静下来。", reverse: true},
];

export const QUESTIONNAIRE_VERSION_V1 = "v1";

