"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { JUNG_QUESTIONS_V2, LIKERT_SCALE_ZH, QUESTIONNAIRE_VERSION_V2, type JungQuestion } from "@/data/jung";

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

export default function TestPage() {
  const router = useRouter();
  const startedAtRef = useRef<number>(Date.now());

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const total = JUNG_QUESTIONS_V2.length;
  const q = JUNG_QUESTIONS_V2[idx];

  const answeredCount = useMemo(() => Object.values(answers).filter((v) => v != null).length, [answers]);
  const progressPct = Math.round((answeredCount / Math.max(1, total)) * 100);

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
        提示: 按你最近 6-12 个月的真实状态作答。情境题优先选“更自然”的那一项。
      </div>
    </main>
  );
}
