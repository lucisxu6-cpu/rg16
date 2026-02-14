export type Likert = 1 | 2 | 3 | 4 | 5;

export type FunctionId = "Se" | "Si" | "Ne" | "Ni" | "Te" | "Ti" | "Fe" | "Fi";

export type FunctionKind = "perceiving" | "judging";
export type FunctionAttitude = "e" | "i";

export const JUNG_FUNCTIONS_META: Readonly<
  Record<
    FunctionId,
    {
      id: FunctionId;
      kind: FunctionKind;
      attitude: FunctionAttitude;
      nameZh: string;
      briefZh: string;
      taglineZh: string;
    }
  >
> = {
  Se: {
    id: "Se",
    kind: "perceiving",
    attitude: "e",
    nameZh: "外向实感",
    briefZh: "现场感知 / 直接行动",
    taglineZh: "相信当下, 用行动验证",
  },
  Si: {
    id: "Si",
    kind: "perceiving",
    attitude: "i",
    nameZh: "内向实感",
    briefZh: "经验记忆 / 稳定复用",
    taglineZh: "参考过往, 追求可靠",
  },
  Ne: {
    id: "Ne",
    kind: "perceiving",
    attitude: "e",
    nameZh: "外向直觉",
    briefZh: "可能性发散 / 联想跳跃",
    taglineZh: "先开脑洞, 看到更多路",
  },
  Ni: {
    id: "Ni",
    kind: "perceiving",
    attitude: "i",
    nameZh: "内向直觉",
    briefZh: "趋势洞察 / 收敛主线",
    taglineZh: "抓本质, 看见走向",
  },
  Te: {
    id: "Te",
    kind: "judging",
    attitude: "e",
    nameZh: "外向思考",
    briefZh: "效率结构 / 外部标准",
    taglineZh: "把事做成, 用结果说话",
  },
  Ti: {
    id: "Ti",
    kind: "judging",
    attitude: "i",
    nameZh: "内向思考",
    briefZh: "概念建模 / 内部一致",
    taglineZh: "先把逻辑讲通, 再行动",
  },
  Fe: {
    id: "Fe",
    kind: "judging",
    attitude: "e",
    nameZh: "外向情感",
    briefZh: "关系协同 / 场域氛围",
    taglineZh: "让沟通更顺, 让人跟得上",
  },
  Fi: {
    id: "Fi",
    kind: "judging",
    attitude: "i",
    nameZh: "内向情感",
    briefZh: "价值取向 / 真实一致",
    taglineZh: "对得起自己, 才能走得远",
  },
};

export type JungOption = {
  id: string;
  func: FunctionId;
  title: string;
  desc: string;
};

export type JungQuestion =
  | {
      id: string;
      type: "likert";
      func: FunctionId;
      reverse?: boolean;
      prompt: string;
    }
  | {
      id: string;
      type: "forced" | "situation";
      prompt: string;
      options: readonly JungOption[];
    };

export const QUESTIONNAIRE_VERSION_V2 = "v2";

// V2: Jungian cognitive functions first (Se/Si/Ne/Ni/Te/Ti/Fe/Fi).
// Mixed format: situation (4 choices) + forced-choice (2 choices) + likert calibration (5 points).
export const JUNG_QUESTIONS_V2: readonly JungQuestion[] = [
  // --- Likert calibration (2 per function, spread across the test) ---
  { id: "j001", type: "likert", func: "Se", prompt: "我更愿意先动起来, 在行动中调整。"},
  { id: "j002", type: "likert", func: "Si", prompt: "我会自然地把新情况和过去经验对照, 找到可复用的做法。"},
  { id: "j003", type: "likert", func: "Ne", prompt: "我常常从一个点联想到很多可能性与延伸。"},
  { id: "j004", type: "likert", func: "Ni", prompt: "我倾向于把信息收敛成一个核心结论或趋势。"},
  { id: "j005", type: "likert", func: "Te", prompt: "我更在意方案能否执行、是否高效。"},
  { id: "j006", type: "likert", func: "Ti", prompt: "我会不断追问定义与边界, 直到逻辑自洽。"},
  { id: "j007", type: "likert", func: "Fe", prompt: "我会注意对方的情绪与场合, 调整表达让沟通更顺。"},
  { id: "j008", type: "likert", func: "Fi", prompt: "我更在意这件事是否符合自己的价值与真实感受。"},

  { id: "j009", type: "likert", func: "Se", reverse: true, prompt: "如果没有充分准备, 我宁愿先观望, 不太想马上尝试。"},
  { id: "j010", type: "likert", func: "Si", reverse: true, prompt: "我很少参考过去的做法, 更喜欢每次都从零开始。"},
  { id: "j011", type: "likert", func: "Ne", reverse: true, prompt: "我不太喜欢开放式讨论, 更希望尽快定一个方向。"},
  { id: "j012", type: "likert", func: "Ni", reverse: true, prompt: "我更相信一步一步试出来, 不太信“突然的洞察”。"},
  { id: "j013", type: "likert", func: "Te", reverse: true, prompt: "我更在意概念是否优雅, 不太想为效率做妥协。"},
  { id: "j014", type: "likert", func: "Ti", reverse: true, prompt: "只要能解决问题, 我不太在意原理是否完全说得通。"},
  { id: "j015", type: "likert", func: "Fe", reverse: true, prompt: "我更习惯直接说结论, 不太在意对方当下能否接住。"},
  { id: "j016", type: "likert", func: "Fi", reverse: true, prompt: "为了维持和谐或进度, 我通常愿意压下自己的真实想法。"},

  // --- Perceiving situations (Se/Si/Ne/Ni) ---
  {
    id: "j101",
    type: "situation",
    prompt: "你第一次到一个陌生城市, 时间不多。你更可能怎么逛？",
    options: [
      { id: "A", func: "Se", title: "现场走起", desc: "直接出门走走看看, 被什么吸引就去哪里。"},
      { id: "B", func: "Si", title: "按经验来", desc: "先看攻略/地图, 选最稳妥的路线与节奏。"},
      { id: "C", func: "Ne", title: "随缘探索", desc: "路上看到有趣的点就发散联想, 顺着好奇走。"},
      { id: "D", func: "Ni", title: "抓主线", desc: "先想这座城的“气质/主题”, 只打卡关键节点。"},
    ],
  },
  {
    id: "j102",
    type: "situation",
    prompt: "拿到一个新项目, 信息不完整。你更先做什么？",
    options: [
      { id: "A", func: "Se", title: "先动手试", desc: "先做一个可跑的小样, 从反馈里补信息。"},
      { id: "B", func: "Si", title: "先找类似", desc: "先找历史案例/已有方案, 复用成熟路径。"},
      { id: "C", func: "Ne", title: "先发散", desc: "先列出多种可能的方向, 再筛选最有趣/最可行的。"},
      { id: "D", func: "Ni", title: "先定方向", desc: "先在脑内收敛出一条主线假设, 再围绕它补证据。"},
    ],
  },
  {
    id: "j103",
    type: "situation",
    prompt: "你在读一篇长文/看一场演讲。你更容易记住什么？",
    options: [
      { id: "A", func: "Se", title: "当场刺激", desc: "现场的画面、语气、亮点与冲击瞬间。"},
      { id: "B", func: "Si", title: "关键细节", desc: "结构、细节与和过往经验对应的部分。"},
      { id: "C", func: "Ne", title: "延伸联想", desc: "它能引出哪些新想法/新可能, 以及可组合的点。"},
      { id: "D", func: "Ni", title: "核心结论", desc: "它最终在说什么, 背后的主旨与趋势。"},
    ],
  },
  {
    id: "j104",
    type: "situation",
    prompt: "朋友和你描述一个复杂问题。你更倾向怎么理解？",
    options: [
      { id: "A", func: "Se", title: "还原现场", desc: "先弄清楚当时发生了什么、谁说了什么、环境怎样。"},
      { id: "B", func: "Si", title: "对照经验", desc: "把它和你见过的类似情况对照, 找到规律与惯性。"},
      { id: "C", func: "Ne", title: "打开选项", desc: "提出几个可能的解释与路径, 让对方看到更多选择。"},
      { id: "D", func: "Ni", title: "抓隐含逻辑", desc: "问几个关键问题, 迅速定位背后的根因/主线。"},
    ],
  },
  {
    id: "j105",
    type: "situation",
    prompt: "你在做一个决定, 但信息有噪音。你更信什么？",
    options: [
      { id: "A", func: "Se", title: "当下可见", desc: "先相信眼前可验证的事实与即时反馈。"},
      { id: "B", func: "Si", title: "稳定证据", desc: "先相信长期稳定的数据与过往验证过的规律。"},
      { id: "C", func: "Ne", title: "潜在可能", desc: "关注隐藏的机会窗口, 多留几条备选路线。"},
      { id: "D", func: "Ni", title: "未来走向", desc: "判断这事最终会走向哪里, 哪条路更符合趋势。"},
    ],
  },
  {
    id: "j106",
    type: "situation",
    prompt: "你在规划未来一年。更像你的是？",
    options: [
      { id: "A", func: "Se", title: "先安排体验", desc: "先把想去/想做的体验排进去, 让生活“有感”。"},
      { id: "B", func: "Si", title: "先稳住节奏", desc: "先把日常系统与节奏稳住, 再考虑变化。"},
      { id: "C", func: "Ne", title: "先留空间", desc: "先给未来留足弹性, 让机会与新方向能进来。"},
      { id: "D", func: "Ni", title: "先定主轴", desc: "先确定一个主轴目标, 其他都围绕它服务。"},
    ],
  },
  {
    id: "j107",
    type: "situation",
    prompt: "你在参加一场活动, 信息很多。你更容易做什么？",
    options: [
      { id: "A", func: "Se", title: "抓现场点", desc: "快速扫描现场, 找到最值得参与的点并加入。"},
      { id: "B", func: "Si", title: "遵循流程", desc: "按活动流程走, 记录关键细节, 不让自己漏掉重要环节。"},
      { id: "C", func: "Ne", title: "连接人和点", desc: "把不同人/话题连接起来, 找到新的组合机会。"},
      { id: "D", func: "Ni", title: "提炼主题", desc: "很快判断这场活动的核心主题与“暗线”, 只抓关键。"},
    ],
  },
  {
    id: "j108",
    type: "situation",
    prompt: "你在学习一项技能。更像你的是？",
    options: [
      { id: "A", func: "Se", title: "先上手", desc: "先做起来, 通过练习纠错来学。"},
      { id: "B", func: "Si", title: "先打基础", desc: "先按步骤把基础打牢, 再逐步加难度。"},
      { id: "C", func: "Ne", title: "先玩出花", desc: "先尝试多种玩法, 通过变化找到手感与兴趣点。"},
      { id: "D", func: "Ni", title: "先理解框架", desc: "先把核心框架看懂, 再在框架内练到熟。"},
    ],
  },
  {
    id: "j109",
    type: "situation",
    prompt: "你在看一个人的介绍/简历。你更关注？",
    options: [
      { id: "A", func: "Se", title: "呈现与行动", desc: "他做过什么, 现场表现如何, 能不能直接上手。"},
      { id: "B", func: "Si", title: "稳定履历", desc: "经历是否连贯, 是否可靠, 有没有可预测的稳定性。"},
      { id: "C", func: "Ne", title: "潜力与可能", desc: "他未来可能长成什么样, 能带来哪些新思路。"},
      { id: "D", func: "Ni", title: "动机与方向", desc: "他真正想做什么, 长期方向是否清晰一致。"},
    ],
  },
  {
    id: "j110",
    type: "situation",
    prompt: "你在整理一个混乱的想法。你更习惯？",
    options: [
      { id: "A", func: "Se", title: "写出来试试", desc: "先把东西写出来/做出来, 再根据结果调整。"},
      { id: "B", func: "Si", title: "按顺序梳理", desc: "按时间线/步骤把细节梳理清楚, 让它变稳定。"},
      { id: "C", func: "Ne", title: "画关联图", desc: "把点连成网, 看能长出哪些新的组合与方向。"},
      { id: "D", func: "Ni", title: "找一句话", desc: "逼自己用一句话说清楚主旨, 再扩展开。"},
    ],
  },
  {
    id: "j111",
    type: "situation",
    prompt: "别人向你征求建议。你更可能先问？",
    options: [
      { id: "A", func: "Se", title: "现场具体", desc: "你现在具体处在什么环境？发生了哪些可见事实？"},
      { id: "B", func: "Si", title: "过往模式", desc: "以前遇到类似情况你怎么做的？结果如何？"},
      { id: "C", func: "Ne", title: "其他可能", desc: "如果换一种做法会怎样？还有哪些路没试？"},
      { id: "D", func: "Ni", title: "关键变量", desc: "真正决定结果的关键变量是什么？你最在意的是什么？"},
    ],
  },
  {
    id: "j112",
    type: "situation",
    prompt: "面对一个开放式命题。更像你的入口是？",
    options: [
      { id: "A", func: "Se", title: "从现实切入", desc: "先找一个具体可见的切入点, 让它落地。"},
      { id: "B", func: "Si", title: "从已知切入", desc: "先找已有范式与可复用结构, 再往外拓展。"},
      { id: "C", func: "Ne", title: "从发散切入", desc: "先把可能性列出来, 再慢慢筛。"},
      { id: "D", func: "Ni", title: "从本质切入", desc: "先问“它本质在解决什么”, 再推导路线。"},
    ],
  },

  // --- Judging situations (Te/Ti/Fe/Fi) ---
  {
    id: "j201",
    type: "situation",
    prompt: "团队意见分歧, 时间紧。你更先做什么？",
    options: [
      { id: "A", func: "Te", title: "定目标指标", desc: "先明确目标/指标/截止时间, 再选最能达标的方案。"},
      { id: "B", func: "Ti", title: "理清逻辑", desc: "先把概念/假设讲清楚, 找出争议点的逻辑矛盾。"},
      { id: "C", func: "Fe", title: "对齐人心", desc: "先听每个人在乎什么, 让大家愿意一起走。"},
      { id: "D", func: "Fi", title: "守住底线", desc: "先确认哪些原则不能妥协, 再在剩下空间做选择。"},
    ],
  },
  {
    id: "j202",
    type: "situation",
    prompt: "你要给一个方案做评审。你更关注？",
    options: [
      { id: "A", func: "Te", title: "可执行与成本", desc: "资源、成本、风险与交付路径是否清晰。"},
      { id: "B", func: "Ti", title: "定义与一致性", desc: "概念是否严谨, 推理是否自洽, 有没有漏洞。"},
      { id: "C", func: "Fe", title: "协作与影响", desc: "对团队合作、客户体验、关系与氛围的影响。"},
      { id: "D", func: "Fi", title: "价值与真实", desc: "它是否违背你的价值观, 是否“做了也不舒服”。"},
    ],
  },
  {
    id: "j203",
    type: "situation",
    prompt: "同事把锅甩给你, 你很不爽。你更可能怎么处理？",
    options: [
      { id: "A", func: "Te", title: "用事实定责", desc: "把事实、流程、责任边界写清楚, 让问题可被解决。"},
      { id: "B", func: "Ti", title: "拆逻辑漏洞", desc: "指出对方论述里的漏洞, 让叙事回到逻辑。"},
      { id: "C", func: "Fe", title: "先稳关系", desc: "先把场面稳住, 私下把话说开, 避免扩大战损。"},
      { id: "D", func: "Fi", title: "表达底线", desc: "清楚表达你不能接受什么, 并按价值做选择。"},
    ],
  },
  {
    id: "j204",
    type: "situation",
    prompt: "你在做一个重要选择（职业/合作/关系）。你更依赖？",
    options: [
      { id: "A", func: "Te", title: "结果与路径", desc: "哪条路更能达成目标, 路径是否可控。"},
      { id: "B", func: "Ti", title: "原理与一致", desc: "是否符合你对世界的逻辑模型, 推理能否站住。"},
      { id: "C", func: "Fe", title: "人和氛围", desc: "对人的影响, 是否能形成稳定协作与共识。"},
      { id: "D", func: "Fi", title: "内在价值", desc: "是否对得起自己, 是否违背内心的选择标准。"},
    ],
  },
  {
    id: "j205",
    type: "situation",
    prompt: "朋友情绪崩溃来找你。你更自然的反应是？",
    options: [
      { id: "A", func: "Te", title: "先解决问题", desc: "先把问题拆清楚, 给一个可执行的下一步。"},
      { id: "B", func: "Ti", title: "先搞清原因", desc: "先问清楚发生了什么, 帮他把逻辑链条理顺。"},
      { id: "C", func: "Fe", title: "先共情陪伴", desc: "先让他被理解与安抚, 让情绪先落地。"},
      { id: "D", func: "Fi", title: "尊重感受", desc: "先尊重他的感受与节奏, 不急着替他做决定。"},
    ],
  },
  {
    id: "j206",
    type: "situation",
    prompt: "你在写一份重要的表达（汇报/文章/发言）。你更在意？",
    options: [
      { id: "A", func: "Te", title: "结论与行动", desc: "结论清晰, 能推动决策与行动。"},
      { id: "B", func: "Ti", title: "逻辑与精确", desc: "论证严谨, 定义准确, 不被挑漏洞。"},
      { id: "C", func: "Fe", title: "听众感受", desc: "听众能否跟上, 情绪与节奏是否舒服。"},
      { id: "D", func: "Fi", title: "真实一致", desc: "表达是否真实, 是否违背你内心的价值。"},
    ],
  },
  {
    id: "j207",
    type: "situation",
    prompt: "遇到不合理规则/流程。你更可能？",
    options: [
      { id: "A", func: "Te", title: "改到能跑", desc: "先让流程能跑起来, 再逐步优化。"},
      { id: "B", func: "Ti", title: "质疑其原理", desc: "先问它为什么存在, 指出概念/逻辑的不一致。"},
      { id: "C", func: "Fe", title: "考虑关系成本", desc: "先评估推进改动会不会伤到关系/氛围, 再找时机。"},
      { id: "D", func: "Fi", title: "按价值站队", desc: "看它是否违背你的价值底线, 不舒服就不配合。"},
    ],
  },
  {
    id: "j208",
    type: "situation",
    prompt: "别人批评你。你更容易被哪种批评击中？",
    options: [
      { id: "A", func: "Te", title: "说你没效率", desc: "说你拖慢进度/不够专业/不够结果导向。"},
      { id: "B", func: "Ti", title: "说你不严谨", desc: "说你逻辑不通/概念混乱/推理站不住。"},
      { id: "C", func: "Fe", title: "说你不体面", desc: "说你不顾场合/伤人/让人不舒服。"},
      { id: "D", func: "Fi", title: "说你不真诚", desc: "说你违背初心/没有坚持自己的价值。"},
    ],
  },
  {
    id: "j209",
    type: "situation",
    prompt: "你在做取舍：要快还是要对？更像你的是？",
    options: [
      { id: "A", func: "Te", title: "先跑起来", desc: "先让它能交付, 再迭代。"},
      { id: "B", func: "Ti", title: "先讲清楚", desc: "先把原理讲清楚, 否则后面会更痛。"},
      { id: "C", func: "Fe", title: "先照顾人", desc: "先让相关人能接受与协作, 否则跑不动。"},
      { id: "D", func: "Fi", title: "先对得起自己", desc: "先保证不违背内心标准, 否则做成也不舒服。"},
    ],
  },
  {
    id: "j210",
    type: "situation",
    prompt: "你在带一个新人。你更自然的带法？",
    options: [
      { id: "A", func: "Te", title: "给任务与标准", desc: "给清晰目标、标准、节奏与复盘。"},
      { id: "B", func: "Ti", title: "讲原理与框架", desc: "先讲清楚背后的原理与框架, 让他能推演。"},
      { id: "C", func: "Fe", title: "先建立信任", desc: "先建立安全感与沟通节奏, 让他敢问敢错。"},
      { id: "D", func: "Fi", title: "尊重其动机", desc: "先了解他在意什么, 让成长和价值对齐。"},
    ],
  },
  {
    id: "j211",
    type: "situation",
    prompt: "你在谈判/争论。你更常用的武器是？",
    options: [
      { id: "A", func: "Te", title: "事实与筹码", desc: "用数据、成本、资源与可行性推动结论。"},
      { id: "B", func: "Ti", title: "逻辑与定义", desc: "用定义、推理与一致性拆解对方观点。"},
      { id: "C", func: "Fe", title: "关系与共识", desc: "用共识、面子、氛围与情绪让局面可持续。"},
      { id: "D", func: "Fi", title: "价值与立场", desc: "用立场与价值表达边界, 让对方知道你为何坚持。"},
    ],
  },
  {
    id: "j212",
    type: "situation",
    prompt: "当你不得不做一个“不完美”的决定。你更痛的点是？",
    options: [
      { id: "A", func: "Te", title: "影响结果", desc: "担心它会拖慢结果/降低效率/让事情做不成。"},
      { id: "B", func: "Ti", title: "逻辑不干净", desc: "担心它逻辑不自洽/概念不清/未来会爆雷。"},
      { id: "C", func: "Fe", title: "关系受损", desc: "担心它让人难堪/破坏信任/影响合作氛围。"},
      { id: "D", func: "Fi", title: "违背初心", desc: "担心它违背你的价值/让你对自己失望。"},
    ],
  },

  // --- Forced-choice (pairs) ---
  // Se vs Si
  {
    id: "j301",
    type: "forced",
    prompt: "旅行或出门办事时, 你更像？",
    options: [
      { id: "A", func: "Se", title: "边走边看", desc: "现场决定, 被当下吸引就调整路线。"},
      { id: "B", func: "Si", title: "按节奏走", desc: "按计划与熟悉节奏推进, 更稳更省心。"},
    ],
  },
  {
    id: "j302",
    type: "forced",
    prompt: "学习新技能时, 你更依赖？",
    options: [
      { id: "A", func: "Se", title: "上手练", desc: "先练起来, 通过反馈快速迭代。"},
      { id: "B", func: "Si", title: "按步骤", desc: "按步骤打基础, 稳稳积累。"},
    ],
  },
  {
    id: "j303",
    type: "forced",
    prompt: "你更信哪种信息？",
    options: [
      { id: "A", func: "Se", title: "眼前可见", desc: "可被当场验证的事实与感受。"},
      { id: "B", func: "Si", title: "长期可靠", desc: "被多次验证过的经验与规律。"},
    ],
  },
  {
    id: "j304",
    type: "forced",
    prompt: "面对临时变动, 你更可能？",
    options: [
      { id: "A", func: "Se", title: "立刻适配", desc: "现场快速调整, 先把局面稳住。"},
      { id: "B", func: "Si", title: "先回到流程", desc: "找回既有流程/节奏, 再做调整。"},
    ],
  },
  {
    id: "j305",
    type: "forced",
    prompt: "你更享受哪种状态？",
    options: [
      { id: "A", func: "Se", title: "当下有感", desc: "身体在场, 注意力在现实里。"},
      { id: "B", func: "Si", title: "稳定可控", desc: "节奏稳定, 事情按预期推进。"},
    ],
  },
  {
    id: "j306",
    type: "forced",
    prompt: "做选择时, 你更倾向？",
    options: [
      { id: "A", func: "Se", title: "先试再说", desc: "先试试, 用结果来决定下一步。"},
      { id: "B", func: "Si", title: "先评估风险", desc: "先评估历史经验与风险, 再出手。"},
    ],
  },

  // Ne vs Ni
  {
    id: "j311",
    type: "forced",
    prompt: "面对一个新领域, 你更像？",
    options: [
      { id: "A", func: "Ne", title: "先发散", desc: "先把可能性铺开, 再慢慢筛选。"},
      { id: "B", func: "Ni", title: "先收敛", desc: "先收敛成一个方向假设, 再补证据。"},
    ],
  },
  {
    id: "j312",
    type: "forced",
    prompt: "讨论问题时, 你更常做？",
    options: [
      { id: "A", func: "Ne", title: "提出新角度", desc: "不断提出新的视角与可能路线。"},
      { id: "B", func: "Ni", title: "逼近主线", desc: "不断逼近一个更本质的解释与主线。"},
    ],
  },
  {
    id: "j313",
    type: "forced",
    prompt: "你更相信哪种能力？",
    options: [
      { id: "A", func: "Ne", title: "打开选择", desc: "能看到更多可能, 不把路堵死。"},
      { id: "B", func: "Ni", title: "看见走向", desc: "能看见趋势与结局, 早点定方向。"},
    ],
  },
  {
    id: "j314",
    type: "forced",
    prompt: "当你卡住时, 你更可能通过什么解卡？",
    options: [
      { id: "A", func: "Ne", title: "换一套玩法", desc: "换思路, 找新的组合方式。"},
      { id: "B", func: "Ni", title: "回到本质", desc: "回到问题本质, 砍掉枝节。"},
    ],
  },
  {
    id: "j315",
    type: "forced",
    prompt: "你更容易被哪种内容吸引？",
    options: [
      { id: "A", func: "Ne", title: "脑洞与新奇", desc: "能激发联想、扩展边界的内容。"},
      { id: "B", func: "Ni", title: "洞察与预判", desc: "能解释趋势、指出本质的内容。"},
    ],
  },
  {
    id: "j316",
    type: "forced",
    prompt: "面对信息过载, 你更倾向？",
    options: [
      { id: "A", func: "Ne", title: "先广泛看", desc: "先广泛扫一遍, 找灵感与连接点。"},
      { id: "B", func: "Ni", title: "先选一条线", desc: "先选一条线深挖, 让结论更清晰。"},
    ],
  },

  // Te vs Ti
  {
    id: "j321",
    type: "forced",
    prompt: "解决问题时, 你更在意？",
    options: [
      { id: "A", func: "Te", title: "能交付", desc: "方案能落地, 能推动结果。"},
      { id: "B", func: "Ti", title: "讲得通", desc: "概念严谨, 推理自洽。"},
    ],
  },
  {
    id: "j322",
    type: "forced",
    prompt: "你更容易被夸哪一点击中？",
    options: [
      { id: "A", func: "Te", title: "靠谱高效", desc: "你把事做成了, 而且很高效。"},
      { id: "B", func: "Ti", title: "思考深刻", desc: "你的逻辑很强, 观点很严谨。"},
    ],
  },
  {
    id: "j323",
    type: "forced",
    prompt: "你更讨厌哪种混乱？",
    options: [
      { id: "A", func: "Te", title: "执行混乱", desc: "没人负责, 没有节点, 一直拖。"},
      { id: "B", func: "Ti", title: "概念混乱", desc: "定义不清, 逻辑互相打架。"},
    ],
  },
  {
    id: "j324",
    type: "forced",
    prompt: "做决策时, 你更愿意依赖？",
    options: [
      { id: "A", func: "Te", title: "外部标准", desc: "指标、成本、ROI、可行性。"},
      { id: "B", func: "Ti", title: "内部模型", desc: "原理、定义、逻辑一致性。"},
    ],
  },
  {
    id: "j325",
    type: "forced",
    prompt: "你更常用哪种语言说服别人？",
    options: [
      { id: "A", func: "Te", title: "结果导向", desc: "做这个能带来什么结果/收益。"},
      { id: "B", func: "Ti", title: "原理论证", desc: "为什么它在逻辑上成立。"},
    ],
  },
  {
    id: "j326",
    type: "forced",
    prompt: "遇到争论, 你更倾向？",
    options: [
      { id: "A", func: "Te", title: "推动落地", desc: "先达成可执行共识, 再迭代。"},
      { id: "B", func: "Ti", title: "追求精确", desc: "先把概念掰清楚, 再做结论。"},
    ],
  },

  // Fe vs Fi
  {
    id: "j331",
    type: "forced",
    prompt: "做决定时, 你更先考虑？",
    options: [
      { id: "A", func: "Fe", title: "对人的影响", desc: "大家能不能接受, 关系是否可持续。"},
      { id: "B", func: "Fi", title: "是否真实", desc: "是否符合你的价值与真实感受。"},
    ],
  },
  {
    id: "j332",
    type: "forced",
    prompt: "你更害怕成为哪种人？",
    options: [
      { id: "A", func: "Fe", title: "让人难堪", desc: "让局面尴尬、伤到关系、破坏氛围。"},
      { id: "B", func: "Fi", title: "背离初心", desc: "为了迎合而违背自己的价值。"},
    ],
  },
  {
    id: "j333",
    type: "forced",
    prompt: "你更喜欢哪种合作氛围？",
    options: [
      { id: "A", func: "Fe", title: "顺畅协作", desc: "彼此照顾感受, 沟通顺, 有默契。"},
      { id: "B", func: "Fi", title: "价值一致", desc: "目标/价值一致, 不用做违心的事。"},
    ],
  },
  {
    id: "j334",
    type: "forced",
    prompt: "你更习惯如何表达不同意？",
    options: [
      { id: "A", func: "Fe", title: "委婉对齐", desc: "先对齐情绪与立场, 再提出不同点。"},
      { id: "B", func: "Fi", title: "直说底线", desc: "直接说我在乎什么, 什么不能接受。"},
    ],
  },
  {
    id: "j335",
    type: "forced",
    prompt: "你更容易被哪种内容打动？",
    options: [
      { id: "A", func: "Fe", title: "群体共鸣", desc: "能让很多人产生共鸣、形成氛围的内容。"},
      { id: "B", func: "Fi", title: "个人真实", desc: "非常私密真实、忠于自我的表达。"},
    ],
  },
  {
    id: "j336",
    type: "forced",
    prompt: "当别人不理解你时, 你更痛的点是？",
    options: [
      { id: "A", func: "Fe", title: "关系断裂", desc: "担心误解让关系断裂/合作变差。"},
      { id: "B", func: "Fi", title: "被否定价值", desc: "感觉自己的价值与真实被否定。"},
    ],
  },
];

export const LIKERT_SCALE_ZH: ReadonlyArray<{
  id: `${Likert}`;
  v: Likert;
  top: string;
  sub: string;
}> = [
  { id: "1", v: 1, top: "非常不同意", sub: "几乎完全不符合" },
  { id: "2", v: 2, top: "比较不同意", sub: "多数时候不符合" },
  { id: "3", v: 3, top: "不确定", sub: "一半一半" },
  { id: "4", v: 4, top: "比较同意", sub: "多数时候符合" },
  { id: "5", v: 5, top: "非常同意", sub: "几乎完全符合" },
];

