import { NextResponse } from "next/server";
import { Answers, getQuestions, Profile } from "@/lib/assessment";
import { supabaseAdminFetch } from "@/lib/supabase/rest";

type DraftBody = {
  action?: "save" | "complete";
  draftId?: string;
  responseId?: string;
  profile?: Partial<Profile>;
  answers?: Answers;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function answeredCount(answers: Answers) {
  return Object.values(answers).filter((value) => Number(value) >= 1 && Number(value) <= 5).length;
}

function totalQuestions(profile?: Partial<Profile>) {
  if (profile?.type === "director" || profile?.type === "office_manager") {
    return getQuestions({
      name: profile.name ?? "",
      email: profile.email ?? "",
      clinic: profile.clinic ?? "",
      type: profile.type,
      referralSource: profile.referralSource ?? "",
      referrerName: profile.referrerName ?? "",
    }).length;
  }
  return 36;
}

async function cleanupOldDrafts() {
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await supabaseAdminFetch(`/rest/v1/clinic_assessment_drafts?updated_at=lt.${encodeURIComponent(threshold)}&completed_at=is.null`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  } catch (error) {
    console.error("[clinic-compass] Draft cleanup failed", error);
  }
}

export async function POST(request: Request) {
  try {
    await cleanupOldDrafts();
    const body = (await request.json()) as DraftBody;
    const draftId = body.draftId?.trim();

    if (!draftId || !isUuid(draftId)) {
      return NextResponse.json({ ok: false, message: "途中保存IDが不正です。" }, { status: 400 });
    }

    if (body.action === "complete") {
      await supabaseAdminFetch("/rest/v1/clinic_assessment_drafts?on_conflict=draft_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          draft_id: draftId,
          status: "completed",
          profile: {},
          answers: {},
          answered_count: 0,
          total_questions: 0,
          completed_response_id: body.responseId ?? null,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        }),
      });

      return NextResponse.json({ ok: true, draftId });
    }

    const profile = body.profile ?? {};
    const answers = body.answers ?? {};
    const count = answeredCount(answers);
    const total = totalQuestions(profile);

    await supabaseAdminFetch("/rest/v1/clinic_assessment_drafts?on_conflict=draft_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        draft_id: draftId,
        status: count >= total && total > 0 ? "ready" : "draft",
        participant_type: profile.type || null,
        name: profile.name || null,
        email: profile.email || null,
        clinic_name: profile.clinic || null,
        profile,
        answers,
        answered_count: count,
        total_questions: total,
        last_accessed_at: new Date().toISOString(),
        completed_at: null,
        completed_response_id: null,
      }),
    });

    return NextResponse.json({ ok: true, draftId, answeredCount: count, totalQuestions: total });
  } catch (error) {
    console.error("[clinic-compass] Draft save failed", error);
    return NextResponse.json({ ok: false, message: "途中保存に失敗しました。" }, { status: 500 });
  }
}
