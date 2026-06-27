import type { AdminReport, AdminResponse } from "@/lib/admin/data";
import { GroupScore } from "@/lib/assessment";

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

export function generateReportDraft(response: AdminResponse, scores: GroupScore[]): ReportDraft {
  const totalScore = Number(response.total_score);
  const validScores = scores.filter((score) => Number.isFinite(score.score));
  const highScores = [...validScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const lowScores = [...validScores].sort((a, b) => a.score - b.score).slice(0, 3);
  const strengths = highScores.filter((score) => score.score >= 3.5);
  const priorities = lowScores;
  const topStrengths = strengths.length > 0 ? strengths : highScores.slice(0, 2);
  const participant = response.participant_type === "director" ? "院長" : "事務長";

  const overallTone =
    totalScore >= 4
      ? "全体として医院運営の土台は安定しており、既に複数のテーマで取り組みが進んでいる状態です。"
      : totalScore >= 3
        ? "全体として一定の取り組みは進んでいますが、テーマによって整備状況に差が見られます。"
        : "全体として、医院運営の仕組み化や役割分担に優先的に確認すべきテーマが残っている状態です。";

  const overall_comment = `${overallTone} 特に${joinThemeNames(topStrengths)}は相対的にスコアが高く、現在の医院運営を支える強みとして活かせる領域です。一方で、${joinThemeNames(priorities)}は今後の改善テーマとして確認するとよい領域です。スコアだけで良し悪しを判断するのではなく、現場でどのような場面に表れているかを確認し、次のアクションにつなげることが重要です。`;

  const strengths_comment = topStrengths
    .map((score) => `${score.name}は${score.score.toFixed(1)}点で、${scoreLabel(score.score)}領域です。このテーマは医院の運営基盤や現場対応を支える強みとして、今後の改善活動でも活かせます。`)
    .join("\n\n");

  const priority_comment = priorities
    .map((score, index) => `${index + 1}. ${score.name}（${score.score.toFixed(1)}点）\nこのテーマは、他テーマと比べて優先的に確認したい領域です。${participant}だけで抱えるのではなく、現場の具体的な困りごとや判断が止まる場面を確認し、改善の入口を整理することが有効です。`)
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
