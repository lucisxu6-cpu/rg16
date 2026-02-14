import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="card hero animIn stagger2">
        <div className="heroGrid">
          <div>
            <p className="kicker">RG16 / Jung v2</p>
            <h1 className="hTitle">
              <span>用荣格八维做题</span>
              <br />
              <span>推断功能栈与 16-type</span>
            </h1>
            <p className="lead">
              你会得到八维（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）强度、主辅功能栈, 以及由功能栈推导的 4 字母标签。
              深度报告（一次性付费）会把八维逐一映射到你的现实: 工作/关系/压力下的典型反应, 盲点与补偿路径, 并附上你的关键选择作为证据链。
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
              3) 二选一优先选“更自然的那一边”, 情境题优先选“你更常用的路径”。
            </p>
          </aside>
        </div>
      </section>

      <section className="section grid2 animIn stagger3" id="science">
        <div className="card sideCard">
          <h3>科学性来自哪里</h3>
          <p>
            我们围绕八维认知功能设计了三类题目: 校准题（5 点量表）用来校正作答风格,
            情境题让功能落到真实决策路径, 二选一用来拉开功能对比。输出包含置信度与作答质量提示, 避免“黑箱断言”。
          </p>
        </div>
        <div className="card sideCard">
          <h3>为什么不止 4 个字母</h3>
          <p>
            4 字母更像标签, 容易“对号入座”。我们用八维来描述你如何获取信息、如何做判断,
            并把每一维落到现实可感知的行为线索上。你看到的不只是结论, 还有依据与边界。
          </p>
        </div>
      </section>
    </main>
  );
}
