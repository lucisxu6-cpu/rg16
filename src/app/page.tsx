import Link from "next/link";
import { SKUS } from "@/lib/sku";

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
  const sku = SKUS.deep_report_v1;
  const priceLabel = sku.currency === "usd" ? `$${(sku.unitAmount / 100).toFixed(2)}` : `¥${(sku.unitAmount / 100).toFixed(2)}`;

  return (
    <main className="landing">
      <section className="card hero heroV2 animIn stagger2">
        <div className="heroMain">
          <div className="heroCopy">
            <p className="kicker">RG16 / Jung 8 Functions</p>
            <h1 className="hTitle">
              <span>不只 4 个字母标签。</span>
              <br />
              <span>看清你在人群中的位置。</span>
            </h1>
            <p className="lead">
              你会拿到三层结果: 你的荣格八维功能路径、你在站内样本中的类型占比、以及你在关系/协作中的常见被感知方式。
              免费版先给完整核心结果，付费版再深入到逐维证据与升阶策略。
            </p>

            <div className="chips" aria-label="highlights">
              <div className="chip">
                <strong>64 题混合模型</strong> 情境题 + 二选一 + 量表校准
              </div>
              <div className="chip">
                <strong>免费结果</strong> 八维强度 + 主辅功能 + 人群占比
              </div>
              <div className="chip">
                <strong>过程反馈</strong> 做题中实时预估功能栈，减少中途放弃
              </div>
              <div className="chip">
                <strong>付费深度</strong> 互动脚本 + 证据链 + 升阶路径
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

          <div className="heroFocal" aria-hidden>
            <div className="focalRing">
              <div className="focalCore">
                <p>RG16</p>
                <strong>人格认知镜像</strong>
                <span>Function-First</span>
              </div>
            </div>
            <div className="focalTags">
              <i>八维功能</i>
              <i>人群对比</i>
              <i>互动脚本</i>
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
              <li>答题中实时显示“当前预估类型”</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section pricingMatrix animIn stagger3">
        <div className="card pricingIntro">
          <p className="kicker">Pricing Clarity</p>
          <h3>先说清楚：做完题一定有免费结果，付费是可选升级</h3>
          <p>
            你提交后会立刻看到完整免费报告（八维强度 + 主辅功能 + 类型置信度 + 人群占比 + 基础解读），
            不需要先付款。付费只在你想看更深层现实映射时再决定。
          </p>
        </div>
        <div className="planGrid" aria-label="free-vs-paid">
          <article className="card planCard">
            <div className="planHead">
              <p>免费版</p>
              <strong>¥0</strong>
            </div>
            <ul className="planList">
              <li>16-type 标签（由功能栈推导）</li>
              <li>主导/辅助/第三/劣势功能栈</li>
              <li>八维强度条（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）</li>
              <li>类型置信度 + 作答质量提示</li>
              <li>站内占比 + 全国基线（非站内）对比</li>
              <li>免费核心解读（优势、风险、行动建议）</li>
            </ul>
          </article>
          <article className="card planCard planCardPro">
            <div className="planHead">
              <p>深度版</p>
              <strong>{priceLabel}</strong>
            </div>
            <ul className="planList">
              <li>八维逐维现实映射（工作/关系/压力）</li>
              <li>每个维度的盲点与补偿路径</li>
              <li>关键题目证据链（结论可追溯）</li>
              <li>类型层级（高阶/中阶/低阶）进阶解读</li>
              <li>关系与协作中的误解修正脚本</li>
            </ul>
          </article>
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
            报告不是抽象结论, 而是把每个功能映射到真实社交情境:
            你在团队里如何被感知、冲突时为何容易误解、压力下会怎样补偿。
            同时给出关键题证据，让“像不像你”有依据可追溯。
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
