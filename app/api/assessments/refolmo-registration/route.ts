import { NextResponse } from "next/server";
import { Profile } from "@/lib/assessment";
import { sendCompletionEmails } from "@/lib/email/resend";
import { supabaseAdminFetch } from "@/lib/supabase/rest";

type Body = {
  responseId?: string;
  resultToken?: string;
  profile?: Profile;
};

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://clinic.ceo-sherpa.com").replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const responseId = body.responseId?.trim();
    const profile = body.profile;

    if (!responseId || !profile?.type || !profile.name?.trim() || !profile.email?.trim() || !profile.clinic?.trim()) {
      return NextResponse.json({ ok: false, message: "登録情報が不足しています。" }, { status: 400 });
    }

    await supabaseAdminFetch(`/rest/v1/clinic_assessment_responses?id=eq.${encodeURIComponent(responseId)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: profile.name.trim(),
        email: profile.email.trim(),
        clinic_name: profile.clinic.trim(),
      }),
    });

    let submittedAt = new Date().toISOString();
    let resultToken = body.resultToken?.trim() ?? "";

    try {
      const rows = (await supabaseAdminFetch(
        `/rest/v1/clinic_assessment_responses?id=eq.${encodeURIComponent(responseId)}&select=submitted_at,result_token&limit=1`,
      )) as Array<{ submitted_at?: string | null; result_token?: string | null }>;
      submittedAt = rows[0]?.submitted_at || submittedAt;
      resultToken = rows[0]?.result_token || resultToken;
    } catch (error) {
      console.error("[clinic-compass] Registered response reload failed", error);
    }

    const mailResult = await sendCompletionEmails({
      profile,
      responseId,
      submittedAt,
      resultUrl: resultToken ? `${appBaseUrl()}/result/${resultToken}` : undefined,
    });

    const emailPatch: Record<string, string> = {};
    if (mailResult.respondent.ok) emailPatch.respondent_email_sent_at = new Date().toISOString();
    if (mailResult.respondent.error) emailPatch.respondent_email_error = mailResult.respondent.error;
    if (mailResult.client.ok) emailPatch.client_email_sent_at = new Date().toISOString();
    if (mailResult.client.error) emailPatch.client_email_error = mailResult.client.error;

    if (Object.keys(emailPatch).length > 0) {
      try {
        await supabaseAdminFetch(`/rest/v1/clinic_assessment_responses?id=eq.${encodeURIComponent(responseId)}`, {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify(emailPatch),
        });
      } catch (error) {
        console.error("[clinic-compass] Registered email status patch failed", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[clinic-compass] REFOLMO registration sync failed", error);
    return NextResponse.json({ ok: false, message: "登録情報を反映できませんでした。" }, { status: 500 });
  }
}
