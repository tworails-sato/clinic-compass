import { NextResponse } from "next/server";
import type { GroupScore } from "@/lib/assessment";
import { buildAverageComparison } from "@/lib/score-comparison";
import { supabaseAdminFetch } from "@/lib/supabase/rest";

type AverageRequest = {
  participantType?: string;
  responseId?: string;
  scores?: GroupScore[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AverageRequest;

    if (!body.participantType || !Array.isArray(body.scores)) {
      return NextResponse.json({ ok: false, message: "比較に必要なデータが不足しています。" }, { status: 400 });
    }

    const rows = (await supabaseAdminFetch(
      `/rest/v1/clinic_assessment_responses?deleted_at=is.null&participant_type=eq.${encodeURIComponent(body.participantType)}&select=id,participant_type,theme_scores,basic_info`,
    )) as Array<{ id: string; participant_type: string; theme_scores: unknown; basic_info?: unknown }>;

    const comparison = buildAverageComparison(body.scores, rows, {
      participantType: body.participantType,
      currentResponseId: body.responseId,
    });

    return NextResponse.json({ ok: true, ...comparison });
  } catch (error) {
    console.error("[clinic-compass] Average comparison failed", error);
    return NextResponse.json({ ok: false, message: "平均比較を取得できませんでした。" }, { status: 500 });
  }
}
