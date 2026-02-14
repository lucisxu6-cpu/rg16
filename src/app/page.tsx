import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="card hero animIn stagger2">
        <div className="heroGrid">
          <div>
            <p className="kicker">RG16 / V1</p>
            <h1 className="hTitle">
              <span>用 Big Five 做题</span>
              <br />
              <span>推断 16-type</span>
            </h1>
            <p className="lead">
              你会得到一个 MBTI 风格的 4 字母类型, 以及每个维度的倾向强度与边界提示。
              深度报告（一次性付费）会基于同一份答案提供 10 个 aspects、后缀与更细的可解释结论。
            </p>

            <div className="chips" aria-label="highlights">
              <div className="chip">
                <strong>免费</strong> 输出 16-type
              </div>
              <div className="chip">
                <strong>一次性付费</strong> 解锁深度报告
              </div>
              <div className="chip">
                <strong>无登录</strong> 结果链接可回看
              </div>
            </div>

            <div className="ctaRow">
              <Link className="btn btnPrimary" href="/test">
                开始测评
                <span aria-hidden>→</span>
              </Link>
              <Link className="btn" href="/#science">
                我们如何计算
                <span aria-hidden>↓</span>
              </Link>
            </div>
          </div>

          <aside className="card sideCard">
            <h3>做题建议</h3>
            <p>
              1) 按你最近 6-12 个月的真实状态作答。
              <br />
              2) 不要想“理想的我”, 只选“更像我”的那一项。
              <br />
              3) 如果你卡在两边, 选“有点像/不太像”就够了。
            </p>
          </aside>
        </div>
      </section>

      <section className="section grid2 animIn stagger3" id="science">
        <div className="card sideCard">
          <h3>科学性来自哪里</h3>
          <p>
            我们先用题目测量 Big Five（五大人格）及其 10 个 aspects, 再将结果映射到
            16-type 的四个维度。你会看到每一步的阈值与置信度, 不做“黑箱断言”。
          </p>
        </div>
        <div className="card sideCard">
          <h3>为什么不是“纯 MBTI 题”</h3>
          <p>
            MBTI 更像类型语言, Big Five 更像可测量的连续维度。我们用 Big Five
            提升可解释性与一致性, 同时输出你想要的 16-type 结果（并标注不确定性）。
          </p>
        </div>
      </section>
    </main>
  );
}
