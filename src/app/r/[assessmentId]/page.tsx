import { notFound } from "next/navigation";

import { ASPECTS_V1, type AspectId, type TraitId } from "@/data/questions";
import { JUNG_FUNCTIONS_META, QUESTIONNAIRE_VERSION_V2, type FunctionId } from "@/data/jung";
import { DEFAULT_TYPE_BASELINE, getBaselineRows } from "@/data/typeBaseline";
import UnlockPanel from "./UnlockPanel";
import { isPaywallBypassed } from "@/lib/entitlements";
import type { MbtiResult } from "@/lib/mbti";
import { buildDeepReport } from "@/lib/report";
import { buildJungDeepReport } from "@/lib/reportJung";
import { buildRomanticProfile } from "@/lib/romance";
import { SKUS } from "@/lib/sku";
import { scoreAssessmentV2, type JungScorePackV2 } from "@/lib/jungScoring";
import type { JungTypeId, JungTypeResultV2 } from "@/lib/jungType";
import type { QualityPack, ScorePackV1 } from "@/lib/scoring";
import { getActiveModules, getAssessment, getTypeDistribution } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function pct1(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function pp(n: number) {
  const v = Math.abs(n * 100).toFixed(1);
  return `${n >= 0 ? "+" : "-"}${v}pp`;
}

function normalizeJungLevel(level: unknown): "高阶" | "中阶" | "低阶" {
  if (level === "高阶" || level === "中阶" || level === "低阶") return level;
  if (level === "边界") return "低阶";
  return "低阶";
}

function traitNameShort(id: TraitId) {
  switch (id) {
    case "O":
      return "O";
    case "C":
      return "C";
    case "E":
      return "E";
    case "A":
      return "A";
    case "N":
      return "N";
  }
}

function funcLabel(func: FunctionId) {
  const m = JUNG_FUNCTIONS_META[func];
  return `${func} · ${m.nameZh}`;
}

function funcPairRows(scores: Record<FunctionId, number>) {
  const pairs: Array<[FunctionId, FunctionId]> = [
    ["Se", "Si"],
    ["Ne", "Ni"],
    ["Te", "Ti"],
    ["Fe", "Fi"],
  ];
  return pairs.map(([a, b]) => {
    const av = scores[a];
    const bv = scores[b];
    return {
      a,
      b,
      av,
      bv,
      diff: Math.abs(av - bv),
      leading: av === bv ? null : av > bv ? a : b,
    };
  });
}

type FunctionAxisKey = "Se_Si" | "Si_Se" | "Ne_Ni" | "Ni_Ne" | "Te_Ti" | "Ti_Te" | "Fe_Fi" | "Fi_Fe";

const FUNCTION_AXIS_META: Record<
  FunctionAxisKey,
  {
    leftHint: string;
    rightHint: string;
    scene: string;
  }
> = {
  Se_Si: {
    leftHint: "实时观察 + 直接行动",
    rightHint: "经验复盘 + 稳定复用",
    scene: "接收信息",
  },
  Ne_Ni: {
    leftHint: "多路径发散",
    rightHint: "单主线收敛",
    scene: "理解可能性",
  },
  Te_Ti: {
    leftHint: "外部目标与效率",
    rightHint: "内部逻辑一致",
    scene: "理性决策",
  },
  Fe_Fi: {
    leftHint: "关系协同与场域",
    rightHint: "价值一致与边界",
    scene: "价值判断",
  },
  Si_Se: {
    leftHint: "经验复盘 + 稳定复用",
    rightHint: "实时观察 + 直接行动",
    scene: "接收信息",
  },
  Ni_Ne: {
    leftHint: "单主线收敛",
    rightHint: "多路径发散",
    scene: "理解可能性",
  },
  Ti_Te: {
    leftHint: "内部逻辑一致",
    rightHint: "外部目标与效率",
    scene: "理性决策",
  },
  Fi_Fe: {
    leftHint: "价值一致与边界",
    rightHint: "关系协同与场域",
    scene: "价值判断",
  },
};

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

function pairNarrative(p: ReturnType<typeof funcPairRows>[number]) {
  const key = `${p.a}_${p.b}` as FunctionAxisKey;
  const meta = FUNCTION_AXIS_META[key];
  if (meta == null) return `${p.a}/${p.b} 差值 ${p.diff}。`;
  if (p.diff <= 8) {
    return `这条轴两侧接近（差值 ${p.diff}），你在${meta.scene}时更依赖具体情境切换。`;
  }
  if (p.leading === p.a) {
    return `当前更偏向 ${p.a}（${meta.leftHint}），差值 ${p.diff}。`;
  }
  if (p.leading === p.b) {
    return `当前更偏向 ${p.b}（${meta.rightHint}），差值 ${p.diff}。`;
  }
  return `${p.a}/${p.b} 暂时平衡（差值 ${p.diff}）。`;
}

function qualityTier(score: number) {
  if (score >= 80) return "高稳定";
  if (score >= 65) return "可用";
  return "建议复测";
}

function rarityByShare(share: number) {
  if (share >= 0.12) return "常见";
  if (share >= 0.08) return "偏常见";
  if (share >= 0.05) return "中位";
  if (share >= 0.03) return "偏少见";
  return "少见";
}

const SOCIAL_IMPRESSION_HINTS: Record<
  FunctionId,
  {
    firstImpression: string;
    groupValue: string;
    groupRisk: string;
  }
> = {
  Se: {
    firstImpression: "行动快、现场反应强，容易被视为“能马上推进的人”。",
    groupValue: "在高变化场景里能快速拉动节奏与执行。",
    groupRisk: "可能被误解为“太急”，需要补一句长期权衡。",
  },
  Si: {
    firstImpression: "稳定、靠谱、细节有记忆，容易被视为“可托付的人”。",
    groupValue: "能把经验沉淀为团队可复制流程。",
    groupRisk: "可能被误解为“保守”，需要主动说明创新窗口。",
  },
  Ne: {
    firstImpression: "点子多、连接快，容易被视为“思路打开的人”。",
    groupValue: "能给团队提供替代路径与机会雷达。",
    groupRisk: "可能被误解为“太散”，需要给出收敛时间点。",
  },
  Ni: {
    firstImpression: "方向感强、能抓主线，容易被视为“看得远的人”。",
    groupValue: "在不确定环境中能稳定战略焦点。",
    groupRisk: "可能被误解为“太主观”，需要补充阶段证据。",
  },
  Te: {
    firstImpression: "目标导向、结构清晰，容易被视为“结果负责人”。",
    groupValue: "能把模糊任务快速转成执行计划。",
    groupRisk: "可能被误解为“只看结果”，需要加人际缓冲。",
  },
  Ti: {
    firstImpression: "逻辑严密、框架清楚，容易被视为“判断质量高的人”。",
    groupValue: "能在复杂问题中减少决策噪音与漏洞。",
    groupRisk: "可能被误解为“太较真”，需要同步行动优先级。",
  },
  Fe: {
    firstImpression: "沟通敏感、会照顾场域，容易被视为“氛围稳定器”。",
    groupValue: "在协作冲突中能保持关系与推进并存。",
    groupRisk: "可能被误解为“没立场”，需要明确底线。",
  },
  Fi: {
    firstImpression: "价值稳定、态度真实，容易被视为“有原则的人”。",
    groupValue: "能帮助团队识别长期价值与边界风险。",
    groupRisk: "可能被误解为“难协商”，需要把价值翻译成可协同语言。",
  },
};

const FUNCTION_REALITY_HINTS: Record<
  FunctionId,
  { strength: string; risk: string; advice: string }
> = {
  Se: {
    strength: "你更容易在实时场景中迅速抓重点并行动，执行启动快。",
    risk: "在高压下可能过度追求即时反馈，忽略长期成本。",
    advice: "关键决策前给自己加一条“24 小时复盘窗口”，避免冲动收尾。",
  },
  Si: {
    strength: "你擅长复用经验与流程，能把结果做得稳定可复制。",
    risk: "过于依赖已验证路径时，可能错过新机会。",
    advice: "在稳态方案外，固定保留 10% 资源做低风险新尝试。",
  },
  Ne: {
    strength: "你善于看到多条可能路径，创意与连接能力突出。",
    risk: "发散过多时，容易出现方向频繁切换。",
    advice: "每次发散后用“1 条主线 + 2 条备线”收敛，避免执行稀释。",
  },
  Ni: {
    strength: "你更擅长提炼趋势与本质，战略判断有前瞻性。",
    risk: "过度收敛时，可能忽视外部即时反馈。",
    advice: "把你的结论拆成可验证的阶段性假设，用小实验校正直觉。",
  },
  Te: {
    strength: "你关注目标、效率和结果，推进项目的能力很强。",
    risk: "只盯结果时，可能让协作方感到被压缩或被忽视。",
    advice: "推进节点前加 5 分钟“风险与情绪对齐”，提升团队跟随度。",
  },
  Ti: {
    strength: "你会追求逻辑精确与模型一致，判断质量通常较高。",
    risk: "追求完备性时，可能影响推进速度。",
    advice: "为关键分析设置时间上限，达到“足够正确”后先行动再迭代。",
  },
  Fe: {
    strength: "你能敏锐感知关系与氛围，沟通协同能力突出。",
    risk: "过度照顾他人时，容易压住自己的真实需求。",
    advice: "在共识达成后，明确表达你的底线与资源边界。",
  },
  Fi: {
    strength: "你有稳定的价值判断，决策更容易保持真实一致。",
    risk: "价值冲突时，可能转向内耗或回避表达。",
    advice: "把内在标准转成外部可沟通语言，减少误解成本。",
  },
};

function sortedFunctionIds(scores: Record<FunctionId, number>) {
  return (Object.keys(scores) as FunctionId[]).sort((a, b) => scores[b] - scores[a]);
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  const row = await getAssessment(assessmentId);

  if (!row) notFound();

  const quality = row.qualityJson as unknown as QualityPack;

  const bypass = isPaywallBypassed();
  const unlockedModules = await getActiveModules(assessmentId);
  const deepUnlocked = bypass || unlockedModules.has("deep_report");

  const sku = SKUS.deep_report_v1;
  const priceLabel =
    sku.currency === "usd"
      ? `$${(sku.unitAmount / 100).toFixed(2)}`
      : `¥${(sku.unitAmount / 100).toFixed(2)}`;

  const isV2 = row.version === QUESTIONNAIRE_VERSION_V2;

  if (isV2) {
    const scores = row.scoresJson as unknown as JungScorePackV2;
    const jung = row.mbtiJson as unknown as JungTypeResultV2;
    const levelLabel = normalizeJungLevel((jung as { level?: unknown }).level);

    const report = deepUnlocked
      ? buildJungDeepReport({
          scores,
          typeResult: jung,
          quality,
          answers: (row.answersJson ?? null) as Record<string, unknown> | null,
        })
      : null;

    const stackLine = `${jung.stack.dom} → ${jung.stack.aux} → ${jung.stack.ter} → ${jung.stack.inf}`;
    const pairRows = funcPairRows(scores.functions);
    const weakestPair = pairRows.reduce((min, cur) => (cur.diff < min.diff ? cur : min), pairRows[0]);
    const ranked = sortedFunctionIds(scores.functions);
    const top2 = ranked.slice(0, 2);
    const low2 = ranked.slice(-2);
    const gapConf = clamp01(jung.debug.gap / 18);
    const qualityBreakdown =
      quality.breakdown ??
      (isStringRecord(row.answersJson)
        ? scoreAssessmentV2({
            version: QUESTIONNAIRE_VERSION_V2,
            answers: row.answersJson,
            durationMs: row.durationMs,
          }).quality.breakdown
        : undefined);
    const typeStats = await getTypeDistribution({ version: QUESTIONNAIRE_VERSION_V2, limit: 16 });
    const currentTypeRow = typeStats.rows.find((x) => x.type === jung.type);
    const topTypeRows = typeStats.rows.slice(0, 5);
    const sampleReliable = typeStats.sampleSize >= 30;
    const baselineRows = getBaselineRows(DEFAULT_TYPE_BASELINE);
    const baselineType = jung.type as JungTypeId;
    const baselineCurrentRow = baselineRows.find((x) => x.type === baselineType) ?? null;
    const baselineTopRows = baselineRows.slice(0, 5);
    const siteVsBaselineDelta = currentTypeRow && baselineCurrentRow ? currentTypeRow.share - baselineCurrentRow.share : null;
    const siteRankVsBaseline =
      currentTypeRow && baselineCurrentRow ? baselineCurrentRow.rank - currentTypeRow.rank : null;
    const romance = buildRomanticProfile({ type: jung.type, stack: jung.stack });
    const quickShare = currentTypeRow
      ? `我是 ${jung.type}，主导/辅助 ${jung.stack.dom}/${jung.stack.aux}。本站占比 ${pct1(currentTypeRow.share)}，全国基线 ${baselineCurrentRow ? pct1(baselineCurrentRow.share) : "--"}。`
      : `我是 ${jung.type}，主导/辅助 ${jung.stack.dom}/${jung.stack.aux}。全国基线占比 ${baselineCurrentRow ? pct1(baselineCurrentRow.share) : "--"}。`;

    return (
      <main className="resultLayout">
        <section className="card resultTop animIn stagger2">
          <p className="kicker">Result</p>
          <div className="typeBig">{jung.type}</div>
          <div className="typeMeta">
            <div className="pill">功能栈: {stackLine}</div>
            <div className="pill">类型置信度: {pct(jung.confidence)} / {levelLabel}</div>
            <div className="pill">作答质量: {Math.round(quality.quality)} / 100</div>
            <div className="pill">免费报告已解锁</div>
            {bypass ? <div className="pill">DEV_BYPASS_PAYWALL=1</div> : null}
          </div>

          <div className="barList" aria-label="jung-function-pairs">
            {pairRows.map((p) => (
              <div className="barRow" key={`${p.a}_${p.b}`}>
                <div className="barLabelDual" title={`${funcLabel(p.a)} vs ${funcLabel(p.b)}`}>
                  <strong>
                    {p.a}/{p.b}
                  </strong>
                  <span>
                    {JUNG_FUNCTIONS_META[p.a].nameZh} / {JUNG_FUNCTIONS_META[p.b].nameZh}
                  </span>
                </div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: `${p.av}%` }} />
                </div>
                <div className="muted">
                  {p.av}%:{p.bv}%
                </div>
              </div>
            ))}
          </div>

          <div className="toast muted" style={{ marginTop: 12 }}>
            说明: 这里的 4 字母是由功能栈推导的标签。核心输出是八维（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）与主辅功能栈。
          </div>

          {quality.warnings.length > 0 ? (
            <div className="toast" style={{ marginTop: 10 }}>
              {quality.warnings.join(" ")}
            </div>
          ) : null}
        </section>

        <section className="section grid2">
          <div className="card sideCard">
            <h3>功能栈轴怎么读</h3>
            <p>
              每条“轴”是同一类功能的两种路径，不是好坏。你可以把它理解为你更自然的观察/决策入口。
            </p>
            <div className="axisExplainList" style={{ marginTop: 10 }}>
              {pairRows.map((p) => (
                <div className="axisExplainItem" key={`axis_${p.a}_${p.b}`}>
                  <p className="axisExplainTitle">
                    {p.a}/{p.b} · {p.av}% vs {p.bv}%（差值 {p.diff}）
                  </p>
                  <p className="axisExplainText">{pairNarrative(p)}</p>
                </div>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              主导/辅助栈 {jung.stack.dom} + {jung.stack.aux} 代表你最常用的“看世界 + 做判断”组合。
            </p>
          </div>

          <div className="card sideCard">
            <h3>判定依据（公开可查）</h3>
            <ul>
              <li>
                置信度 = 0.65 × gapConf + 0.35 × pairClarity；当前为 {pct(jung.confidence)}，其中 gapConf {pct(gapConf)}、pairClarity{" "}
                {pct(jung.debug.pairClarity)}。
              </li>
              <li>层级阈值：高阶 ≥ 75%，中阶 60%-74%，低阶 &lt; 60%（反映稳定度，不是人格高低）。</li>
              <li>
                你当前最难区分的轴是 {weakestPair.a}/{weakestPair.b}（差值 {weakestPair.diff}），通常也是最需要复盘验证的点。
              </li>
            </ul>
            <div className="methodGrid" style={{ marginTop: 10 }}>
              <div className="methodCell">
                <strong>
                  作答质量 {Math.round(quality.quality)}/100（{qualityTier(quality.quality)}）
                </strong>
                <span>
                  quality = 0.38×完成度 + 0.18×离散度 + 0.18×位置均衡 + 0.14×连续同位惩罚 + 0.12×速度
                </span>
                {qualityBreakdown ? (
                  <ul className="methodList">
                    <li>完成度: {pct(qualityBreakdown.completionScore)}（{quality.answered}/{quality.total}）</li>
                    <li>离散度: {pct(qualityBreakdown.varianceScore)}（std {quality.std}）</li>
                    <li>
                      位置均衡:{" "}
                      {qualityBreakdown.choiceBiasScore != null ? pct(qualityBreakdown.choiceBiasScore) : "旧记录未留存"}
                    </li>
                    <li>连续同位: {pct(qualityBreakdown.straightlineScore)}（maxRun {quality.maxRun}）</li>
                    <li>
                      速度: {pct(qualityBreakdown.speedScore)}
                      {quality.avgMsPerItem != null ? `（${quality.avgMsPerItem}ms/题）` : ""}
                    </li>
                  </ul>
                ) : (
                  <p className="muted" style={{ marginTop: 8 }}>
                    该记录缺少分解字段，建议重测一次以获得完整质量证据链。
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section grid2">
          <div className="card sideCard">
            <h3>人群对比（站内样本 vs 全国基线）</h3>
            {currentTypeRow ? (
              <p>
                在已完成的 <strong>{typeStats.sampleSize}</strong> 份同版本样本里，你的类型 <strong>{jung.type}</strong> 占{" "}
                <strong>{pct1(currentTypeRow.share)}</strong>，出现频率排名 <strong>#{currentTypeRow.rank}</strong>（共{" "}
                {typeStats.rows.length} 类有样本）。
              </p>
            ) : (
              <p>
                当前样本中还没有足够同类数据，你是该类型的早期样本之一。随着样本增长，这里的占比会自动更新。
              </p>
            )}
            {!sampleReliable ? (
              <p className="muted" style={{ marginTop: 8 }}>
                当前样本量较小（{typeStats.sampleSize}），建议把占比当作探索线索，不要当成定论。
              </p>
            ) : null}
            <div className="methodCell" style={{ marginTop: 10 }}>
              <strong>外部全国基线（非站内）</strong>
              {baselineCurrentRow ? (
                <span>
                  在 {DEFAULT_TYPE_BASELINE.labelZh} 中，{jung.type} 占比 {pct1(baselineCurrentRow.share)}（排名 #{baselineCurrentRow.rank}，
                  {rarityByShare(baselineCurrentRow.share)}）。
                </span>
              ) : (
                <span>当前基线中暂无该类型占比记录。</span>
              )}
              {siteVsBaselineDelta != null ? (
                <span>
                  与本站样本相比差值 {pp(siteVsBaselineDelta)}；排名差{" "}
                  {siteRankVsBaseline != null ? (siteRankVsBaseline > 0 ? `+${siteRankVsBaseline}` : `${siteRankVsBaseline}`) : "--"}。
                </span>
              ) : (
                <span>本站样本不足，暂无法计算差值。</span>
              )}
              <span>
                基线来源:{" "}
                <a href={DEFAULT_TYPE_BASELINE.sourceUrl} target="_blank" rel="noreferrer">
                  {DEFAULT_TYPE_BASELINE.sourceLabel}
                </a>{" "}
                ({DEFAULT_TYPE_BASELINE.year}, N={DEFAULT_TYPE_BASELINE.sampleSize})
              </span>
              <span>{DEFAULT_TYPE_BASELINE.noteZh}</span>
            </div>
            {topTypeRows.length > 0 ? (
              <>
                <p className="muted" style={{ marginTop: 10, marginBottom: 6 }}>
                  站内高频类型 Top {topTypeRows.length}:
                </p>
                <ul>
                  {topTypeRows.map((x) => (
                    <li key={`type_rank_${x.type}`}>
                      {x.rank}. {x.type}（{pct1(x.share)}，{x.count} 人）
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="muted" style={{ marginTop: 10, marginBottom: 6 }}>
              全国基线 Top {baselineTopRows.length}:
            </p>
            <ul>
              {baselineTopRows.map((x) => (
                <li key={`baseline_rank_${x.type}`}>
                  {x.rank}. {x.type}（{pct1(x.share)}）
                </li>
              ))}
            </ul>
          </div>

          <div className="card sideCard">
            <h3>社会心理学视角（免费）</h3>
            <ul>
              <li>
                他人第一印象（偏 {jung.stack.dom}）：{SOCIAL_IMPRESSION_HINTS[jung.stack.dom].firstImpression}
              </li>
              <li>
                你在群体中的典型价值：{SOCIAL_IMPRESSION_HINTS[jung.stack.dom].groupValue}
              </li>
              <li>
                最常见误解点：{SOCIAL_IMPRESSION_HINTS[jung.stack.dom].groupRisk}
              </li>
              <li>
                你的辅助功能 {jung.stack.aux} 往往决定“长期合作舒适度”，比第一印象更影响关系质量。
              </li>
            </ul>
            <p className="muted" style={{ marginTop: 8 }}>
              这部分回答的是“我在别人眼里通常像谁”，而不只是“我自我感觉像谁”。
            </p>
            <div className="methodCell" style={{ marginTop: 10 }}>
              <strong>可直接分享的一句话</strong>
              <span>{quickShare}</span>
            </div>
          </div>
        </section>

        <section className="section grid2">
          <div className="card sideCard">
            <h3>恋爱匹配图谱（官配 / 高摩擦）</h3>
            <p>
              这不是“命中注定”，而是基于功能栈与社会心理学，给你一个“更容易甜、也更容易拉扯”的关系概率地图。
            </p>
            <div className="methodCell" style={{ marginTop: 10 }}>
              <strong>高稳定官配（长期）</strong>
              <ul className="methodList">
                {romance.secureMatches.map((x) => (
                  <li key={`secure_${x.type}`}>
                    <strong>{x.type}</strong>：{x.reasonZh}
                  </li>
                ))}
              </ul>
            </div>
            <div className="methodCell" style={{ marginTop: 10 }}>
              <strong>高张力心动（高火花）</strong>
              <ul className="methodList">
                {romance.sparkMatches.map((x) => (
                  <li key={`spark_${x.type}`}>
                    <strong>{x.type}</strong>：{x.reasonZh}
                  </li>
                ))}
              </ul>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              模型说明：{romance.modelNotesZh[0]}
            </p>
          </div>

          <div className="card sideCard">
            <h3>浪漫与情绪价值（可落地）</h3>
            <p>你的关系核心情绪需求（偏 {jung.stack.dom}）：</p>
            <ul>
              {romance.emotionalNeedsZh.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="methodCell" style={{ marginTop: 10 }}>
              <strong>高摩擦预警（提前知道，少走弯路）</strong>
              <ul className="methodList">
                {romance.frictionMatches.map((x) => (
                  <li key={`friction_${x.type}`}>
                    <strong>{x.type}</strong>：{x.triggerZh}
                    <br />
                    修复动作：{x.repairZh}
                  </li>
                ))}
              </ul>
            </div>
            <div className="methodCell" style={{ marginTop: 10 }}>
              <strong>可直接分享的一句话</strong>
              <span>{romance.shareLineZh}</span>
            </div>
            {deepUnlocked ? (
              <div className="methodCell" style={{ marginTop: 10 }}>
                <strong>深度关系推进建议（解锁）</strong>
                <ul className="methodList">
                  {romance.secureMatches.map((x) => (
                    <li key={`sweet_${x.type}`}>
                      与 {x.type} 相处：{x.sweetActionZh}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 8 }}>
                深度版会把“暧昧推进-冲突修复-关系复盘”做成具体对话脚本（按你的功能栈定制）。
              </p>
            )}
          </div>
        </section>

        <section className="section grid2">
          <div className="card sideCard">
            <h3>免费版核心解读（已包含）</h3>
            <p>
              你的高频功能是 <strong>{top2[0]}</strong> 与 <strong>{top2[1]}</strong>，低频功能相对集中在{" "}
              <strong>{low2[0]}</strong> 与 <strong>{low2[1]}</strong>。这代表你在处理信息与做决策时有明显偏好路径。
            </p>
            <ul>
              <li>{funcLabel(top2[0])}：{FUNCTION_REALITY_HINTS[top2[0]].strength}</li>
              <li>{funcLabel(top2[1])}：{FUNCTION_REALITY_HINTS[top2[1]].strength}</li>
              <li>{funcLabel(low2[1])}：{FUNCTION_REALITY_HINTS[low2[1]].risk}</li>
            </ul>
          </div>
          <div className="card sideCard">
            <h3>免费行动建议（先用起来）</h3>
            <ul>
              <li>{FUNCTION_REALITY_HINTS[top2[0]].advice}</li>
              <li>{FUNCTION_REALITY_HINTS[top2[1]].advice}</li>
              <li>针对 {low2[1]}：{FUNCTION_REALITY_HINTS[low2[1]].advice}</li>
            </ul>
            <p className="muted" style={{ marginTop: 8 }}>
              你已经拿到可直接使用的结果。付费部分是进一步的逐维现实映射与证据链，不影响免费报告可用性。
            </p>
          </div>
        </section>

        <section className="section grid2">
          <UnlockPanel assessmentId={assessmentId} unlocked={deepUnlocked} skuId={sku.id} priceLabel={priceLabel} />

          {!deepUnlocked ? (
            <div className="card lockCard animIn stagger3" aria-hidden>
              <div className="lockInner">
                <div className="lockTitle">Deep Report (Locked)</div>
                <p className="lockText">
                  你已经拿到完整免费报告。升级后新增“逐维现实映射 + 关键题证据链 + 个性化策略”，用于更深层自我分析。
                </p>
                <div className="compareGrid" style={{ marginTop: 12 }}>
                  <div className="compareCell">
                    <h4>免费已包含</h4>
                    <ul>
                      <li>类型与功能栈</li>
                      <li>八维强度条</li>
                      <li>置信度与质量提示</li>
                      <li>核心解读与行动建议</li>
                    </ul>
                  </div>
                  <div className="compareCell">
                    <h4>付费新增</h4>
                    <ul>
                      <li>每个功能的现实场景映射</li>
                      <li>盲点与补偿路径</li>
                      <li>关键题目证据链</li>
                      <li>社交/亲密/协作三类互动脚本</li>
                    </ul>
                  </div>
                </div>
                <div className="barList" style={{ marginTop: 12 }}>
                  {(Object.keys(scores.functions) as FunctionId[]).map((id) => (
                    <div className="barRow" key={id}>
                      <div title={JUNG_FUNCTIONS_META[id].briefZh}>{id}</div>
                      <div className="barTrack">
                        <div className="barFill" style={{ width: `${scores.functions[id]}%` }} />
                      </div>
                      <div className="muted">{scores.functions[id]}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card sideCard animIn stagger3">
              <h3>如何读这份报告</h3>
              <p>
                先看 <strong>{jung.stack.dom}</strong>（主导）和 <strong>{jung.stack.aux}</strong>（辅助）: 它们是你最自然的“看世界/做判断”路径。
                <br />
                再看 <strong>{jung.stack.inf}</strong>（劣势）: 压力下更容易以它的方式补偿或失控。
              </p>
              <p className="muted" style={{ marginTop: 8 }}>
                提示: 功能强度反映偏好, 不等于能力。强度低也可能是“少用但能用”。
              </p>
            </div>
          )}
        </section>

        {deepUnlocked && report ? (
          <section className="section animIn stagger4">
            <div className="card sideCard">
              <h3>{report.headlineZh}</h3>
              <p>{report.summaryZh}</p>
              <p className="muted" style={{ marginTop: 8 }}>
                {report.stackLineZh}
                <br />
                {report.domAuxLineZh}
              </p>
            </div>

            <div className="card sideCard" style={{ marginTop: 14 }}>
              <h3>层级判定与升阶路径</h3>
              <p>
                当前层级: <strong>{report.levelCard.currentZh}</strong>
                <br />
                {report.levelCard.targetZh}
              </p>
              <p className="muted" style={{ marginTop: 10, marginBottom: 6 }}>
                判定依据:
              </p>
              <ul>
                {report.levelCard.diagnosisZh.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="muted" style={{ marginTop: 10, marginBottom: 6 }}>
                升阶建议:
              </p>
              <ul>
                {report.levelCard.upgradePlanZh.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="grid2" style={{ marginTop: 14 }}>
              <div className="card sideCard">
                <h3>优势画像</h3>
                <ul>
                  {report.strengthsZh.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card sideCard">
                <h3>风险与盲点</h3>
                <ul>
                  {report.risksZh.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card sideCard" style={{ marginTop: 14 }}>
              <h3>社会互动脚本（付费深度）</h3>
              <ul>
                {report.socialScriptsZh.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="grid2" style={{ marginTop: 14 }}>
              {report.functions.map((s) => (
                <div className="card sideCard" key={s.func}>
                  <h3>{s.titleZh}</h3>
                  <p className="muted" style={{ marginTop: 6 }}>
                    {s.taglineZh}
                  </p>
                  <ul>
                    {s.realityZh.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="muted" style={{ marginTop: 10, marginBottom: 6 }}>
                    可能的盲点:
                  </p>
                  <ul>
                    {s.blindSpotZh.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  {s.evidence.length > 0 ? (
                    <>
                      <p className="muted" style={{ marginTop: 10, marginBottom: 6 }}>
                        证据（你的关键选择）:
                      </p>
                      <ul>
                        {s.evidence.map((e) => (
                          <li key={`${e.questionId}_${e.chosen.id}`}>
                            {e.prompt} → <strong>{e.chosen.title}</strong>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="card sideCard" style={{ marginTop: 14 }}>
              <h3>注释与依据</h3>
              <ul>
                {report.notesZh.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
    );
  }

  // Legacy V1 (Big Five -> MBTI-style). Keep for backward compatibility.
  const scores = row.scoresJson as unknown as ScorePackV1;
  const mbti = row.mbtiJson as unknown as MbtiResult;
  const report = deepUnlocked ? buildDeepReport({ scores, mbti, quality }) : null;

  return (
    <main className="resultLayout">
      <section className="card resultTop animIn stagger2">
        <p className="kicker">Result</p>
        <div className="typeBig">{mbti.type}</div>
        <div className="typeMeta">
          <div className="pill">类型置信度: {pct(mbti.confidence)}</div>
          <div className="pill">
            作答质量: {Math.round(quality.quality)} / 100
          </div>
          {bypass ? <div className="pill">DEV_BYPASS_PAYWALL=1</div> : null}
        </div>

        <div className="barList" aria-label="dimensions">
          {mbti.dimensions.map((d) => {
            const rightPct = Math.round(d.pRight * 100);
            const leftPct = 100 - rightPct;
            const label =
              d.id === "EI"
                ? "E/I"
                : d.id === "NS"
                  ? "N/S"
                  : d.id === "FT"
                    ? "F/T"
                    : "J/P";
            const right = d.right;
            const left = d.left;
            return (
              <div className="barRow" key={d.id}>
                <div>
                  {label}{" "}
                  <span className="muted">
                    {d.pRight >= 0.5 ? right : left}
                  </span>
                </div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: `${rightPct}%` }} />
                </div>
                <div className="muted">
                  {d.pRight >= 0.5 ? `${rightPct}%` : `${leftPct}%`}
                </div>
              </div>
            );
          })}
        </div>

        {quality.warnings.length > 0 ? (
          <div className="toast" style={{ marginTop: 12 }}>
            {quality.warnings.join(" ")}
          </div>
        ) : null}
      </section>

      <section className="section grid2">
        <UnlockPanel
          assessmentId={assessmentId}
          unlocked={deepUnlocked}
          skuId={sku.id}
          priceLabel={priceLabel}
        />

        {!deepUnlocked ? (
          <div className="card lockCard animIn stagger3" aria-hidden>
            <div className="lockInner">
              <div className="lockTitle">Deep Report (Locked)</div>
              <p className="lockText">
                10 个 aspects、后缀（-A/-T）、类型清晰度（高/中/边界）与场景化建议。
              </p>
              <div className="barList" style={{ marginTop: 12 }}>
                {(Object.keys(scores.traits) as TraitId[]).map((t) => (
                  <div className="barRow" key={t}>
                    <div>{traitNameShort(t)}</div>
                    <div className="barTrack">
                      <div className="barFill" style={{ width: `${scores.traits[t]}%` }} />
                    </div>
                    <div className="muted">{scores.traits[t]}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card sideCard animIn stagger3">
            <h3>类型后缀与清晰度</h3>
            <p>
              后缀: <strong>{mbti.type}-{mbti.suffix.tag}</strong>（基于神经质 N 推导）
              <br />
              类型清晰度: <strong>{mbti.level}</strong>（由最不确定的一维决定）
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              -A/-T 不属于经典 MBTI, 这里用来表达“情绪稳定度倾向”的一个可解释标签。
            </p>
          </div>
        )}
      </section>

      {deepUnlocked && report ? (
        <section className="section animIn stagger4">
          <div className="card sideCard">
            <h3>{report.headlineZh}</h3>
            <p>{report.summaryZh}</p>
          </div>

          <div className="grid2" style={{ marginTop: 14 }}>
            <div className="card sideCard">
              <h3>五大维度</h3>
              <div className="barList" style={{ marginTop: 10 }}>
                {(Object.keys(scores.traits) as TraitId[]).map((t) => (
                  <div className="barRow" key={t}>
                    <div>{traitNameShort(t)}</div>
                    <div className="barTrack">
                      <div className="barFill" style={{ width: `${scores.traits[t]}%` }} />
                    </div>
                    <div className="muted">{scores.traits[t]}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card sideCard">
              <h3>你可能会如何表现</h3>
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, lineHeight: 1.6 }}>
                {report.traitReads.map((r) => `${r.titleZh}: ${r.textZh}`).join(" ")}
              </p>
            </div>
          </div>

          <div className="card sideCard" style={{ marginTop: 14 }}>
            <h3>10 个 Aspects</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              每个 aspect 由多道题聚合得到, 用于补充“同一类型里为什么差异很大”的细节。
            </p>
            <div className="barList" style={{ marginTop: 12 }}>
              {(Object.keys(scores.aspects) as AspectId[]).map((a) => (
                <div className="barRow" key={a}>
                  <div title={ASPECTS_V1[a].hintZh}>{ASPECTS_V1[a].nameZh}</div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${scores.aspects[a]}%` }} />
                  </div>
                  <div className="muted">{scores.aspects[a]}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid2" style={{ marginTop: 14 }}>
            {report.sections.map((s) => (
              <div className="card sideCard" key={s.titleZh}>
                <h3>{s.titleZh}</h3>
                <ul>
                  {s.bulletsZh.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="card sideCard" style={{ marginTop: 14 }}>
            <h3>注释与依据</h3>
            <ul>
              {report.notesZh.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
