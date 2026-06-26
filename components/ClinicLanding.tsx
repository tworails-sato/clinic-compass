"use client";

type Props = { onStart: () => void };

const concerns = [
  "院長に診療、経営判断、スタッフ対応が集中している",
  "スタッフの採用・定着に課題があり、離職が気になる",
  "売上は安定しているが、利益や資金繰りに不安がある",
  "予約、受付、会計などの業務に非効率を感じている",
  "事務長や現場リーダーに任せたいが、うまく任せられていない",
  "経営改善の必要性は感じるが、何から始めるべきか分からない",
];

const themes = [
  ["診療方針・患者市場", "診療方針、地域の患者ニーズ、診療構成、集患・地域連携を確認します。"],
  ["収益・診療オペレーション", "収益性、予約・患者導線、待ち時間、請求管理など、医院運営の土台を確認します。"],
  ["医療品質・リスク管理", "患者体験、医療安全、労務・情報管理、緊急対応などのリスクを確認します。"],
  ["人・経営体制", "採用・定着、育成、役割分担、権限移譲、改善活動の進め方を確認します。"],
];

const previewScores = [
  ["診療方針", "4.0"],
  ["収益・業務", "3.1"],
  ["人材・組織", "2.7"],
];

export function ClinicLanding({ onStart }: Props) {
  return (
    <main className="landing-new">
      <section className="lp-hero lp-hero-new">
        <div className="lp-hero-layout">
          <div className="lp-inner">
            <p className="eyebrow">FOR CLINIC DIRECTORS</p>
            <p className="hero-label">院長のための医院経営アセスメント</p>
            <h1>
              診療に追われる院長のための、
              <em>医院経営アセスメント</em>
            </h1>
            <p className="hero-copy">
              院長コンパスは、医院経営を16テーマから可視化し、採用・定着、収益、業務効率、役割分担など、
              今取り組むべき課題の優先順位を整理するアセスメントです。
            </p>
            <div className="hero-points">
              <span>16テーマで医院経営を俯瞰</span>
              <span>優先順位が分かる</span>
              <span>抱え込みから役割分担へ</span>
            </div>
            <button className="button cta-yellow" onClick={onStart}>
              無料で診断をはじめる
              <span>→</span>
            </button>
          </div>

          <aside className="diagnosis-preview" aria-label="診断画面のプレビュー">
            <div className="preview-header">
              <span>診断結果プレビュー</span>
              <b>院長コンパス</b>
            </div>
            <div className="preview-score">
              <p>総合スコア</p>
              <strong>3.4</strong>
              <small>/ 5.0</small>
            </div>
            <div className="preview-radar" aria-hidden="true">
              <svg viewBox="0 0 160 160">
                <polygon points="80,18 136,52 124,124 80,146 36,124 24,52" />
                <polygon points="80,38 118,60 110,112 80,129 49,111 44,62" />
                <polygon className="preview-radar-area" points="80,32 112,66 98,104 80,121 55,109 39,66" />
              </svg>
            </div>
            <div className="preview-bars">
              {previewScores.map(([label, score]) => (
                <div key={label}>
                  <span>{label}</span>
                  <i>
                    <b style={{ width: `${Number(score) * 20}%` }} />
                  </i>
                  <strong>{score}</strong>
                </div>
              ))}
            </div>
            <div className="preview-priority">
              <small>優先確認テーマ</small>
              <p>人材・組織 ／ 収益・業務設計</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="problem-section" id="about">
        <div className="narrow-lp">
          <p className="eyebrow teal">WHY NOW</p>
          <h2>
            診療は回っている。
            <br />
            でも、医院経営は見えていますか？
          </h2>
          <p>
            院長が日々の診療に追われるほど、採用・定着、収益、業務効率、患者対応、権限移譲といった経営課題は後回しになりがちです。
            院長コンパスは、見えにくくなった課題を責めるためではなく、現状を整理し、改善に向けた対話の入口をつくるための診断です。
          </p>
        </div>
      </section>

      <section className="lp-section soft">
        <div className="narrow-lp">
          <p className="eyebrow teal">FOR YOU</p>
          <h2>こんな院長におすすめです</h2>
          <div className="concern-grid">
            {concerns.map((item) => (
              <article key={item}>
                <span>✓</span>
                {item}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="narrow-lp">
          <p className="eyebrow teal">WHAT YOU CAN SEE</p>
          <h2>16テーマで、医院経営の現在地を見える化</h2>
          <p className="section-lead">
            診療、組織、収益、運営を横断して整理することで、医院の強みと改善テーマ、そして院長以外へ任せるべき領域を確認できます。
          </p>
          <div className="see-grid">
            <article>
              <b>01</b>
              <h3>医院経営の強みと弱み</h3>
              <p>医院全体の状態を、テーマごとのスコアで確認します。</p>
            </article>
            <article>
              <b>02</b>
              <h3>優先して取り組む課題</h3>
              <p>採用・定着、収益、診療効率などの優先順位を整理します。</p>
            </article>
            <article>
              <b>03</b>
              <h3>任せるべき領域</h3>
              <p>院長に集中している業務や判断を、役割分担の視点で見直します。</p>
            </article>
            <article>
              <b>04</b>
              <h3>次のアクション</h3>
              <p>現場リーダー育成や経営改善に向けた、具体的な一歩を考えます。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="themes-section">
        <div className="narrow-lp">
          <p className="eyebrow">16 THEMES</p>
          <h2>医院経営を、4つの領域から俯瞰します</h2>
          <div className="themes-grid">
            {themes.map(([title, text], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section soft">
        <div className="narrow-lp">
          <p className="eyebrow teal">USE CASES</p>
          <h2>期待できる活用シーン</h2>
          <div className="uses">
            <span>経営改善の優先順位整理</span>
            <span>事務長・現場リーダーとの役割分担</span>
            <span>スタッフ採用・定着施策の見直し</span>
            <span>診療効率・患者導線の改善</span>
            <span>分院展開・拡大前の経営体制チェック</span>
            <span>専門家へ相談する前の課題整理</span>
          </div>
        </div>
      </section>

      <section className="journey" id="flow">
        <div className="narrow-lp">
          <p className="eyebrow">FROM ASSESSMENT TO ACTION</p>
          <h2>
            診断して終わりではなく、
            <br />
            改善の一歩まで整理します
          </h2>
          <ol>
            <li>
              <b>01</b>
              <span>
                診断案内
                <br />
                <small>目的と進め方を確認</small>
              </span>
            </li>
            <li>
              <b>02</b>
              <span>
                WEB診断の実施
                <br />
                <small>現在地を可視化</small>
              </span>
            </li>
            <li>
              <b>03</b>
              <span>
                診断結果の確認
                <br />
                <small>テーマ別結果を読む</small>
              </span>
            </li>
            <li>
              <b>04</b>
              <span>
                フィードバック
                <br />
                <small>状況を具体化する</small>
              </span>
            </li>
            <li>
              <b>05</b>
              <span>
                優先課題の整理
                <br />
                <small>次の一歩を決める</small>
              </span>
            </li>
            <li>
              <b>06</b>
              <span>
                必要な支援の検討
                <br />
                <small>商談・支援開始へ</small>
              </span>
            </li>
          </ol>
          <button className="button cta-yellow" onClick={onStart}>
            まずは現在地を確認する →
          </button>
        </div>
      </section>
    </main>
  );
}
