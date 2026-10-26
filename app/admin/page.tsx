import Link from "next/link";
import { logoutAction } from "@/app/admin/auth-actions";
import { AdminBulkDeleteForm } from "@/components/AdminBulkDeleteForm";
import { AdminDeleteForm } from "@/components/AdminDeleteForm";
import { AdminEmailComposer, AdminReportEditor } from "@/components/AdminReportEditor";
import { AverageComparison } from "@/components/AverageComparison";
import { Radar } from "@/components/Radar";
import { TypeDiagnosisResult } from "@/components/TypeDiagnosisResult";
import { generateReportDraft } from "@/lib/admin/comment-drafts";
import type { Answers } from "@/lib/assessment";
import {
  formatDate,
  formatReferralMemo,
  getAnswers,
  getAnswersForResponses,
  getAverageComparisonForResponse,
  getReport,
  getTypeResults,
  listDrafts,
  listPendingRegistrationResponses,
  listResponses,
  normalizePriorities,
  normalizeScores,
  participantLabel,
} from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/admin/session";
import { hasSupabaseEnv } from "@/lib/supabase/rest";
import { calculateTypeDiagnosis, getTypeDefinition, type TypeDiagnosisResultData } from "@/lib/type-diagnosis/engine";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ id?: string; saved?: string; deleted?: string; mail?: string }> }) {
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

  const [responses, drafts, pendingRegistrationResponses] = await Promise.all([
    listResponses(),
    listDrafts(),
    listPendingRegistrationResponses(),
  ]);
  const typeResultByResponseId = await getTypeResults(responses.map((row) => row.id));
  const responsesWithoutType = responses.filter((row) => !typeResultByResponseId.has(row.id));
  if (responsesWithoutType.length > 0) {
    const answersByResponseId = await getAnswersForResponses(responsesWithoutType.map((row) => row.id));
    responsesWithoutType.forEach((row) => {
      const calculated = calculateTypeDiagnosis(
        row.participant_type,
        answersToRecord(answersByResponseId.get(row.id) ?? []),
        Number(row.total_score),
      );
      if (calculated) typeResultByResponseId.set(row.id, calculated);
    });
  }
  const selected = responses.find((row) => row.id === params?.id) ?? responses[0];
  const chartScores = selected ? normalizeScores(selected.theme_scores) : [];
  const priorities = selected ? normalizePriorities(selected.priority_themes) : [];
  const [answers, report, averageComparison] = selected
    ? await Promise.all([
        getAnswers(selected.id),
        getReport(selected.id),
        getAverageComparisonForResponse(selected, chartScores),
      ])
    : [[], null, null];
  const typeDiagnosis = selected
    ? typeResultByResponseId.get(selected.id) ??
      calculateTypeDiagnosis(selected.participant_type, answersToRecord(answers), Number(selected.total_score))
    : null;
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
          <Link className="admin-head-link" href="/admin/drafts">
            途中保存一覧{drafts.length + pendingRegistrationResponses.length > 0 ? `（${drafts.length + pendingRegistrationResponses.length}）` : ""}
          </Link>
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
          <AdminBulkDeleteForm count={responses.length}>
            {responses.map((item) => (
              <ResponseListRow
                item={item}
                key={item.id}
                selected={selected?.id === item.id}
                typeResult={typeResultByResponseId.get(item.id) ?? null}
              />
            ))}
          </AdminBulkDeleteForm>
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

              <TypeDiagnosisResult result={typeDiagnosis} showStatusAndMaturity={false} showCalculatedAt />

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

              <section className="admin-email-composer">
                <div>
                  <p className="eyebrow teal">FOLLOW-UP EMAIL</p>
                  <h2>回答者へメールを送信</h2>
                  <p>宛先を確認し、件名・本文を必要に応じて編集してから送信してください。</p>
                </div>
                {params?.mail === "sent" && <div className="auth-success">メールを送信しました。</div>}
                {params?.mail === "failed" && <div className="auth-alert">メールを送信できませんでした。時間をおいて再度お試しください。</div>}
                {params?.mail === "invalid" && <div className="auth-alert">宛先・件名・本文を確認してください。</div>}
                <AdminEmailComposer
                  key={`email-${selected.id}`}
                  responseId={selected.id}
                  recipientEmail={selected.email}
                  defaultSubject="【院長コンパス】フィードバック面談のご案内"
                  defaultBody={buildReminderEmailBody(selected.name, typeDiagnosis?.mainTypeLabel, selected.participant_type)}
                />
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

function answersToRecord(answers: Array<{ question_number: number; score: number }>): Answers {
  return Object.fromEntries(answers.map((answer) => [answer.question_number, Number(answer.score)]));
}

function buildReminderEmailBody(name: string, typeLabel: string | null | undefined, participantType: "director" | "office_manager") {
  const isDirector = participantType === "director";
  const addressee = name.trim() ? `${name.trim()} ${isDirector ? "先生" : "様"}` : isDirector ? "先生" : "ご担当者様";
  const subjectName = isDirector ? "先生" : "あなた";
  const typeText = typeLabel?.trim() || "医院経営タイプ";

  return `${addressee}

以前は、院長コンパスの診断、ありがとうございました。
${subjectName}は「${typeText}」という
経営タイプ、傾向が出ております。

ご希望の皆様には、経営タイプにおける、
医院経営のお強みや抱えやすい課題などの結果を
解説しております。

具体的な課題や、取るべきアクションなど
他受検者の方の特徴なども含め、お伝えをさせていただきますので
宜しければ、是非オンラインにて
ご説明させてくださいませ。

予定重複を避けるため、予約URLを共有させていただきますが、
別途ご都合の宜しい時間帯がございましたら
お気軽にお申し付けくださいませ。
宜しくお願いいたします。

【院長コンパスフィードバック日程】
https://app.spirinc.com/t/tH0ZPd8am5DhhHFmRqoM-/as/A4AoG7dj0djBv1ppF2E_L/confirm

院長コンパス運営チーム（提供：REFOLMO Med）
https://remed.refolmo.com/`;
}

function ResponseListRow({
  item,
  selected,
  typeResult,
}: {
  item: Awaited<ReturnType<typeof listResponses>>[number];
  selected: boolean;
  typeResult: TypeDiagnosisResultData | null;
}) {
  const definition = typeResult ? getTypeDefinition(typeResult.respondentType, typeResult.mainTypeKey) : null;

  return (
    <article className={`response-row bulk ${selected ? "selected" : ""}`}>
      <label className="response-check">
        <input type="checkbox" name="response_ids" value={item.id} aria-label={`${item.name}さんを削除対象に選択`} />
      </label>
      <Link className="response-row-link" href={`/admin?id=${item.id}`}>
        <strong>{item.name}</strong>
        <span>
          {item.clinic_name} ・ {participantLabel(item.participant_type)}
        </span>
        {typeResult ? (
          <div className="admin-type-list-summary">
            {definition?.iconPath ? <img src={definition.iconPath} alt="" /> : <i>🧭</i>}
            <div>
              <b>{typeResult.mainTypeLabel}</b>
              <span>サブ：{typeResult.subTypeLabel ?? "未判定"}</span>
              {typeResult.calculatedAt && <small>判定日時：{formatDate(typeResult.calculatedAt)}</small>}
            </div>
          </div>
        ) : (
          <span>12タイプ：未判定</span>
        )}
        <small>{formatDate(item.submitted_at)}</small>
      </Link>
    </article>
  );
}
