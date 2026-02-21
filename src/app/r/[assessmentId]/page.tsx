import { notFound } from "next/navigation";

import { ASPECTS_V1, type AspectId, type TraitId } from "@/data/questions";
import { JUNG_FUNCTIONS_META, QUESTIONNAIRE_VERSION_V2, type FunctionId } from "@/data/jung";
import UnlockPanel from "./UnlockPanel";
import { isPaywallBypassed } from "@/lib/entitlements";
import type { MbtiResult } from "@/lib/mbti";
import { buildDeepReport } from "@/lib/report";
import { buildJungDeepReport } from "@/lib/reportJung";
import { SKUS } from "@/lib/sku";
import type { JungScorePackV2 } from "@/lib/jungScoring";
import type { JungTypeResultV2 } from "@/lib/jungType";
import type { QualityPack, ScorePackV1 } from "@/lib/scoring";
import { getActiveModules, getAssessment } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
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
  return pairs.map(([a, b]) => ({ a, b, av: scores[a], bv: scores[b] }));
}

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

    const report = deepUnlocked
      ? buildJungDeepReport({
          scores,
          typeResult: jung,
          quality,
          answers: (row.answersJson ?? null) as Record<string, unknown> | null,
        })
      : null;

    const stackLine = `${jung.stack.dom} → ${jung.stack.aux} → ${jung.stack.ter} → ${jung.stack.inf}`;
    const ranked = sortedFunctionIds(scores.functions);
    const top2 = ranked.slice(0, 2);
    const low2 = ranked.slice(-2);

    return (
      <main>
        <section className="card resultTop animIn stagger2">
          <p className="kicker">Result</p>
          <div className="typeBig">{jung.type}</div>
          <div className="typeMeta">
            <div className="pill">功能栈: {stackLine}</div>
            <div className="pill">类型置信度: {pct(jung.confidence)} / {jung.level}</div>
            <div className="pill">作答质量: {Math.round(quality.quality)} / 100</div>
            <div className="pill">免费报告已解锁</div>
            {bypass ? <div className="pill">DEV_BYPASS_PAYWALL=1</div> : null}
          </div>

          <div className="barList" aria-label="jung-function-pairs">
            {funcPairRows(scores.functions).map((p) => (
              <div className="barRow" key={`${p.a}_${p.b}`}>
                <div title={`${funcLabel(p.a)} vs ${funcLabel(p.b)}`}>
                  {p.a}/{p.b}
                </div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: `${p.av}%` }} />
                </div>
                <div className="muted">{p.av}%</div>
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
                      <li>更细颗粒建议与边界说明</li>
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
    <main>
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
