import { Profile } from "@/lib/assessment";

type MailInput = {
  profile: Profile;
  responseId: string;
  submittedAt: string;
  resultUrl?: string;
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

type MailStatus = {
  ok: boolean;
  error: string;
};

const ADMIN_URL = "https://clinic.ceo-sherpa.com/admin";

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || "noreply@ceo-sherpa.com";
}

function timerexUrl() {
  return process.env.TIMEREX_URL || process.env.NEXT_PUBLIC_TIMEREX_URL || "";
}

function normalizeEmail(value: string) {
  const trimmed = value.trim();
  const markdownMailto = trimmed.match(/\]\(mailto:([^)]+)\)/i);
  if (markdownMailto?.[1]) return markdownMailto[1].trim();

  return trimmed
    .replace(/^mailto:/i, "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/[<>]/g, "")
    .trim();
}

function clientNotifyEmails() {
  const raw = process.env.CLIENT_NOTIFY_EMAIL || process.env.CLINIC_CLIENT_NOTIFICATION_EMAIL || "";
  return [...new Set(raw.split(/[,;\n]/).map(normalizeEmail).filter(Boolean))];
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

export async function sendCompletionEmails({ profile, responseId, submittedAt, resultUrl }: MailInput) {
  const feedbackUrl = timerexUrl();
  const resultBlock = resultUrl
    ? `
      <p>診断結果は、以下のURLよりご確認いただけます。</p>
      <p><strong>【診断結果を確認する】</strong><br/><a href="${resultUrl}">${resultUrl}</a></p>
      <p>※結果確認URLの有効期限は、受検完了日から7日間です。</p>
    `
    : "<p>診断結果の詳細については、後日担当者よりご連絡いたします。</p>";
  const feedbackBlock = feedbackUrl
    ? `
      <p>また、診断結果をもとに、医院の課題整理や改善の優先順位について個別フィードバックをご希望の場合は、以下よりご予約ください。</p>
      <p><strong>【個別フィードバックを予約する】</strong><br/><a href="${feedbackUrl}">${feedbackUrl}</a></p>
    `
    : "";

  const respondentHtml = `
    <p>${profile.name} 様</p>
    <p>この度は、院長コンパスを受検いただき、ありがとうございました。</p>
    ${resultBlock}
    ${feedbackBlock}
    <p>今後ともよろしくお願いいたします。</p>
  `;

  const participantType = profile.type === "director" ? "院長" : "事務長";
  const clientHtml = `
    <p>院長コンパスで新しい診断が完了しました。</p>
    <ul>
      <li>回答ID：${responseId}</li>
      <li>受検者名：${profile.name}</li>
      <li>メールアドレス：${profile.email}</li>
      <li>医院名：${profile.clinic}</li>
      <li>対象者区分：${participantType}</li>
      <li>診断日時：${formatSubmittedAt(submittedAt)}</li>
      <li>管理画面URL：<a href="${ADMIN_URL}">${ADMIN_URL}</a></li>
    </ul>
  `;

  const result: { respondent: MailStatus; client: MailStatus } = {
    respondent: { ok: false, error: "" },
    client: { ok: false, error: "" },
  };

  try {
    await sendMail({
      to: profile.email,
      subject: "【院長コンパス】診断結果のご案内",
      html: respondentHtml,
    });
    result.respondent.ok = true;
  } catch (error) {
    result.respondent.error = error instanceof Error ? error.message : "Unknown mail error";
    console.error("[clinic-compass] Respondent mail failed", error);
  }

  const notifyEmails = clientNotifyEmails();
  if (notifyEmails.length === 0) {
    console.info("[clinic-compass] CLIENT_NOTIFY_EMAIL is not configured. Client notification skipped.");
    return result;
  }

  console.info(`[clinic-compass] Sending client notification to ${notifyEmails.length} recipient(s).`);

  const clientErrors: string[] = [];
  let clientSuccessCount = 0;

  for (const to of notifyEmails) {
    try {
      await sendMail({
        to,
        subject: "【院長コンパス】新しい診断が完了しました",
        html: clientHtml,
      });
      clientSuccessCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown mail error";
      clientErrors.push(`${to}: ${message}`);
      console.error(`[clinic-compass] Client notification mail failed: ${to}`, error);
    }
  }

  result.client.ok = clientSuccessCount > 0;
  result.client.error = clientErrors.join("\n");

  return result;
}
