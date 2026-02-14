"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { QUESTIONS_V1, QUESTIONNAIRE_VERSION_V1, type Likert } from "@/data/questions";

const SCALE: Array<{ v: Likert; top: string; sub: string }> = [
  { v: 1, top: "非常不同意", sub: "几乎完全不符合" },
  { v: 2, top: "比较不同意", sub: "多数时候不符合" },
  { v: 3, top: "不确定", sub: "一半一半" },
  { v: 4, top: "比较同意", sub: "多数时候符合" },
  { v: 5, top: "非常同意", sub: "几乎完全符合" },
];

type AnswerState = Record<string, Likert | undefined>;

function findFirstUnanswered(answers: AnswerState) {
  for (let i = 0; i < QUESTIONS_V1.length; i++) {
    if (answers[QUESTIONS_V1[i].id] == null) return i;
  }
  return -1;
}

export default function TestPage() {
  const router = useRouter();
  const startedAtRef = useRef<number>(Date.now());

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const total = QUESTIONS_V1.length;
  const q = QUESTIONS_V1[idx];

  const answeredCount = useMemo(() => Object.values(answers).filter((v) => v != null).length, [answers]);
  const progressPct = Math.round((answeredCount / Math.max(1, total)) * 100);

  function setAnswer(v: Likert) {
    setAnswers((prev) => {
      const next = { ...prev, [q.id]: v };
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
          version: QUESTIONNAIRE_VERSION_V1,
          mode: "quick",
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
          第 {idx + 1} 题 / 共 {total} 题
        </div>
      </div>

      <div className="qText">{q.text}</div>

      <div className="scale" role="radiogroup" aria-label="likert">
        {SCALE.map((opt) => {
          const active = answers[q.id] === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              className={`opt ${active ? "optActive" : ""}`}
              onClick={() => setAnswer(opt.v)}
              aria-pressed={active}
            >
              <div className="optTop">{opt.top}</div>
              <div className="optSub">{opt.sub}</div>
            </button>
          );
        })}
      </div>

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
        提示: 按你最近 6-12 个月的真实状态作答。不要想“理想的我”。
      </div>
    </main>
  );
}

