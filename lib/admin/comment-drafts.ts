import type { AdminReport, AdminResponse } from "@/lib/admin/data";
import { GroupScore } from "@/lib/assessment";
import type { ThemeComparison } from "@/lib/score-comparison";

export type ReportDraft = {
  overall_comment: string;
  strengths_comment: string;
  priority_comment: string;
  next_actions: string;
};

function scoreLabel(score: number) {
  if (score >= 4) return "比較的安定している";
  if (score >= 3) return "一定の取り組みが進んでいる";
  return "優先的な確認が必要";
}

function joinThemeNames(scores: GroupScore[]) {
  return scores.map((score) => `「${score.name}」`).join("、");
}

function joinComparisonThemeNames(comparisons: ThemeComparison[]) {
  return comparisons.map((comparison) => `「${comparison.name}」`).join("、");
}

function comparisonDetail(comparison: ThemeComparison) {
  if (comparison.averageScore === null || comparison.diff === null) {
    return `${comparison.name}は${comparison.score.toFixed(1)}点です。現時点では比較対象となる過去受検者平均がまだ十分にないため、まずは自院内の現状確認を優先してください。`;
  }

  return `${comparison.name}は${comparison.score.toFixed(1)}点で、過去受検者平均${comparison.averageScore.toFixed(1)}点との差分は${comparison.diff >= 0 ? "+" : ""}${comparison.diff.toFixed(1)}点です。`;
}

function actionForTheme(themeName: string) {
  if (themeName.includes("人") || themeName.includes("採用") || themeName.includes("育成") || themeName.includes("定着")) {
    return "採用・定着・育成に関する現状を整理し、誰に何を任せるか、どの順番で育成するかを具体化する。";
  }
  if (themeName.includes("業務") || themeName.includes("収益") || themeName.includes("診療")) {
    return "予約、受付、診療、会計までの流れと数値を確認し、待ち時間・残業・収益性に影響している詰まりを洗い出す。";
  }
  if (themeName.includes("リスク") || themeName.includes("品質") || themeName.includes("安全") || themeName.includes("情報")) {
    return "安全管理、情報管理、緊急時対応のルールを確認し、属人的な運用になっている箇所を手順化する。";
  }
  if (themeName.includes("経営") || themeName.includes("権限") || themeName.includes("体制")) {
    return "院長、事務長、現場リーダーの役割と判断範囲を整理し、院長に集中している判断を段階的に移譲する。";
  }
  return "現場で起きている具体的な場面を確認し、改善テーマ、担当者、期限を決めて小さく実行する。";
}

function hasText(value?: string) {
  return Boolean(value && value.trim());
}

export function generateReportDraft(
  response: AdminResponse,
  scores: GroupScore[],
  comparisons: ThemeComparison[] = [],
  comparisonCount = 0,
): ReportDraft {
  const totalScore = Number(response.total_score);
  const validScores = scores.filter((score) => Number.isFinite(score.score));
  const highScores = [...validScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const lowScores = [...validScores].sort((a, b) => a.score - b.score).slice(0, 3);
  const relativeStrengths = comparisons
    .filter((comparison) => comparison.diff !== null && comparison.diff >= 0.3)
    .sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0))
    .slice(0, 3);
  const relativePriorities = comparisons
    .filter((comparison) => comparison.diff !== null && comparison.diff <= -0.3)
    .sort((a, b) => (a.diff ?? 0) - (b.diff ?? 0))
    .slice(0, 3);
  const topStrengths = relativeStrengths.length > 0 ? relativeStrengths : highScores.filter((score) => score.score >= 3.5).slice(0, 3);
  const priorities = relativePriorities.length > 0 ? relativePriorities : lowScores;
  const participant = response.participant_type === "director" ? "院長" : "事務長";
  const comparisonPrefix =
    comparisonCount > 0
      ? `現時点の過去受検者平均（比較対象${comparisonCount}件）との比較では、`
      : "現時点では比較対象となる過去受検者データがまだ十分にないため、";

  const overallTone =
    totalScore >= 4
      ? "全体として医院運営の土台は安定しており、既に複数のテーマで取り組みが進んでいる状態です。"
      : totalScore >= 3
        ? "全体として一定の取り組みは進んでいますが、テーマによって整備状況に差が見られます。"
        : "全体として、医院運営の仕組み化や役割分担に優先的に確認すべきテーマが残っている状態です。";

  const strengthNames = relativeStrengths.length > 0 ? joinComparisonThemeNames(relativeStrengths) : joinThemeNames(topStrengths as GroupScore[]);
  const priorityNames = relativePriorities.length > 0 ? joinComparisonThemeNames(relativePriorities) : joinThemeNames(priorities as GroupScore[]);
  const overall_comment = `${overallTone} ${comparisonPrefix}${strengthNames}は相対的な強みとして捉えられます。一方で、${priorityNames}は平均と比べて優先的に見直す候補です。過去受検者平均は現時点の参考値です。スコアだけで良し悪しを判断するのではなく、現場でどのような場面に表れているかを確認し、次のアクションにつなげることが重要です。`;

  const strengths_comment = topStrengths
    .map((score) => {
      if ("averageScore" in score) {
        return `${comparisonDetail(score)} 現時点の参考平均では相対的に高く、医院の運営基盤や現場対応を支える強みとして、今後の改善活動でも活かせます。`;
      }
      return `${score.name}は${score.score.toFixed(1)}点で、${scoreLabel(score.score)}領域です。このテーマは医院の運営基盤や現場対応を支える強みとして、今後の改善活動でも活かせます。`;
    })
    .join("\n\n");

  const priority_comment = priorities
    .map((score, index) => {
      if ("averageScore" in score) {
        return `${index + 1}. ${score.name}（${score.score.toFixed(1)}点）\n${comparisonDetail(score)} 現時点の参考平均では相対的に低く、優先的に見直すテーマとして確認したい領域です。${participant}だけで抱えるのではなく、現場の具体的な困りごとや判断が止まる場面を確認し、改善の入口を整理することが有効です。`;
      }
      return `${index + 1}. ${score.name}（${score.score.toFixed(1)}点）\nこのテーマは、他テーマと比べて優先的に確認したい領域です。${participant}だけで抱えるのではなく、現場の具体的な困りごとや判断が止まる場面を確認し、改善の入口を整理することが有効です。`;
    })
    .join("\n\n");

  const next_actions = priorities
    .map((score, index) => `${index + 1}. ${score.name}\n${actionForTheme(score.name)}`)
    .join("\n\n");

  return {
    overall_comment,
    strengths_comment,
    priority_comment,
    next_actions,
  };
}

export function applyDraftToEmptyReportFields(report: AdminReport | null, draft: ReportDraft): ReportDraft {
  return {
    overall_comment: hasText(report?.overall_comment) ? report?.overall_comment ?? "" : draft.overall_comment,
    strengths_comment: hasText(report?.strengths_comment) ? report?.strengths_comment ?? "" : draft.strengths_comment,
    priority_comment: hasText(report?.priority_comment) ? report?.priority_comment ?? "" : draft.priority_comment,
    next_actions: hasText(report?.next_actions) ? report?.next_actions ?? "" : draft.next_actions,
  };
}
