import { supabaseAdminFetch } from "@/lib/supabase/rest";
import { GroupScore } from "@/lib/assessment";

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

const responseSelect = "id,participant_type,name,email,clinic_name,total_score,theme_scores,priority_themes,submitted_at";

export async function listResponses(): Promise<AdminResponse[]> {
  return supabaseAdminFetch(`/rest/v1/clinic_assessment_responses?deleted_at=is.null&select=${responseSelect}&order=submitted_at.desc`) as Promise<AdminResponse[]>;
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

export function participantLabel(type: AdminResponse["participant_type"]) {
  return type === "director" ? "院長" : "事務長";
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
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
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        return String(row.name ?? row.theme ?? "");
      }
      return "";
    }).filter(Boolean);
  }

  return [];
}
