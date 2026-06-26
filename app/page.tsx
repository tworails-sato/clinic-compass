"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClinicLanding } from "@/components/ClinicLanding";
import { ParticipantType, questionsFor } from "@/lib/questions";

type Profile = { name: string; email: string; clinic: string; type: ParticipantType | "" };
type View = "landing" | "profile" | "questions" | "result";

const roles = {
  director: ["院長", "医院経営・診療体制を総合的に確認します"],
  office_manager: ["事務長", "現場運営・組織体制を中心に確認します"],
} as const;

const scale = ["できていない", "あまりできていない", "一部できている", "概ねできている", "できている"];

const directorGroups = {
  "診療方針・患者市場": ["医療方針・診療設計", "商圏・ニーズ把握", "ポートフォリオ設計", "集患・地域連携"],
  "収益・業務設計": ["収益・業務設計"],
  "患者価値・品質": ["患者体験", "品質・安全管理"],
  "リスク管理": ["法令・労務・広告コンプライアンス", "医療情報・サイバーセキュリティ", "事業継続・緊急対応"],
  "人材・組織": ["採用・定着力", "育成・チーム連携"],
  "経営体制・改善": ["経営体制・権限移譲", "経営管理・改善力"],
};

const managerGroups = {
  "業務オペレーション": ["業務導線・役割分担", "予約・待ち時間管理", "業務標準化"],
  "人員・育成": ["スタッフ配置・負荷管理", "教育・育成"],
  "情報共有・橋渡し": ["情報共有・報連相", "方針共有・橋渡し"],
  "権限移譲・現場自走": ["判断範囲・権限設計", "院長依存・現場自走"],
  "数値・改善・事務": ["数値管理", "改善活動", "請求・事務管理"],
  "リスク対応": ["個人情報・労務・トラブル対応"],
};

function Radar({ data }: { data: Array<{ name: string; score: number }> }) {
  const center = 150;
  const radius = 102;
  const n = data.length;
  const point = (value: number, i: number) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / n;
    const r = (radius * value) / 5;
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  };
  const full = (v: number) => data.map((_, i) => point(v, i)).join(" ");

  return (
    <div className="radar">
      <svg viewBox="0 0 300 300" role="img" aria-label="テーマ別レーダーチャート">
        {[1, 2, 3, 4, 5].map((v) => (
          <polygon key={v} points={full(v)} className="radar-grid" />
        ))}
        {data.map((d, i) => (
          <line
            key={d.name}
            x1={center}
            y1={center}
            x2={point(5, i).split(",")[0]}
            y2={point(5, i).split(",")[1]}
            className="radar-axis"
          />
        ))}
        <polygon points={data.map((d, i) => point(d.score, i)).join(" ")} className="radar-area" />
        {data.map((d, i) => {
          const angle = -Math.PI / 2 + (i * Math.PI * 2) / n;
          return (
            <text
              key={d.name}
              x={center + Math.cos(angle) * 128}
              y={center + Math.sin(angle) * 128}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-label"
            >
              {d.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", clinic: "", type: "" });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  const questions = profile.type ? questionsFor(profile.type) : [];
  const themes = useMemo(() => [...new Set(questions.map((q) => q.theme))], [questions]);
  const scores = useMemo(
    () =>
      themes.map((theme) => {
        const qs = questions.filter((q) => q.theme === theme);
        const values = qs.map((q) => answers[q.id]).filter((v): v is number => !!v);
        return { theme, score: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0 };
      }),
    [themes, questions, answers],
  );
  const grouped = useMemo(() => {
    const groups = profile.type === "director" ? directorGroups : managerGroups;
    return Object.entries(groups).map(([name, children]) => {
      const vals = scores.filter((s) => children.includes(s.theme)).map((s) => s.score);
      return { name, score: vals.reduce((a, b) => a + b, 0) / (vals.length || 1), children };
    });
  }, [profile.type, scores]);
  const total = grouped.reduce((a, b) => a + b.score, 0) / (grouped.length || 1);
  const priorities = [...grouped].sort((a, b) => a.score - b.score).slice(0, 3);
  const answered = Object.keys(answers).length;

  function start() {
    if (!profile.name || !profile.email || !profile.clinic || !profile.type) {
      setError("氏名・メールアドレス・医院名・対象者区分を入力してください。");
      return;
    }
    setError("");
    setAnswers({});
    setView("questions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    const missing = questions.find((q) => !answers[q.id]);
    if (missing) {
      setError(`未回答の設問があります。No.${missing.id}から回答してください。`);
      setTimeout(() => document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 10);
      return;
    }
    setError("");
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <header className="top">
        <Link href="/" className="wordmark">
          院長<span>コンパス</span>
        </Link>
        <nav>
          <a href="#about">診断について</a>
          <a href="#flow">ご利用の流れ</a>
          <Link href="/admin">管理画面</Link>
        </nav>
      </header>

      {view === "landing" && <ClinicLanding onStart={() => setView("profile")} />}

      {view === "profile" && (
        <main className="main">
          <div className="wrap">
            <section className="card profile-card">
              <p className="step">STEP 1 / 基本情報</p>
              <h2>診断をはじめましょう</h2>
              <p className="lead">対象者区分に応じて、表示する設問が切り替わります。</p>
              <div className="roles">
                {(Object.keys(roles) as ParticipantType[]).map((type) => (
                  <button className={`role ${profile.type === type ? "active" : ""}`} key={type} onClick={() => setProfile({ ...profile, type })}>
                    <strong>{roles[type][0]}</strong>
                    <span>{roles[type][1]}</span>
                  </button>
                ))}
              </div>
              <div className="profile">
                <label>
                  氏名
                  <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </label>
                <label>
                  メールアドレス
                  <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </label>
                <label>
                  医院名
                  <input value={profile.clinic} onChange={(e) => setProfile({ ...profile, clinic: e.target.value })} />
                </label>
              </div>
              {error && <p className="error">{error}</p>}
              <button className="button" onClick={start}>
                設問へ進む →
              </button>
            </section>
          </div>
        </main>
      )}

      {view === "questions" && (
        <main className="main assessment">
          <div className="wrap">
            <section className="assessment-head">
              <p className="step">STEP 2 / 回答</p>
              <h1>{roles[profile.type as ParticipantType][0]}向けアセスメント</h1>
              <p>
                {profile.clinic}　{profile.name}さん
              </p>
            </section>
            <div className="score-guide">
              <strong>回答の目安</strong>
              {scale.map((label, i) => (
                <span key={label}>
                  <b>{i + 1}</b>
                  {label}
                </span>
              ))}
            </div>
            <div className="sticky-progress">
              <div>
                <strong>回答状況</strong>
                <span>
                  {questions.length}問中 {answered}問を回答
                </span>
              </div>
              <div className="progress">
                <i style={{ width: `${(answered / questions.length) * 100}%` }} />
              </div>
              <button className="button compact" onClick={submit}>
                結果を見る
              </button>
            </div>
            {error && <div className="alert">{error}</div>}
            {themes.map((theme) => (
              <section className="card theme" key={theme}>
                <p className="theme-kicker">THEME</p>
                <h2>{theme}</h2>
                {questions
                  .filter((q) => q.theme === theme)
                  .map((q) => {
                    const missing = error && !answers[q.id];
                    return (
                      <article className={`question ${missing ? "unanswered" : ""}`} id={`q-${q.id}`} key={q.id}>
                        <p className="qtext">
                          <span>Q{q.id}</span>
                          {q.text}
                        </p>
                        <div className="scale">
                          {scale.map((label, i) => (
                            <label key={label}>
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={answers[q.id] === i + 1}
                                onChange={() => {
                                  setAnswers({ ...answers, [q.id]: i + 1 });
                                  setError("");
                                }}
                              />
                              <b>{i + 1}</b>
                              <small>{label}</small>
                            </label>
                          ))}
                        </div>
                      </article>
                    );
                  })}
              </section>
            ))}
            <div className="submit-box">
              {error && <p className="error">{error}</p>}
              <button className="button large" onClick={submit}>
                診断結果を見る →
              </button>
            </div>
          </div>
        </main>
      )}

      {view === "result" && (
        <main className="result-page">
          <section className="result-hero">
            <div className="wrap">
              <p className="eyebrow">ASSESSMENT RESULT</p>
              <h1>{profile.name}さんの診断結果</h1>
              <p>
                {profile.clinic} ／ {roles[profile.type as ParticipantType][0]}
              </p>
              <div className="total">
                <span>総合スコア</span>
                <b>{total.toFixed(1)}</b>
                <i>/ 5.0</i>
              </div>
            </div>
          </section>
          <div className="wrap result-content">
            <section className="result-intro">
              <h2>いまの医院を、地図のように眺める。</h2>
              <p>この結果は優劣を決めるものではありません。具体的な状況を確認し、次の行動を考えるための入り口です。</p>
            </section>
            <div className="result-grid">
              <section className="result-card chart-card">
                <div className="card-heading">
                  <p className="eyebrow teal">THEME BALANCE</p>
                  <h2>テーマ別スコア</h2>
                </div>
                <Radar data={grouped} />
                <div className="score-list">
                  {grouped.map((row) => (
                    <div key={row.name}>
                      <span>{row.name}</span>
                      <b>{row.score.toFixed(1)}</b>
                    </div>
                  ))}
                </div>
              </section>
              <section className="result-card">
                <p className="eyebrow teal">PRIORITY CHECK</p>
                <h2>優先確認テーマ</h2>
                <p className="hint">
                  優先確認テーマは、スコア順に、取り組む候補を表示しています。単にスコアだけで良し悪しを判断するのではなく、具体的なアクションを考える入口としてご覧ください。
                </p>
                {priorities.map((row, i) => (
                  <article className="priority rich" key={row.name}>
                    <span>0{i + 1}</span>
                    <div>
                      <strong>{row.name}</strong>
                      <p>スコア {row.score.toFixed(1)} ／ まずは現状・担当・期限を確認しましょう。</p>
                    </div>
                  </article>
                ))}
              </section>
            </div>
            <section className="comment-card">
              <p className="eyebrow">COMPASS NOTE</p>
              <h2>ここから始める、次の一歩。</h2>
              <div className="comment-grid">
                <p>
                  全体としては<strong>{total >= 4 ? "安定した基盤" : total >= 3 ? "改善の土台" : "見直しの余地"}</strong>が見えています。すべてを一度に変える必要はありません。
                </p>
                <p>
                  まずは <strong>{priorities[0]?.name}</strong> に関して、現場で起きている具体的な事実を三つ集めることから始めましょう。
                </p>
                <p>次回のミーティングでは「誰が」「いつまでに」「何を確認するか」を一つ決めると、診断が行動に変わります。</p>
              </div>
            </section>
            <section className="accordion-card">
              <p className="eyebrow teal">HOW TO READ</p>
              <h2>テーマの見方を確認する</h2>
              {grouped.map((row) => (
                <details key={row.name}>
                  <summary>
                    {row.name}
                    <b>{row.score.toFixed(1)}</b>
                  </summary>
                  <p>
                    このテーマは「{row.children.join("／")}」の観点から算出しています。点数の背景にある具体的な業務・判断・情報共有の状態を、関係者と確認してみてください。
                  </p>
                </details>
              ))}
            </section>
            <div className="result-actions">
              <button
                className="button subtle"
                onClick={() => {
                  setView("profile");
                  setAnswers({});
                }}
              >
                もう一度診断する
              </button>
              <Link className="button" href="/admin">
                管理画面で確認する →
              </Link>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
