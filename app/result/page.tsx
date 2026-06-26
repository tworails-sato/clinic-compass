"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "@/components/Radar";
import { SiteHeader } from "@/components/SiteHeader";
import { Answers, emptyProfile, getGroupedScores, getPriorities, getTotalScore, Profile, roles, storageKeys } from "@/lib/assessment";
import { ParticipantType } from "@/lib/questions";

export default function ResultPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    const savedProfile = window.sessionStorage.getItem(storageKeys.profile);
    const savedAnswers = window.sessionStorage.getItem(storageKeys.answers);
    if (!savedProfile || !savedAnswers) {
      router.replace("/start");
      return;
    }
    setProfile(JSON.parse(savedProfile));
    setAnswers(JSON.parse(savedAnswers));
  }, [router]);

  const grouped = useMemo(() => getGroupedScores(profile, answers), [profile, answers]);
  const total = getTotalScore(grouped);
  const priorities = getPriorities(grouped);

  if (!profile.type) return null;

  return (
    <>
      <SiteHeader />
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
            <Link
              className="button subtle"
              href="/start"
              onClick={() => {
                window.sessionStorage.removeItem(storageKeys.answers);
              }}
            >
              もう一度診断する
            </Link>
            <Link className="button" href="/admin">
              管理画面で確認する →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
