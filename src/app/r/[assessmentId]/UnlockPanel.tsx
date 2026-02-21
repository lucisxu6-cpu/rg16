"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  assessmentId: string;
  unlocked: boolean;
  skuId: string;
  priceLabel: string;
};

export default function UnlockPanel(props: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sessionId = sp.get("session_id");
  const shouldVerify = useMemo(() => Boolean(sessionId) && !props.unlocked, [sessionId, props.unlocked]);

  useEffect(() => {
    if (!shouldVerify) return;

    let cancelled = false;
    async function run() {
      setMsg("正在验证支付结果...");
      try {
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ assessmentId: props.assessmentId, sessionId }),
        });
        if (!res.ok) throw new Error(await res.text());
        if (!cancelled) {
          setMsg("验证成功, 已解锁深度报告。");
          router.refresh();
        }
      } catch (e) {
        if (!cancelled) setMsg(e instanceof Error ? e.message : "验证失败, 请稍后重试。");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [shouldVerify, sessionId, props.assessmentId, router]);

  async function checkout() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assessmentId: props.assessmentId, skuId: props.skuId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch (e) {
      setBusy(false);
      setMsg(e instanceof Error ? e.message : "创建支付失败。");
    }
  }

  if (props.unlocked) {
    return (
      <div className="card sideCard animIn stagger3">
        <h3>深度报告已解锁</h3>
        <p>你可以随时回到这个链接查看（无登录）。免费结果也会保留，不会被覆盖。</p>
      </div>
    );
  }

  return (
    <div className="card sideCard animIn stagger3">
      <h3>可选升级：解锁深度报告</h3>
      <p>
        你现在看到的是完整免费结果。若希望更深入，一次性付费 {props.priceLabel} 可解锁八维逐维现实映射、关键题证据链与更细行动建议。
      </p>
      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
        <li>免费已含：类型、功能栈、八维强度、置信度</li>
        <li>付费新增：每一维在工作/关系/压力中的具体表现</li>
        <li>付费新增：结论依据（你在关键题目的选择）</li>
      </ul>
      <div className="ctaRow" style={{ marginTop: 12 }}>
        <button type="button" className="btn btnDanger" onClick={checkout} disabled={busy}>
          {busy ? "跳转中..." : "去支付并解锁"}
          <span aria-hidden>→</span>
        </button>
      </div>
      {msg ? <div className="toast">{msg}</div> : null}
    </div>
  );
}
