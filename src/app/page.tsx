import Link from "next/link";

const FUNCTION_PRIMER = [
  { id: "Se", title: "外倾感觉 Se", text: "关注当下现实与即时反馈，反应快、落地快。" },
  { id: "Si", title: "内倾感觉 Si", text: "依赖经验库与稳定框架，强调可复用与可验证。" },
  { id: "Ne", title: "外倾直觉 Ne", text: "擅长发散联想，看见可能性与替代路径。" },
  { id: "Ni", title: "内倾直觉 Ni", text: "倾向洞察底层趋势，先看到方向再找证据。" },
  { id: "Te", title: "外倾思维 Te", text: "以效率与结果为先，偏好结构化决策与执行。" },
  { id: "Ti", title: "内倾思维 Ti", text: "追求逻辑一致与模型完整，先想清再行动。" },
  { id: "Fe", title: "外倾情感 Fe", text: "敏感群体氛围，善于协调关系与共识。" },
  { id: "Fi", title: "内倾情感 Fi", text: "重视个人价值与真诚，倾向忠于内在标准。" },
];

export default function HomePage() {
  return (
    <main className="landing">
      <section className="card hero heroV2 animIn stagger2">
        <div className="heroMain">
          <div className="heroCopy">
            <p className="kicker">RG16 / Jung 8 Functions</p>
            <h1 className="hTitle">
              <span>第一次接触 MBTI？</span>
              <br />
              <span>先看你的荣格八维。</span>
            </h1>
            <p className="lead">
              我们不只给你 4 个字母标签, 而是给出你如何感知世界、如何做判断的“功能路径”。
              免费可看八维强度 + 主辅功能 + 16-type 标签, 深度报告再把每一维映射到工作、关系与压力场景。
            </p>

            <div className="chips" aria-label="highlights">
              <div className="chip">
                <strong>64 题混合模型</strong> 情境题 + 二选一 + 量表校准
              </div>
              <div className="chip">
                <strong>免费结果</strong> 八维强度 + 主辅功能 + 16-type
              </div>
              <div className="chip">
                <strong>付费深度</strong> 现实映射 + 证据链 + 盲点提示
              </div>
            </div>

            <div className="ctaRow">
              <Link className="btn btnPrimary" href="/test">
                立即开始测评
                <span aria-hidden>→</span>
              </Link>
              <Link className="btn" href="/#science">
                先看方法依据
                <span aria-hidden>↓</span>
              </Link>
            </div>
          </div>

          <aside className="heroPanel">
            <p className="panelKicker">认知罗盘</p>
            <h3>你会拿到什么</h3>
            <div className="miniBars" aria-label="eight-functions-preview">
              <div className="miniBar">
                <span>感知轴 Se/Si</span>
                <i />
              </div>
              <div className="miniBar">
                <span>直觉轴 Ne/Ni</span>
                <i />
              </div>
              <div className="miniBar">
                <span>思维轴 Te/Ti</span>
                <i />
              </div>
              <div className="miniBar">
                <span>情感轴 Fe/Fi</span>
                <i />
              </div>
            </div>
            <ul>
              <li>预计 10-15 分钟完成</li>
              <li>无需注册, 结果链接自动生成</li>
              <li>包含作答质量与置信度提示</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section newcomerGrid animIn stagger3">
        <div className="card sideCard">
          <h3>新手 3 步读懂结果</h3>
          <ol className="stepList">
            <li>先看主导/辅助功能: 这是你最自然的处理世界方式。</li>
            <li>再看八维条形图: 识别你“常用功能”和“低频功能”。</li>
            <li>最后看 4 字母: 它是功能栈推导出的标签, 不是终点。</li>
          </ol>
        </div>
        <div className="card sideCard">
          <h3>为什么更容易“说到心里”</h3>
          <p>
            报告不是抽象结论, 而是把每个功能映射到真实场景:
            你在团队里如何决策、冲突时如何反应、压力大时会怎样补偿。
            你还能看到触发这些判断的关键题目, 结论可追溯。
          </p>
        </div>
      </section>

      <section className="section grid2" id="science">
        <div className="card sideCard">
          <h3>科学设计</h3>
          <p>
            我们采用混合题型而非单一路径: 量表题用于校准作答风格, 情境题把偏好落到行为,
            二选一拉开功能差异。最后用功能配对差异 + 栈匹配得分给出类型与置信度。
          </p>
        </div>
        <div className="card sideCard">
          <h3>边界透明</h3>
          <p>
            我们会展示作答质量、边界类型提示和证据链, 明确“结论来自哪里、哪里还不确定”。
            这比只给一个 4 字母标签更诚实, 也更适合长期自我认知。
          </p>
        </div>
      </section>

      <section className="section">
        <div className="card primerCard animIn stagger4" id="primer">
          <div className="primerHead">
            <p className="kicker">Function Primer</p>
            <h3>八维速览: 看世界与做判断的 8 种路径</h3>
          </div>
          <div className="primerGrid">
            {FUNCTION_PRIMER.map((item) => (
              <article className="primerItem" key={item.id}>
                <div className="primerId">{item.id}</div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="ctaRow">
            <Link className="btn btnPrimary" href="/test">
              开始做题，生成我的功能栈
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
