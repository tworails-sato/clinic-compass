import Link from "next/link";
import { notFound } from "next/navigation";
import { AverageComparison } from "@/components/AverageComparison";
import { PrintButton } from "@/components/PrintButton";
import { Radar } from "@/components/Radar";
import { TypeDiagnosisResult } from "@/components/TypeDiagnosisResult";
import type { Answers } from "@/lib/assessment";
import {
  formatDate,
  getAnswers,
  getAverageComparisonForResponse,
  getReport,
  getResponse,
  getTypeResult,
  normalizePriorities,
  normalizeScores,
  participantLabel,
} from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/admin/session";
import { calculateTypeDiagnosis } from "@/lib/type-diagnosis/engine";

export const dynamic = "force-dynamic";

export default async function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();
  const { id } = await params;
  const response = await getResponse(id);
  if (!response) notFound();

  const answers = await getAnswers(id);
  const report = await getReport(id);
  const savedTypeDiagnosis = await getTypeResult(id);
  const typeDiagnosis = savedTypeDiagnosis ?? calculateTypeDiagnosis(response.participant_type, answersToRecord(answers), Number(response.total_score));
  const chartScores = normalizeScores(response.theme_scores);
  const priorities = normalizePriorities(response.priority_themes);
  const averageComparison = await getAverageComparisonForResponse(response, chartScores);
  const averageScores = averageComparison.comparisons
    .filter((comparison) => comparison.averageScore !== null)
    .map((comparison) => ({ name: comparison.name, score: comparison.averageScore ?? 0, children: [] }));

  return (
    <main className="print-page">
      <div className="print-actions">
        <Link className="button subtle" href={`/admin?id=${id}`}>
          管理画面へ戻る
        </Link>
        <PrintButton />
      </div>

      <section className="print-sheet">
        <p className="eyebrow teal">CLINIC COMPASS REPORT</p>
        <h1>院長コンパス 診断レポート</h1>
        <p className="admin-meta">
          {response.clinic_name} ／ {response.name}さん ／ {participantLabel(response.participant_type)} ／ {formatDate(response.submitted_at)}
        </p>

        <div className="admin-stats">
          <div>
            <span>総合スコア</span>
            <b>{Number(response.total_score).toFixed(1)}</b>
          </div>
          <div>
            <span>優先確認テーマ</span>
            <b className="theme-name">{priorities.join(" ／ ") || "未設定"}</b>
          </div>
        </div>

        <TypeDiagnosisResult result={typeDiagnosis} showStatusAndMaturity={false} showCalculatedAt />

        <section className="print-section">
          <h2>テーマ別スコア</h2>
          {chartScores.length > 0 && <Radar data={chartScores} averageData={averageScores} />}
          <div className="score-list">
            {chartScores.map((row) => (
              <div key={row.name}>
                <span>{row.name}</span>
                <b>{row.score.toFixed(1)}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="print-section">
          <AverageComparison comparisons={averageComparison.comparisons} count={averageComparison.count} />
        </section>

        <section className="print-section">
          <h2>管理者コメント</h2>
          <h3>総評サマリー</h3>
          <p>{report?.overall_comment || "未入力"}</p>
          <h3>強み</h3>
          <p>{report?.strengths_comment || "未入力"}</p>
          <h3>課題（優先テーマ）</h3>
          <p>{report?.priority_comment || "未入力"}</p>
          <h3>アクション</h3>
          <p>{report?.next_actions || "未入力"}</p>
        </section>

        <section className="print-section">
          <h2>回答明細</h2>
          <div className="admin-answers print-answers">
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
      </section>
    </main>
  );
}

function answersToRecord(answers: Array<{ question_number: number; score: number }>): Answers {
  return Object.fromEntries(answers.map((answer) => [answer.question_number, Number(answer.score)]));
}
