"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  JUNG_QUESTIONS_V2,
  JUNG_FUNCTIONS_META,
  LIKERT_SCALE_ZH,
  QUESTIONNAIRE_VERSION_V2,
  type FunctionId,
  type JungQuestion,
} from "@/data/jung";
import { scoreAssessmentV2 } from "@/lib/jungScoring";
import { inferJungTypeV2 } from "@/lib/jungType";
import { SKUS } from "@/lib/sku";

type AnswerState = Record<string, string | undefined>;

function findFirstUnanswered(answers: AnswerState) {
  for (let i = 0; i < JUNG_QUESTIONS_V2.length; i++) {
    if (answers[JUNG_QUESTIONS_V2[i].id] == null) return i;
  }
  return -1;
}

function questionTypeZh(q: JungQuestion) {
  if (q.type === "likert") return "校准题";
  if (q.type === "forced") return "二选一";
  return "情境题";
}

function sortedFunctions(scores: Record<FunctionId, number>) {
  return (Object.keys(scores) as FunctionId[]).sort((a, b) => scores[b] - scores[a]);
}

function stageName(answered: number, total: number) {
  const p = answered / Math.max(1, total);
  if (p < 0.2) return "探索期";
  if (p < 0.5) return "成形期";
  if (p < 0.8) return "收敛期";
  return "稳定期";
}

function progressNudge(answered: number, total: number, liveType: string) {
  const left = Math.max(0, total - answered);
  if (answered < 8) return `再完成 ${8 - answered} 题，会出现第一版功能栈预估。`;
  if (answered < 24) return `你已进入“成形区间”，当前预估 ${liveType}。再做 ${Math.min(6, left)} 题，对偶轴会更清晰。`;
  if (answered < 48) return `中段是最容易放弃的阶段。你已完成 ${answered}/${total}，继续做完会显著提升置信度。`;
  if (left > 0) return `最后 ${left} 题是“稳定层”，会决定低/中/高阶判定。`;
  return "已完成全部题目，提交后查看完整报告。";
}

export default function TestPage() {
  const router = useRouter();
  const startedAtRef = useRef<number>(Date.now());

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const total = JUNG_QUESTIONS_V2.length;
  const q = JUNG_QUESTIONS_V2[idx];
  const sku = SKUS.deep_report_v1;
  const priceLabel = sku.currency === "usd" ? `$${(sku.unitAmount / 100).toFixed(2)}` : `¥${(sku.unitAmount / 100).toFixed(2)}`;

  const answeredCount = useMemo(() => Object.values(answers).filter((v) => v != null).length, [answers]);
  const progressPct = Math.round((answeredCount / Math.max(1, total)) * 100);
  const livePreview = useMemo(() => {
    if (answeredCount < 8) return null;
    const computed = scoreAssessmentV2({
      version: QUESTIONNAIRE_VERSION_V2,
      answers,
    });
    const type = inferJungTypeV2(computed.scores.functions);
    const ranking = sortedFunctions(computed.scores.functions);
    return {
      type: type.type,
      confidence: type.confidence,
      stackLine: `${type.stack.dom} → ${type.stack.aux} → ${type.stack.ter} → ${type.stack.inf}`,
      top4: ranking.slice(0, 4).map((id) => ({
        id,
        score: computed.scores.functions[id],
      })),
    };
  }, [answers, answeredCount]);
  const liveType = livePreview?.type ?? "待形成";
  const nudge = useMemo(() => progressNudge(answeredCount, total, liveType), [answeredCount, total, liveType]);

  function setAnswer(optionId: string) {
    setAnswers((prev) => {
      const next = { ...prev, [q.id]: optionId };
      return next;
    });
    setToast(null);

    // Small auto-advance to keep flow.
    window.setTimeout(() => {
      if (idx < total - 1) setIdx((x) => Math.min(total - 1, x + 1));
    }, 160);
  }

  async function submit() {
    const firstMissing = findFirstUnanswered(answers);
    if (firstMissing !== -1) {
      setIdx(firstMissing);
      setToast("还有题目没答完, 我带你跳到第一道空题。");
      return;
    }

    const durationMs = Math.max(0, Date.now() - startedAtRef.current);
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: QUESTIONNAIRE_VERSION_V2,
          mode: "full",
          durationMs,
          answers,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { assessmentId: string };
      router.push(`/r/${data.assessmentId}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "提交失败, 请稍后重试。");
      setBusy(false);
    }
  }

  return (
    <main className="card testWrap animIn stagger2">
      <section className="billingNotice" aria-label="billing-clarity">
        <div className="billingTitle">计费说明（先看再做）</div>
        <div className="billingGrid">
          <div className="billingCell">
            <strong>免费即可获得</strong>
            <span>16-type + 功能栈 + 八维强度 + 站内占比/全国基线对比 + 社会化基础解读</span>
          </div>
          <div className="billingCell">
            <strong>可选付费 {priceLabel}</strong>
            <span>解锁逐维现实映射、互动脚本、证据链与升阶建议（非必买）</span>
          </div>
        </div>
      </section>

      <div className="testHeader">
        <div className="progressBar" aria-label="progress">
          <div className="progressFill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="qMeta">
          <div>
            进度: {answeredCount}/{total}（{progressPct}%）
          </div>
          <div>
            第 {idx + 1} 题 / 共 {total} 题 · {questionTypeZh(q)}
          </div>
        </div>
      </div>

      <section className="liveInsight" aria-label="live-insight">
        <div className="liveHead">
          <strong>实时洞察（进行中）</strong>
          <span>
            {stageName(answeredCount, total)} · {progressPct}%
          </span>
        </div>
        <p className="liveNudge">{nudge}</p>
        {livePreview ? (
          <>
            <p className="liveMeta">
              当前预估类型: <strong>{livePreview.type}</strong>（暂定置信度 {Math.round(livePreview.confidence * 100)}%）
              <br />
              当前预估功能栈: <strong>{livePreview.stackLine}</strong>
            </p>
            <div className="liveBars">
              {livePreview.top4.map((x) => (
                <div className="liveBarRow" key={x.id}>
                  <div className="liveBarLabel">
                    {x.id} · {JUNG_FUNCTIONS_META[x.id].nameZh}
                  </div>
                  <div className="liveBarTrack">
                    <div className="liveBarFill" style={{ width: `${x.score}%` }} />
                  </div>
                  <div className="liveBarValue">{x.score}%</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 6 }}>
            先完成至少 8 题，我们再给你第一版动态功能栈。
          </p>
        )}
        <p className="muted" style={{ marginTop: 8 }}>
          说明：这是过程预估，用来提升参与感与好奇心；最终结果以提交后完整评分为准。
        </p>
      </section>

      <div className="qText">{q.prompt}</div>

      {q.type === "likert" ? (
        <div className="scale" role="radiogroup" aria-label="likert" data-n={5}>
          {LIKERT_SCALE_ZH.map((opt) => {
            const active = answers[q.id] === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`opt ${active ? "optActive" : ""}`}
                onClick={() => setAnswer(opt.id)}
                aria-pressed={active}
              >
                <div className="optTop">{opt.top}</div>
                <div className="optSub">{opt.sub}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className="scale"
          role="radiogroup"
          aria-label="choices"
          data-n={q.options.length}
        >
          {q.options.map((opt) => {
            const active = answers[q.id] === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`opt ${active ? "optActive" : ""}`}
                onClick={() => setAnswer(opt.id)}
                aria-pressed={active}
              >
                <div className="optTop">{opt.title}</div>
                <div className="optSub">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="navRow">
        <button
          type="button"
          className="btn"
          onClick={() => setIdx((x) => Math.max(0, x - 1))}
          disabled={idx === 0 || busy}
        >
          ← 上一题
        </button>
        {idx < total - 1 ? (
          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => {
              if (answers[q.id] == null) setToast("先选一个选项再继续。");
              else setIdx((x) => Math.min(total - 1, x + 1));
            }}
            disabled={busy}
          >
            下一题 →
          </button>
        ) : (
          <button type="button" className="btn btnDanger" onClick={submit} disabled={busy}>
            {busy ? "生成结果中..." : "提交并生成结果"}
          </button>
        )}
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
      <div className="toast muted">
        提示: 按你最近 6-12 个月的真实状态作答。情境题优先选“更自然”的那一项。提交后会先展示免费报告，不会先扣费。
      </div>
    </main>
  );
}
