import Link from "next/link";
import { Radar } from "@/components/Radar";
import { SiteHeader } from "@/components/SiteHeader";
import { normalizePriorities, normalizeScores } from "@/lib/admin/data";
import { supabaseAdminFetch } from "@/lib/supabase/rest";

export const dynamic = "force-dynamic";

type PublicResponse = {
  id: string;
  result_token: string;
  participant_type: "director" | "office_manager";
  name: string;
  clinic_name: string;
  total_score: number | string;
  theme_scores: unknown;
  priority_themes: unknown;
  submitted_at: string;
  result_expires_at?: string | null;
  deleted_at?: string | null;
};

function timerexUrl() {
  return process.env.NEXT_PUBLIC_TIMEREX_URL || process.env.NEXT_PUBLIC_FEEDBACK_URL || "";
}

function participantLabel(type: PublicResponse["participant_type"]) {
  return type === "director" ? "院長" : "事務長";
}

function expiresAt(response: PublicResponse) {
  if (response.result_expires_at) return new Date(response.result_expires_at);
  const fallback = new Date(response.submitted_at);
  fallback.setDate(fallback.getDate() + 7);
  return fallback;
}

function isExpired(response: PublicResponse) {
  return expiresAt(response).getTime() < Date.now();
}

async function getPublicResponse(token: string) {
  const rows = (await supabaseAdminFetch(
    `/rest/v1/clinic_assessment_responses?result_token=eq.${encodeURIComponent(token)}&deleted_at=is.null&select=*&limit=1`,
  )) as PublicResponse[];
  return rows[0] ?? null;
}

function ExpiredMessage() {
  return (
    <>
      <SiteHeader />
      <main className="result-page">
        <section className="result-hero">
          <div className="wrap">
            <p className="eyebrow">ASSESSMENT RESULT</p>
            <h1>結果確認期限が終了しました</h1>
            <p>この結果確認URLの有効期限は終了しています。</p>
          </div>
        </section>
        <div className="wrap result-content">
          <section className="result-card">
            <p className="lead">詳細確認をご希望の場合は、担当者までお問い合わせください。</p>
            <Link className="button subtle" href="/">
              トップページへ戻る
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}

export default async function PublicResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const response = await getPublicResponse(token);

  if (!response || isExpired(response)) {
    return <ExpiredMessage />;
  }

  const grouped = normalizeScores(response.theme_scores);
  const priorities = normalizePriorities(response.priority_themes);
  const feedbackUrl = timerexUrl();

  return (
    <>
      <SiteHeader />
      <main className="result-page">
        <section className="result-hero">
          <div className="wrap">
            <p className="eyebrow">ASSESSMENT RESULT</p>
            <h1>{response.name}さんの診断結果</h1>
            <p>
              {response.clinic_name} ・ {participantLabel(response.participant_type)}
            </p>
            <div className="total">
              <span>総合スコア</span>
              <b>{Number(response.total_score).toFixed(1)}</b>
              <i>/ 5.0</i>
            </div>
          </div>
        </section>

        <div className="wrap result-content">
          <section className="result-intro">
            <h2>医院経営の現在地を確認しましょう</h2>
            <p>
              この結果は、回答内容をもとに医院経営のテーマ別傾向を整理したものです。スコアだけで良し悪しを判断するのではなく、具体的なアクションを考える入口としてご確認ください。
            </p>
          </section>

          <div className="result-grid">
            <section className="result-card chart-card">
              <div className="card-heading">
                <p className="eyebrow teal">THEME BALANCE</p>
                <h2>テーマ別スコア</h2>
              </div>
              {grouped.length > 0 ? <Radar data={grouped} /> : <p className="hint">テーマ別スコアがありません。</p>}
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
                優先確認テーマは、スコア順に取り組む候補を表示しています。具体的な改善アクションを考える入口としてご覧ください。
              </p>
              {priorities.map((name, index) => (
                <article className="priority rich" key={name}>
                  <span>0{index + 1}</span>
                  <div>
                    <strong>{name}</strong>
                    <p>現場の具体的な場面を確認し、改善の優先順位を整理しましょう。</p>
                  </div>
                </article>
              ))}
            </section>
          </div>

          {feedbackUrl && (
            <section className="feedback-cta-card">
              <p>診断結果をもとに、医院の課題整理や改善の優先順位について個別フィードバックをご希望の方はこちらからご予約ください。</p>
              <a className="button cta-yellow" href={feedbackUrl} target="_blank" rel="noopener noreferrer">
                個別フィードバックを予約する
              </a>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
