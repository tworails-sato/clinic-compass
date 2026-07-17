import Link from "next/link";
import { logoutAction } from "@/app/admin/auth-actions";
import { AdminDeleteForm } from "@/components/AdminDeleteForm";
import { AdminReportEditor } from "@/components/AdminReportEditor";
import { AverageComparison } from "@/components/AverageComparison";
import { Radar } from "@/components/Radar";
import { TypeDiagnosisResult } from "@/components/TypeDiagnosisResult";
import { generateReportDraft } from "@/lib/admin/comment-drafts";
import {
  formatDate,
  formatReferralMemo,
  getAnswers,
  getAverageComparisonForResponse,
  getReport,
  getTypeResult,
  listDrafts,
  listResponses,
  normalizePriorities,
  normalizeScores,
  participantLabel,
} from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/admin/session";
import { hasSupabaseEnv } from "@/lib/supabase/rest";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ id?: string; saved?: string; deleted?: string }> }) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="admin">
        <header className="admin-head">
          <Link className="wordmark" href="/">
            院長<span>コンパス</span>
          </Link>
          <span>管理画面</span>
        </header>
        <section className="admin-empty">
          <h1>Supabase環境変数が未設定です</h1>
          <p>.env.local に Supabase URL / anon key / service role key を設定すると、実データを表示できます。</p>
        </section>
      </main>
    );
  }

  await requireAdminUser();
  const params = await searchParams;

  const responses = await listResponses();
  const drafts = await listDrafts();
  const responseTypeResults = await Promise.all(responses.map((row) => getTypeResult(row.id)));
  const typeResultByResponseId = new Map(responses.map((row, index) => [row.id, responseTypeResults[index]]));
  const selected = responses.find((row) => row.id === params?.id) ?? responses[0];
  const answers = selected ? await getAnswers(selected.id) : [];
  const report = selected ? await getReport(selected.id) : null;
  const typeDiagnosis = selected ? await getTypeResult(selected.id) : null;
  const chartScores = selected ? normalizeScores(selected.theme_scores) : [];
  const priorities = selected ? normalizePriorities(selected.priority_themes) : [];
  const averageComparison = selected ? await getAverageComparisonForResponse(selected, chartScores) : null;
  const averageScores = averageComparison?.comparisons
    .filter((comparison) => comparison.averageScore !== null)
    .map((comparison) => ({ name: comparison.name, score: comparison.averageScore ?? 0, children: [] })) ?? [];
  const reportDraft = selected ? generateReportDraft(selected, chartScores, averageComparison?.comparisons ?? [], averageComparison?.count ?? 0) : null;
  const referralMemo = selected ? formatReferralMemo(selected.basic_info) : "";

  return (
    <main className="admin">
      <header className="admin-head">
        <Link className="wordmark" href="/">
          院長<span>コンパス</span>
        </Link>
        <div className="admin-head-actions">
          <span>管理画面</span>
          <form action={logoutAction}>
            <button type="submit">ログアウト</button>
          </form>
        </div>
      </header>

      <div className="admin-wrap">
        <aside>
          <p>ASSESSMENTS</p>
          <h2>回答一覧</h2>
          <Link className="button compact admin-export" href="/admin/export">
            CSV出力
          </Link>
          {params?.deleted && <div className="saved block">削除しました</div>}
          {responses.length === 0 && <p className="admin-empty-small">まだ回答データがありません。</p>}
          {responses.map((item) => (
            <Link className={`response-row ${selected?.id === item.id ? "selected" : ""}`} key={item.id} href={`/admin?id=${item.id}`}>
              <strong>{item.name}</strong>
              <span>
                {item.clinic_name} ・ {participantLabel(item.participant_type)}
              </span>
              {typeResultByResponseId.get(item.id)?.mainTypeLabel && <span>12タイプ：{typeResultByResponseId.get(item.id)?.mainTypeLabel}</span>}
              <small>{formatDate(item.submitted_at)}</small>
            </Link>
          ))}
          <div className="admin-draft-list">
            <p>DRAFTS</p>
            <h2>途中保存</h2>
            {drafts.length === 0 && <p className="admin-empty-small">途中保存データはありません。</p>}
            {drafts.map((draft) => (
              <article className="draft-row" key={draft.id}>
                <strong>{draft.name || "氏名未入力"}</strong>
                <span>
                  {draft.clinic_name || "医院名未入力"} ・ {draft.participant_type ? participantLabel(draft.participant_type) : "区分未選択"}
                </span>
                <small>
                  回答数：{Number(draft.answered_count)}/{Number(draft.total_questions) || 36}
                </small>
                <small>保存日時：{formatDate(draft.updated_at)}</small>
                <small>最終アクセス：{formatDate(draft.last_accessed_at)}</small>
                <em className={draft.completed_at ? "completed" : ""}>{draft.completed_at ? "完了" : "未完了"}</em>
              </article>
            ))}
          </div>
        </aside>

        <section className="admin-detail">
          {!selected ? (
            <div className="admin-empty-small">回答を選択してください。</div>
          ) : (
            <>
              <p className="eyebrow teal">RESPONSE DETAIL</p>
              <h1>{selected.name}さん</h1>
              <p className="admin-meta">
                {selected.clinic_name}　/　{participantLabel(selected.participant_type)}　/　{formatDate(selected.submitted_at)} 回答
              </p>
              {params?.saved && <div className="saved block">コメントを保存しました</div>}

              <div className="admin-stats">
                <div>
                  <span>総合スコア</span>
                  <b>{Number(selected.total_score).toFixed(1)}</b>
                </div>
                <div>
                  <span>優先確認テーマ</span>
                  <b className="theme-name">{priorities.join(" ・ ") || "未設定"}</b>
                </div>
              </div>

              <TypeDiagnosisResult result={typeDiagnosis} />

              <div className="admin-result-grid">
                <section className="result-card">
                  <h2>レーダーチャート</h2>
                  {chartScores.length > 0 ? <Radar data={chartScores} averageData={averageScores} /> : <p className="admin-empty-small">テーマ別スコアがありません。</p>}
                </section>
                <section className="result-card">
                  <h2>各項目の点数</h2>
                  <div className="admin-answers">
                    {answers.map((answer) => (
                      <article key={answer.id}>
                        <span>Q{answer.question_number}</span>
                        <div>
                          <strong>{answer.theme_name_snapshot}</strong>
                          <p>{answer.question_text_snapshot}</p>
                        </div>
                        <b>{answer.score}</b>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              {averageComparison && <AverageComparison comparisons={averageComparison.comparisons} count={averageComparison.count} />}

              <section className="report-editor">
                <div>
                  <p className="eyebrow teal">REPORT MAKER</p>
                  <h2>コメント欄</h2>
                  <p>スコアに応じた自動下書きを叩き台として表示します。管理者が編集して保存できます。</p>
                </div>
                {reportDraft && (
                  <AdminReportEditor
                    key={selected.id}
                    responseId={selected.id}
                    report={report}
                    draft={reportDraft}
                    referralMemo={referralMemo}
                  />
                )}
              </section>

              <section className="admin-danger-zone">
                <h2>削除</h2>
                <p>削除すると一覧には表示されなくなります。データは `deleted_at` を入れるソフト削除で保持します。</p>
                <AdminDeleteForm responseId={selected.id} />
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
