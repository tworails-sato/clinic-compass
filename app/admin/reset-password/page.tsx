"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"ready" | "missing" | "saving" | "done" | "error">("ready");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("access_token");
    setAccessToken(token ?? "");
    if (!token) setStatus("missing");
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    const response = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, password }),
    });
    setStatus(response.ok ? "done" : "error");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="wordmark" href="/">
          院長<span>コンパス</span>
        </Link>
        <p className="eyebrow teal">SET NEW PASSWORD</p>
        <h1>新しいパスワードを設定</h1>
        {status === "missing" && <div className="auth-alert">再設定リンクが無効、または期限切れです。もう一度メール送信からお試しください。</div>}
        {status === "done" ? (
          <>
            <div className="auth-success">パスワードを更新しました。</div>
            <Link className="button" href="/admin/login">
              ログインへ進む
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>
              新しいパスワード
              <input type="password" value={password} minLength={8} required onChange={(event) => setPassword(event.target.value)} />
            </label>
            {status === "error" && <div className="auth-alert">パスワードを更新できませんでした。リンクの有効期限をご確認ください。</div>}
            <button className="button" type="submit" disabled={!accessToken || status === "saving"}>
              {status === "saving" ? "更新中..." : "パスワードを更新"}
            </button>
          </form>
        )}
        <Link className="auth-link" href="/admin/forgot-password">
          再設定メールを送り直す
        </Link>
      </section>
    </main>
  );
}
