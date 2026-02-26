"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Provider = "alipay" | "wechat";

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
  const [provider, setProvider] = useState<Provider>("alipay");

  const payProvider = sp.get("pay_provider");
  const outTradeNo = sp.get("out_trade_no");
  const sessionId = sp.get("session_id");
  const shouldVerifyCnPay = useMemo(
    () => Boolean(outTradeNo) && (payProvider === "alipay" || payProvider === "wechat") && !props.unlocked,
    [outTradeNo, payProvider, props.unlocked],
  );
  const shouldVerifyStripe = useMemo(() => Boolean(sessionId) && !props.unlocked, [sessionId, props.unlocked]);

  useEffect(() => {
    if (!shouldVerifyCnPay || !outTradeNo || !payProvider) return;

    let cancelled = false;
    async function run() {
      setMsg("正在验证支付结果...");
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            assessmentId: props.assessmentId,
            provider: payProvider,
            outTradeNo,
          }),
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
  }, [shouldVerifyCnPay, outTradeNo, payProvider, props.assessmentId, router]);

  useEffect(() => {
    if (!shouldVerifyStripe) return;

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
  }, [shouldVerifyStripe, sessionId, props.assessmentId, router]);

  async function checkout() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assessmentId: props.assessmentId,
          skuId: props.skuId,
          provider,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { redirectUrl: string };
      window.location.href = data.redirectUrl;
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
        你现在看到的是完整免费结果。若希望更深入，一次性付费 {props.priceLabel} 可解锁八维逐维现实映射、关键题证据链，以及关系/协作中的互动脚本建议。
      </p>
      <div className="payMethodRow" style={{ marginTop: 12 }}>
        <button
          type="button"
          className={`payMethodBtn ${provider === "alipay" ? "payMethodBtnActive" : ""}`}
          onClick={() => setProvider("alipay")}
          disabled={busy}
        >
          支付宝
        </button>
        <button
          type="button"
          className={`payMethodBtn ${provider === "wechat" ? "payMethodBtnActive" : ""}`}
          onClick={() => setProvider("wechat")}
          disabled={busy}
        >
          微信支付
        </button>
      </div>
      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
        <li>免费已含：类型、功能栈、八维强度、置信度</li>
        <li>付费新增：每一维在工作/关系/压力中的具体表现</li>
        <li>付费新增：结论依据（你在关键题目的选择）</li>
        <li>付费新增：高阶/中阶/低阶升阶路径与社交误解修正动作</li>
      </ul>
      <p className="muted" style={{ marginTop: 8 }}>
        微信支付为 H5 拉起模式，推荐在手机浏览器中完成。
      </p>
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
