import { NextResponse } from "next/server";
import {
  Answers,
  getGroupedScores,
  getPriorities,
  getQuestions,
  getThemeScores,
  getTotalScore,
  Profile,
} from "@/lib/assessment";
import { sendCompletionEmails } from "@/lib/email/resend";
import { supabaseAdminFetch } from "@/lib/supabase/rest";

function questionSetCode(type: Profile["type"]) {
  return type === "director" ? "director-v1" : "office-manager-v1";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { profile?: Profile; answers?: Answers };
    const profile = body.profile;
    const answers = body.answers ?? {};

    if (!profile?.name || !profile.email || !profile.clinic || !profile.type) {
      return NextResponse.json({ ok: false, message: "基本情報が不足しています。" }, { status: 400 });
    }

    const questions = getQuestions(profile);
    const missing = questions.find((question) => !answers[question.id]);
    if (missing) {
      return NextResponse.json({ ok: false, message: `No.${missing.id}が未回答です。` }, { status: 400 });
    }

    const grouped = getGroupedScores(profile, answers);
    const total = getTotalScore(grouped);
    const priorities = getPriorities(grouped);
    const themeScores = getThemeScores(questions, answers);
    const submittedAt = new Date().toISOString();

    const inserted = (await supabaseAdminFetch("/rest/v1/clinic_assessment_responses", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        question_set_code: questionSetCode(profile.type),
        question_set_version: 1,
        participant_type: profile.type,
        name: profile.name,
        email: profile.email,
        clinic_name: profile.clinic,
        basic_info: {},
        total_score: Number(total.toFixed(2)),
        theme_scores: grouped.map((row) => ({
          name: row.name,
          score: Number(row.score.toFixed(2)),
          children: row.children,
        })),
        priority_themes: priorities.map((row) => ({
          name: row.name,
          score: Number(row.score.toFixed(2)),
        })),
        result_comment: "",
        cta: {
          label: "詳細フィードバックを依頼する",
          url: "https://timerex.net/s/sato.motoki_765a/c6616a1a",
        },
        submitted_at: submittedAt,
      }),
    })) as Array<{ id: string; result_token: string; submitted_at?: string }>;

    const response = inserted[0];
    if (!response?.id) {
      throw new Error("Failed to create assessment response.");
    }

    await supabaseAdminFetch("/rest/v1/clinic_assessment_response_answers", {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify(
        questions.map((question) => ({
          response_id: response.id,
          question_id: null,
          question_number: question.id,
          question_code: `${profile.type}-q${question.id}`,
          question_text_snapshot: question.text,
          theme_code: question.theme,
          theme_name_snapshot: question.theme,
          score: answers[question.id],
        })),
      ),
    });

    const mailResult = await sendCompletionEmails({
      profile,
      responseId: response.id,
      submittedAt: response.submitted_at || submittedAt,
    });

    const emailPatch: Record<string, string> = {};
    if (mailResult.respondent.ok) emailPatch.respondent_email_sent_at = new Date().toISOString();
    if (mailResult.respondent.error) emailPatch.respondent_email_error = mailResult.respondent.error;
    if (mailResult.client.ok) emailPatch.client_email_sent_at = new Date().toISOString();
    if (mailResult.client.error) emailPatch.client_email_error = mailResult.client.error;

    if (Object.keys(emailPatch).length > 0) {
      try {
        await supabaseAdminFetch(`/rest/v1/clinic_assessment_responses?id=eq.${encodeURIComponent(response.id)}`, {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify(emailPatch),
        });
      } catch (error) {
        console.error("[clinic-compass] Email status patch failed", error);
      }
    }

    return NextResponse.json({
      ok: true,
      responseId: response.id,
      resultToken: response.result_token,
      themeScores,
      priorities,
    });
  } catch (error) {
    console.error("[clinic-compass] Assessment completion failed", error);
    return NextResponse.json({ ok: false, message: "診断結果を保存できませんでした。" }, { status: 500 });
  }
}
