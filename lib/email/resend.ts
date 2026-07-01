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
const ADMIN_NOTIFICATION_INTERVAL_MS = 700;
const RATE_LIMIT_RETRY_MS = 1500;

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || "noreply@ceo-sherpa.com";
}

function timerexUrl() {
  return process.env.TIMEREX_URL || process.env.NEXT_PUBLIC_TIMEREX_URL || "";
}

function hasFullWidthCharacters(value: string) {
  return /[^\x00-\x7F]/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientNotifyEmails() {
  const raw = process.env.CLIENT_NOTIFY_EMAIL ?? process.env.CLINIC_CLIENT_NOTIFICATION_EMAIL ?? "";
  const emails = raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return emails.filter((email) => {
    if (hasFullWidthCharacters(email)) {
      console.warn(`[clinic-compass] CLIENT_NOTIFY_EMAIL contains full-width characters: ${email}`);
    }
    if (!isValidEmail(email)) {
      console.warn(`[clinic-compass] CLIENT_NOTIFY_EMAIL contains invalid email address: ${email}`);
      return false;
    }
    return true;
  });
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown) {
  return error instanceof Error && (error.message.includes("429") || error.message.includes("rate_limit_exceeded"));
}

async function sendMail({ to, subject, html }: SendMailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[clinic-compass] RESEND_API_KEY is not configured. Mail skipped.");
    return { ok: false, skipped: true, id: "" };
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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Resend failed: ${response.status} ${text}`);
  }

  const data = text ? (JSON.parse(text) as { id?: string }) : {};
  return { ok: true, skipped: false, id: data.id || "" };
}

async function sendAdminNotification(to: string, html: string) {
  return sendMail({
    to,
    subject: "【院長コンパス】新しい診断が完了しました",
    html,
  });
}

async function sendAdminNotificationWithRetry(to: string, html: string) {
  try {
    return await sendAdminNotification(to, html);
  } catch (error) {
    if (!isRateLimitError(error)) throw error;
    console.warn(`[clinic-compass] Admin notification rate limited. retrying once after ${RATE_LIMIT_RETRY_MS}ms. to=${to}`, error);
    await sleep(RATE_LIMIT_RETRY_MS);
    return sendAdminNotification(to, html);
  }
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
    const sent = await sendMail({
      to: profile.email,
      subject: "【院長コンパス】診断結果のご案内",
      html: respondentHtml,
    });
    result.respondent.ok = sent.ok;
    console.info(`[clinic-compass] Respondent mail accepted. to=${profile.email} id=${sent.id || "n/a"}`);
  } catch (error) {
    result.respondent.error = error instanceof Error ? error.message : "Unknown mail error";
    console.error("[clinic-compass] Respondent mail failed", error);
  }

  const notifyEmails = clientNotifyEmails();
  if (notifyEmails.length === 0) {
    console.info("[clinic-compass] CLIENT_NOTIFY_EMAIL is not configured. Client notification skipped.");
    return result;
  }

  console.info(`[clinic-compass] Sending client notification to ${notifyEmails.length} recipient(s): ${notifyEmails.join(",")}`);

  const clientErrors: string[] = [];
  let clientSuccessCount = 0;

  for (const [index, email] of notifyEmails.entries()) {
    if (index > 0) {
      console.info(`[clinic-compass] Waiting ${ADMIN_NOTIFICATION_INTERVAL_MS}ms before next admin notification. to=${email}`);
      await sleep(ADMIN_NOTIFICATION_INTERVAL_MS);
    }

    try {
      const sent = await sendAdminNotificationWithRetry(email, clientHtml);
      if (sent.ok) clientSuccessCount += 1;
      console.info(`[clinic-compass] Admin notification accepted. to=${email} id=${sent.id || "n/a"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown mail error";
      clientErrors.push(`${email}: ${message}`);
      console.error("[clinic-compass] Admin notification failed:", email, error);
    }
  }

  result.client.ok = clientSuccessCount > 0;
  result.client.error = clientErrors.join("\n");

  return result;
}
