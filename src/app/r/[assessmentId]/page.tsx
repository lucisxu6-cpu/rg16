import { notFound } from "next/navigation";

import { ASPECTS_V1, type AspectId, type TraitId } from "@/data/questions";
import UnlockPanel from "./UnlockPanel";
import { isPaywallBypassed } from "@/lib/entitlements";
import type { MbtiResult } from "@/lib/mbti";
import { buildDeepReport } from "@/lib/report";
import { SKUS } from "@/lib/sku";
import type { QualityPack, ScorePackV1 } from "@/lib/scoring";
import { getActiveModules, getAssessment } from "@/lib/store";

export const runtime = "nodejs";

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

export default async function ResultPage({
  params,
}: {
  params: { assessmentId: string };
}) {
  const { assessmentId } = params;

  const row = await getAssessment(assessmentId);

  if (!row) notFound();

  const scores = row.scoresJson as unknown as ScorePackV1;
  const mbti = row.mbtiJson as unknown as MbtiResult;
  const quality = row.qualityJson as unknown as QualityPack;

  const bypass = isPaywallBypassed();
  const unlockedModules = await getActiveModules(assessmentId);
  const deepUnlocked = bypass || unlockedModules.has("deep_report");

  const sku = SKUS.deep_report_v1;
  const priceLabel =
    sku.currency === "usd"
      ? `$${(sku.unitAmount / 100).toFixed(2)}`
      : `¥${(sku.unitAmount / 100).toFixed(2)}`;

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
