import Link from "next/link";
import { logoutAction } from "@/app/admin/auth-actions";
import { AdminDraftDeleteForm } from "@/components/AdminDraftDeleteForm";
import { formatDate, listDrafts, listPendingRegistrationResponses, participantLabel } from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/admin/session";
import { hasSupabaseEnv } from "@/lib/supabase/rest";

export const dynamic = "force-dynamic";

export default async function AdminDraftsPage({ searchParams }: { searchParams?: Promise<{ deleted?: string }> }) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="admin">
        <header className="admin-head">
          <Link className="wordmark" href="/">
            院長<span>コンパス</span>
          </Link>
          <span>途中保存一覧</span>
        </header>
        <section className="admin-empty">
          <h1>Supabase環境変数が未設定です</h1>
          <p>.env.local に Supabase URL / anon key / service role key を設定すると、途中保存データを表示できます。</p>
        </section>
      </main>
    );
  }

  await requireAdminUser();
  const params = await searchParams;
  const drafts = await listDrafts();
  const pendingRegistrationResponses = await listPendingRegistrationResponses();
  const totalPending = drafts.length + pendingRegistrationResponses.length;

  return (
    <main className="admin">
      <header className="admin-head">
        <Link className="wordmark" href="/">
          院長<span>コンパス</span>
        </Link>
        <div className="admin-head-actions">
          <Link className="admin-head-link subtle" href="/admin">
            回答一覧へ戻る
          </Link>
          <span>途中保存一覧</span>
          <form action={logoutAction}>
            <button type="submit">ログアウト</button>
          </form>
        </div>
      </header>

      <section className="admin-drafts-page">
        <div className="admin-drafts-title">
          <div>
            <p className="eyebrow teal">DRAFT ASSESSMENTS</p>
            <h1>途中保存の受検者</h1>
            <p>
              未完了の途中保存データと、回答完了後に会員登録前で離脱したデータを表示しています。
            </p>
          </div>
          <div className="draft-count-card">
            <span>未完了・登録前</span>
            <b>{totalPending}</b>
          </div>
        </div>

        {params?.deleted && <div className="saved block">途中保存データを削除しました</div>}

        {drafts.length === 0 ? (
          <div className="admin-empty-small draft-empty">未完了の途中保存データはありません。</div>
        ) : (
          <div className="draft-table">
            <div className="draft-table-row draft-table-header">
              <span>受検者</span>
              <span>区分</span>
              <span>回答状況</span>
              <span>保存日時</span>
              <span>最終アクセス</span>
              <span>操作</span>
            </div>
            {drafts.map((draft) => {
              const answeredCount = Number(draft.answered_count) || 0;
              const totalQuestions = Number(draft.total_questions) || 36;
              const progress = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

              return (
                <article className="draft-table-row" key={draft.id}>
                  <div>
                    <strong>{draft.name || "氏名未入力"}</strong>
                    <small>{draft.clinic_name || "医院名未入力"}</small>
                    {draft.email && <small>{draft.email}</small>}
                  </div>
                  <span>{draft.participant_type ? participantLabel(draft.participant_type) : "区分未選択"}</span>
                  <div className="draft-progress">
                    <div>
                      <i style={{ width: `${progress}%` }} />
                    </div>
                    <small>
                      {answeredCount}/{totalQuestions}（{progress}%）
                    </small>
                  </div>
                  <span>{formatDate(draft.updated_at)}</span>
                  <span>{formatDate(draft.last_accessed_at)}</span>
                  <AdminDraftDeleteForm draftId={draft.id} />
                </article>
              );
            })}
          </div>
        )}

        <div className="admin-drafts-title pending-registration-title">
          <div>
            <p className="eyebrow teal">PENDING REGISTRATION</p>
            <h2>回答完了後・会員登録前のデータ</h2>
            <p>
              診断回答は完了していますが、詳細結果表示前のREFOLMO Med会員登録が未完了のデータです。
            </p>
          </div>
          <div className="draft-count-card">
            <span>登録前</span>
            <b>{pendingRegistrationResponses.length}</b>
          </div>
        </div>

        {pendingRegistrationResponses.length === 0 ? (
          <div className="admin-empty-small draft-empty">会員登録前で離脱した回答データはありません。</div>
        ) : (
          <div className="draft-table pending-registration-table">
            <div className="draft-table-row draft-table-header">
              <span>受検者</span>
              <span>区分</span>
              <span>回答状況</span>
              <span>回答日時</span>
              <span>総合スコア</span>
              <span>状態</span>
            </div>
            {pendingRegistrationResponses.map((response) => (
              <article className="draft-table-row" key={response.id}>
                <div>
                  <strong>{response.name || "会員登録前"}</strong>
                  <small>{response.clinic_name || "医院名未登録"}</small>
                  <small>{response.email || "メール未登録"}</small>
                </div>
                <span>{participantLabel(response.participant_type)}</span>
                <div className="draft-progress">
                  <div>
                    <i style={{ width: "100%" }} />
                  </div>
                  <small>36/36（回答完了）</small>
                </div>
                <span>{formatDate(response.submitted_at)}</span>
                <span>{Number(response.total_score).toFixed(1)}</span>
                <span className="draft-status-pill">会員登録前</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
