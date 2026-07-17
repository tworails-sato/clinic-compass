import { supabaseAdminFetch } from "@/lib/supabase/rest";
import { GroupScore } from "@/lib/assessment";
import { buildAverageComparison, type AverageComparisonResult } from "@/lib/score-comparison";
import { normalizeTypeDiagnosisResult, type TypeDiagnosisResultData } from "@/lib/type-diagnosis/engine";

export type AdminResponse = {
  id: string;
  participant_type: "director" | "office_manager";
  name: string;
  email: string;
  clinic_name: string;
  total_score: number | string;
  theme_scores: unknown;
  priority_themes: unknown;
  submitted_at: string;
  basic_info: unknown;
};

export type AdminAnswer = {
  id: string;
  question_number: number;
  question_text_snapshot: string;
  theme_name_snapshot: string;
  score: number;
};

export type AdminReport = {
  response_id: string;
  overall_comment?: string;
  strengths_comment?: string;
  priority_comment?: string;
  next_actions?: string;
  internal_notes?: string;
};

export type AdminTypeResultRow = {
  response_id: string;
  respondent_type: string;
  feature_scores: unknown;
  auxiliary_scores: unknown;
  main_type_key: string;
  main_type_label?: string;
  sub_type_key?: string | null;
  sub_type_label?: string | null;
  main_type_distance?: number | string | null;
  sub_type_distance?: number | string | null;
  type_distances?: unknown;
  excluded_candidate_reasons?: unknown;
  maturity_key?: string | null;
  maturity_label?: string | null;
  type_judgement_status?: string;
  type_logic_version?: string;
  calculated_at?: string;
};

export type AdminDraft = {
  id: string;
  draft_id: string;
  participant_type?: "director" | "office_manager" | null;
  name?: string | null;
  email?: string | null;
  clinic_name?: string | null;
  answered_count: number | string;
  total_questions: number | string;
  status: "draft" | "ready" | "completed";
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  completed_at?: string | null;
  completed_response_id?: string | null;
};

const responseSelect = "id,participant_type,name,email,clinic_name,total_score,theme_scores,priority_themes,submitted_at,basic_info";
const draftSelect =
  "id,draft_id,participant_type,name,email,clinic_name,answered_count,total_questions,status,created_at,updated_at,last_accessed_at,completed_at,completed_response_id";

export async function listResponses(): Promise<AdminResponse[]> {
  return supabaseAdminFetch(`/rest/v1/clinic_assessment_responses?deleted_at=is.null&select=${responseSelect}&order=submitted_at.desc`) as Promise<AdminResponse[]>;
}

export async function listDrafts(): Promise<AdminDraft[]> {
  return supabaseAdminFetch(
    `/rest/v1/clinic_assessment_drafts?select=${draftSelect}&order=last_accessed_at.desc&limit=50`,
  ) as Promise<AdminDraft[]>;
}

export async function getResponse(responseId: string): Promise<AdminResponse | null> {
  const rows = (await supabaseAdminFetch(
    `/rest/v1/clinic_assessment_responses?id=eq.${encodeURIComponent(responseId)}&deleted_at=is.null&select=${responseSelect}&limit=1`,
  )) as AdminResponse[];
  return rows[0] ?? null;
}

export async function getAnswers(responseId: string): Promise<AdminAnswer[]> {
  return supabaseAdminFetch(
    `/rest/v1/clinic_assessment_response_answers?response_id=eq.${encodeURIComponent(responseId)}&select=id,question_number,question_text_snapshot,theme_name_snapshot,score&order=question_number.asc`,
  ) as Promise<AdminAnswer[]>;
}

export async function getReport(responseId: string): Promise<AdminReport | null> {
  const rows = (await supabaseAdminFetch(
    `/rest/v1/clinic_assessment_reports?response_id=eq.${encodeURIComponent(responseId)}&select=response_id,overall_comment,strengths_comment,priority_comment,next_actions,internal_notes&limit=1`,
  )) as AdminReport[];
  return rows[0] ?? null;
}

export async function getTypeResult(responseId: string): Promise<TypeDiagnosisResultData | null> {
  const rows = (await supabaseAdminFetch(
    `/rest/v1/clinic_assessment_type_results?response_id=eq.${encodeURIComponent(responseId)}&select=*&limit=1`,
  )) as AdminTypeResultRow[];
  return normalizeTypeDiagnosisResult(rows[0] ?? null);
}

export async function getAverageComparisonForResponse(
  response: Pick<AdminResponse, "id" | "participant_type">,
  currentScores: GroupScore[],
): Promise<AverageComparisonResult> {
  const rows = (await supabaseAdminFetch(
    `/rest/v1/clinic_assessment_responses?deleted_at=is.null&participant_type=eq.${encodeURIComponent(response.participant_type)}&select=id,participant_type,theme_scores,basic_info`,
  )) as Array<Pick<AdminResponse, "id" | "participant_type" | "theme_scores" | "basic_info">>;

  return buildAverageComparison(currentScores, rows, {
    participantType: response.participant_type,
    currentResponseId: response.id,
  });
}

export function participantLabel(type: AdminResponse["participant_type"]) {
  return type === "director" ? "院長" : "事務長";
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatReferralMemo(basicInfo: unknown) {
  if (!basicInfo || typeof basicInfo !== "object") return "";

  const row = basicInfo as Record<string, unknown>;
  const referralSource = String(row.referral_source ?? "").trim();
  const referrerName = String(row.referrer_name ?? "").trim();

  if (!referralSource && !referrerName) return "";

  return [
    "【紹介情報】",
    referralSource ? `紹介元：${referralSource}` : "",
    referrerName ? `ご紹介者様のお名前：${referrerName}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function normalizeScores(value: unknown): GroupScore[] {
  if (Array.isArray(value)) {
    return value.reduce<GroupScore[]>((items, item) => {
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const name = String(row.name ?? row.theme ?? "");
        const score = Number(row.score ?? 0);
        if (name) items.push({ name, score, children: [] });
      }
      return items;
    }, []);
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([name, score]) => ({
      name,
      score: Number(score),
      children: [],
    }));
  }

  return [];
}

export function normalizePriorities(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const row = item as Record<string, unknown>;
          return String(row.name ?? row.theme ?? "");
        }
        return "";
      })
      .filter(Boolean);
  }

  return [];
}
