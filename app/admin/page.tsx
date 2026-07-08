import Link from "next/link";
import { logoutAction } from "@/app/admin/auth-actions";
import { AdminDeleteForm } from "@/components/AdminDeleteForm";
import { AdminReportEditor } from "@/components/AdminReportEditor";
import { Radar } from "@/components/Radar";
import { generateReportDraft } from "@/lib/admin/comment-drafts";
import { formatDate, formatReferralMemo, getAnswers, getReport, listResponses, normalizePriorities, normalizeScores, participantLabel } from "@/lib/admin/data";
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
  const selected = responses.find((row) => row.id === params?.id) ?? responses[0];
  const answers = selected ? await getAnswers(selected.id) : [];
  const report = selected ? await getReport(selected.id) : null;
  const chartScores = selected ? normalizeScores(selected.theme_scores) : [];
  const priorities = selected ? normalizePriorities(selected.priority_themes) : [];
  const reportDraft = selected ? generateReportDraft(selected, chartScores) : null;
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
              <small>{formatDate(item.submitted_at)}</small>
            </Link>
          ))}
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

              <div className="admin-result-grid">
                <section className="result-card">
                  <h2>レーダーチャート</h2>
                  {chartScores.length > 0 ? <Radar data={chartScores} /> : <p className="admin-empty-small">テーマ別スコアがありません。</p>}
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

              <section className="report-editor">
                <div>
                  <p className="eyebrow teal">REPORT MAKER</p>
                  <h2>コメント欄</h2>
                  <p>スコアに応じた自動下書きを叩き台として表示します。管理者が編集して保存できます。</p>
                </div>
                {reportDraft && <AdminReportEditor responseId={selected.id} report={report} draft={reportDraft} referralMemo={referralMemo} />}
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
