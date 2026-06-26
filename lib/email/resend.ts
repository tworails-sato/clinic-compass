import { Profile } from "@/lib/assessment";

type MailInput = {
  profile: Profile;
  responseId: string;
  resultUrl?: string;
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || "noreply@ceo-sherpa.com";
}

function clientNotifyEmail() {
  return process.env.CLIENT_NOTIFY_EMAIL || process.env.CLINIC_CLIENT_NOTIFICATION_EMAIL || "";
}

async function sendMail({ to, subject, html }: SendMailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[clinic-compass] RESEND_API_KEY is not configured. Mail skipped.");
    return { ok: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail(),
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend failed: ${response.status} ${message}`);
  }

  return { ok: true };
}

export async function sendCompletionEmails({ profile, responseId, resultUrl }: MailInput) {
  const resultText = resultUrl
    ? `診断結果は以下のURLからご確認いただけます。<br/><a href="${resultUrl}">${resultUrl}</a>`
    : "診断結果の詳細については、後日担当者よりご連絡いたします。";

  const respondentHtml = `
    <p>${profile.name} 様</p>
    <p>この度は、院長コンパスを受検いただき、ありがとうございました。</p>
    <p>${resultText}</p>
    <p>今後の医院経営の課題整理にお役立てください。</p>
  `;

  const participantType = profile.type === "director" ? "院長" : "事務長";
  const clientHtml = `
    <p>院長コンパスの診断が完了しました。</p>
    <ul>
      <li>回答ID：${responseId}</li>
      <li>医院名：${profile.clinic}</li>
      <li>氏名：${profile.name}</li>
      <li>メール：${profile.email}</li>
      <li>対象者区分：${participantType}</li>
    </ul>
  `;

  const result = {
    respondent: { ok: false, error: "" },
    client: { ok: false, error: "" },
  };

  try {
    await sendMail({
      to: profile.email,
      subject: "【院長コンパス】診断が完了しました",
      html: respondentHtml,
    });
    result.respondent.ok = true;
  } catch (error) {
    result.respondent.error = error instanceof Error ? error.message : "Unknown mail error";
    console.error("[clinic-compass] Respondent mail failed", error);
  }

  const notifyTo = clientNotifyEmail();
  if (notifyTo) {
    try {
      await sendMail({
        to: notifyTo,
        subject: "【院長コンパス】診断完了通知",
        html: clientHtml,
      });
      result.client.ok = true;
    } catch (error) {
      result.client.error = error instanceof Error ? error.message : "Unknown mail error";
      console.error("[clinic-compass] Client notification mail failed", error);
    }
  }

  return result;
}
