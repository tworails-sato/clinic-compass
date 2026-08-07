const START_URL = "/start";

const typeChips = [
  "孤高の名医 オオカミ",
  "現場主義院長 シェパード",
  "改革ドクター ハヤブサ",
  "カリスマ院長 クジャク",
  "数字派院長 キツネ",
  "仕組み化院長 ビーバー",
  "任せ上手院長 ゴリラ",
  "堅実経営院長 カメ",
  "地域の顔 カピバラ",
];

const domainCards = [
  ["方", "方向性・患者市場", "診療方針、地域ニーズ、診療構成、集患・地域連携。"],
  ["収", "収益・数値", "収益性、コスト、資金繰りなど経営の数値面。"],
  ["業", "業務・診療オペレーション", "予約・受付・会計・待ち時間など運営の土台。"],
  ["質", "患者価値・医療品質", "患者体験、医療安全、品質と信頼の設計。"],
  ["人", "人材・組織", "採用・定着・育成、チームづくり。"],
  ["体", "経営体制・権限移譲", "役割分担、任せる仕組み、改善の進め方。"],
];

function RadarMock({ variant = "blue" }: { variant?: "blue" | "green" }) {
  const polygon =
    variant === "green"
      ? "100.0,24.9 145.2,53.9 135.2,100.3 100.0,126.4 72.4,96.0 60.8,57.4"
      : "100.0,26.6 134.2,60.3 131.1,98.0 100.0,121.8 52.3,107.5 57.3,55.3";
  const stroke = variant === "green" ? "#4B7A7C" : "#3C7D9B";
  const fill = variant === "green" ? "rgba(75,122,124,.18)" : "rgba(60,125,155,.20)";

  return (
    <div className="radar-ph">
      <span className="sample-tag">SAMPLE</span>
      <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g fill="none" stroke="#CBD8DC" strokeWidth="1">
          <polygon points="100.0,22.0 150.2,51.0 150.2,109.0 100.0,138.0 49.8,109.0 49.8,51.0" />
          <polygon points="100.0,46.0 129.4,63.0 129.4,97.0 100.0,114.0 70.6,97.0 70.6,63.0" />
        </g>
        <g stroke="#CBD8DC" strokeWidth="0.7">
          <line x1="100" y1="80" x2="100.0" y2="22.0" />
          <line x1="100" y1="80" x2="150.2" y2="51.0" />
          <line x1="100" y1="80" x2="150.2" y2="109.0" />
          <line x1="100" y1="80" x2="100.0" y2="138.0" />
          <line x1="100" y1="80" x2="49.8" y2="109.0" />
          <line x1="100" y1="80" x2="49.8" y2="51.0" />
        </g>
        <polygon points={polygon} fill={fill} stroke={stroke} strokeWidth="2" />
        <g fill="#6E7B84" fontSize="8" fontFamily="Noto Sans JP, sans-serif">
          <text x="100" y="14" textAnchor="middle">
            方向性
          </text>
          <text x="162" y="50" textAnchor="start">
            収益
          </text>
          <text x="162" y="115" textAnchor="start">
            業務
          </text>
          <text x="100" y="154" textAnchor="middle">
            品質
          </text>
          <text x="38" y="115" textAnchor="end">
            人材
          </text>
          <text x="38" y="50" textAnchor="end">
            体制
          </text>
        </g>
      </svg>
    </div>
  );
}

function ResultMock({
  image,
  alt,
  name,
  description,
  variant,
  strengths,
  gaps,
  priority,
}: {
  image: string;
  alt: string;
  name: string;
  description: string;
  variant: "blue" | "green";
  strengths: string;
  gaps: string;
  priority: string;
}) {
  return (
    <div className="mock">
      <div className="mock-hd">
        <div className="animal">
          <img src={image} alt={alt} />
        </div>
        <div>
          <div className="t-name">{name}</div>
          <div className="t-desc">{description}</div>
        </div>
      </div>
      <RadarMock variant={variant} />
      <div className="mini3">
        <div className="m">
          <div className="lab">強み TOP3</div>
          <div className="v">{strengths}</div>
        </div>
        <div className="m coral">
          <div className="lab">伸びしろ TOP3</div>
          <div className="v">{gaps}</div>
        </div>
        <div className="m">
          <div className="lab">優先テーマ</div>
          <div className="v">{priority}</div>
        </div>
      </div>
    </div>
  );
}

function Cta({ children, blue = false, big = false }: { children: React.ReactNode; blue?: boolean; big?: boolean }) {
  return (
    <a href={START_URL} className={`cta${blue ? " blue" : ""}${big ? " big" : ""}`}>
      {children}
    </a>
  );
}

export function DoctorCompassLanding() {
  return (
    <main className="dc-lp">
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <small>DOCTOR&apos;S COMPASS</small>院長コンパス
          </div>
          <Cta blue>タイプを確認する</Cta>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">FOR CLINIC DIRECTORS ・ 医院経営アセスメント</div>
            <h1>
              あなたの医院経営は、
              <br />
              <span className="hl">どのタイプ？</span>
            </h1>
            <p className="sub">
              いくつかの質問に答えるだけで、あなたの経営スタイルを12タイプで整理。
              <br />
              強みと、いま優先して確認すべき課題が、約5分で分かります。
            </p>
            <div className="badges">
              <span className="badge free">無料</span>
              <span className="badge">約5分で完了</span>
              <span className="badge">スマートフォン対応</span>
            </div>
            <Cta>無料で自分のタイプを確認する</Cta>
            <div className="cta-sub">
              <b>約5分</b>／無料／スマートフォン対応・情報入力なしですぐに始められます
            </div>
          </div>
          <ResultMock
            image="/images/types/director/elephant.png"
            alt="ゾウ"
            name="人育て院長"
            description="ゾウ・育成と定着に強みが出やすいタイプ"
            variant="blue"
            strengths="人材育成／定着／方向性"
            gaps="収益設計／権限移譲"
            priority="人材・組織"
          />
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">CHOOSE YOUR VERSION</div>
          <h2 className="sec">あなたの立場に合わせて選べます</h2>
          <p className="lead">診断は2種類。院長先生とNo.2、それぞれの視点から整理できます。</p>
          <div className="two">
            <div className="selc">
              <div className="tag">院長版</div>
              <h3>医院の方向性を整理する</h3>
              <p>医院の方向性、収益、組織づくり、権限移譲などから、院長の経営スタイルと優先課題を整理します。</p>
            </div>
            <div className="selc jimu">
              <div className="tag">事務長版</div>
              <h3>No.2の視点で整理する</h3>
              <p>院長との連携、現場運営、スタッフ育成、業務改善などから、No.2としてのマネジメントスタイルを整理します。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="empathy">
        <div className="wrap">
          <div className="eyebrow">DO YOU FEEL THIS?</div>
          <h2 className="sec">こんな状態になっていませんか？</h2>
          <div className="emp-list">
            {[
              "診療、経営判断、スタッフ対応が、院長に集中している",
              "採用しても定着せず、同じ問題を繰り返している",
              "売上はあるが、利益や資金繰りに不安がある",
              "事務長やリーダーへ任せたいが、結局自分が対応している",
              "改善したいことが多く、何から始めるべきか決められない",
            ].map((text) => (
              <div className="emp-item" key={text}>
                <span className="ic">✓</span>
                {text}
              </div>
            ))}
          </div>
          <p className="emp-close">
            一つずつ考える前に、
            <br />
            まず全体を整理する必要があります。
          </p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">WHAT YOU CAN SEE</div>
          <h2 className="sec">診断で分かる、4つのこと</h2>
          <p className="lead">機能ではなく、受け取れる結果でお伝えします。</p>
          <div className="four">
            {[
              ["01", "あなたの経営タイプ", "12タイプから、いまどんな経営スタイルで医院を運営しているかが分かります。"],
              ["02", "医院経営のバランス", "診療方針、収益、業務、医療品質、組織など、6領域のバランスを可視化します。"],
              ["03", "強みと伸びしろ", "いま活かせている強みと、今後の成長を妨げやすいテーマを整理します。"],
              ["04", "優先して確認すべき課題", "課題を並べるだけでなく、いまどのテーマから確認すべきかが分かります。"],
            ].map(([number, title, text]) => (
              <div className="fcard" key={number}>
                <div className="n">{number}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sample-section">
        <div className="wrap">
          <div className="eyebrow">RESULT SAMPLE</div>
          <h2 className="sec">いくつかの質問で、ここまで分かります</h2>
          <p className="lead">実際の診断結果は、こんなイメージでお届けします。</p>
          <div className="sample-mock">
            <ResultMock
              image="/images/types/director/owl.png"
              alt="フクロウ"
              name="未来の設計士"
              description="フクロウ・構想と仕組みづくりに強みが出やすいタイプ"
              variant="green"
              strengths="方向性／仕組み化／品質"
              gaps="人材定着／収益"
              priority="収益・業務設計"
            />
          </div>
          <div className="cta-wrap">
            <Cta blue>無料で自分の結果を見てみる</Cta>
            <div className="cta-sub">
              <b>約5分</b>／無料／スマートフォン対応
            </div>
          </div>
        </div>
      </section>

      <section className="types">
        <div className="wrap">
          <div className="eyebrow">12 TYPES</div>
          <h2 className="sec">あなたの医院経営は、どのスタイル？</h2>
          <p className="lead">院長版・事務長版それぞれ12タイプから、現在の経営・マネジメントスタイルを整理します。</p>
          <div className="type-intent">
            <span className="ti-badge">これは性格診断ではありません</span>
            タイプは、<b>強みが出やすい領域</b>と<b>課題が生まれやすい領域</b>を映すものです。自院がいま「どこを優先して確認すべきか」を整理する入口として使います。
          </div>
          <div className="type-hero">
            {[
              ["/images/types/director/lion.png", "ライオン", "情熱の船長"],
              ["/images/types/director/elephant.png", "ゾウ", "人育て院長"],
              ["/images/types/director/owl.png", "フクロウ", "未来の設計士"],
            ].map(([image, animal, name]) => (
              <div className="tcard" key={name}>
                <div className="animal">
                  <img src={image} alt={animal} />
                </div>
                <div className="nm">{name}</div>
                <div className="role">{animal}</div>
              </div>
            ))}
          </div>
          <div className="type-rest">
            {typeChips.map((chip) => (
              <span className="chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
          <p className="note">タイプは優劣や性格を決めるものではありません。強みが現れやすい領域と、課題が生まれやすい領域を整理するための診断です。</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">6 DOMAINS</div>
          <h2 className="sec">6つの領域から、医院経営を確認します</h2>
          <p className="lead">院長先生が確認しやすい言葉で整理しています。</p>
          <div className="six">
            {domainCards.map(([icon, title, text]) => (
              <div className="dcard" key={title}>
                <div className="di">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="after">
        <div className="wrap">
          <div className="eyebrow light">AFTER DIAGNOSIS</div>
          <h2 className="sec">診断後は、あなた専用の詳細結果をご覧いただけます</h2>
          <p className="lead">結果の一部を確認したあと、さらに詳しい内容へ。</p>
          <div className="aftergrid">
            {[
              ["12タイプの詳細解説", "あなたのタイプの強み・つまずきやすい点を詳しく。"],
              ["6領域の診断結果", "領域ごとのスコアとバランスを確認できます。"],
              ["強みと課題が生まれやすい部分", "活かすべき強みと、注意したいポイントを整理。"],
              ["いま優先して確認すべきテーマ", "次に手を付けるべき順番が分かります。"],
            ].map(([title, text]) => (
              <div className="acard" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="cta-wrap">
            <Cta>無料で医院の現在地を確認する</Cta>
            <div className="cta-sub light">約5分／無料／スマートフォン対応</div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">FOR MEMBERS</div>
          <h2 className="sec">診断後も、医院経営に役立つ情報を利用できます</h2>
          <p className="lead">診断結果とあわせて、継続的に学べる環境をご用意しています。</p>
          <div className="remed3">
            {[
              ["▶", "ウェビナー視聴", "医療機関の経営・運営に役立つウェビナーを無料で。現場の課題を構造から整理します。"],
              ["▤", "ダウンロード資料", "業務改善、組織づくり、DX、集患、採用など、運営に役立つ資料を無料で。"],
              ["⟳", "アーカイブ見放題", "過去のウェビナーを、必要なタイミングでいつでも視聴できます。"],
            ].map(([icon, title, text]) => (
              <div className="rcard" key={title}>
                <div className="ri">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flow">
        <div className="wrap">
          <div className="eyebrow">FLOW</div>
          <h2 className="sec">診断の流れ</h2>
          <p className="lead">情報入力は不要。すぐに始められます。</p>
          <div className="steps">
            {[
              ["無料診断を開始", "情報入力なしで、すぐにスタートできます。"],
              ["院長版または事務長版を選択", "ご自身の立場に合わせて選びます。"],
              ["質問に回答", "選択式で、約5分で完了します。"],
              ["診断結果を確認", "タイプ・6領域・強み・優先テーマが分かります。"],
              ["会員登録で詳細結果・関連コンテンツへ", "詳しい解説やウェビナーもご利用いただけます。"],
            ].map(([title, text], index) => (
              <div className={`step${index === 0 ? " hl" : ""}`} key={title}>
                <div className="sn">{index + 1}</div>
                <div className="st">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap center">
          <div className="eyebrow">SAFETY</div>
          <h2 className="sec">安心してご利用いただけます</h2>
          <div className="assure">
            {["無料", "約5分", "スマートフォン対応", "情報入力なしで開始"].map((text) => (
              <span className="apill" key={text}>
                {text}
              </span>
            ))}
          </div>
          <p className="fine">
            ・タイプの優劣や、経営の良し悪しを判定するものではありません。
            <br />
            ・診断結果は、ご回答いただいた内容に基づいて作成します。
            <br />
            ・診断データは、医療機関名が特定されない形で集計する場合があります。
          </p>
        </div>
      </section>

      <section className="final" id="start">
        <div className="wrap">
          <h2>
            まずは、自分のタイプを
            <br />
            知るところから。
          </h2>
          <p>
            課題を決めてから始める必要はありません。
            <br />
            自院の強みと経営スタイルを整理する入口として、お使いください。
          </p>
          <Cta big>無料で医院の現在地を確認する</Cta>
          <div className="cta-sub">約5分／無料／スマートフォン対応</div>
        </div>
      </section>

      <footer>© 2026 院長コンパス ／ 医院経営アセスメント</footer>

      <div className="stickybar">
        <div className="sb-txt">
          <b>約5分・無料</b>スマホ対応
        </div>
        <Cta>自分のタイプを確認する</Cta>
      </div>
    </main>
  );
}
