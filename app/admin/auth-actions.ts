"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieNames } from "@/lib/admin/session";
import { requestPasswordRecovery, signInWithPassword } from "@/lib/supabase/rest";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await signInWithPassword(email, password);

  if (!result) redirect("/admin/login?error=1");

  const store = await cookies();
  store.set(adminCookieNames.accessToken, result.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.expires_in,
  });
  store.set(adminCookieNames.refreshToken, result.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(adminCookieNames.accessToken);
  store.delete(adminCookieNames.refreshToken);
  redirect("/admin/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (email) {
    try {
      await requestPasswordRecovery(email, `${appUrl()}/admin/reset-password`);
    } catch {
      // 内部エラーや未登録メールの詳細は画面へ出さない
    }
  }

  redirect("/admin/forgot-password?sent=1");
}
