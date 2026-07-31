import Link from "next/link";
import { logoutAction } from "@/app/admin/auth-actions";
import { AdminDraftDeleteForm } from "@/components/AdminDraftDeleteForm";
import { formatDate, listDrafts, participantLabel } from "@/lib/admin/data";
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
              未完了の途中保存データのみ表示しています。完了済みの途中保存データは、この一覧には表示されません。
            </p>
          </div>
          <div className="draft-count-card">
            <span>未完了</span>
            <b>{drafts.length}</b>
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
      </section>
    </main>
  );
}
