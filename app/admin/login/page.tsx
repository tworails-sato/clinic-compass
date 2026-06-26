import Link from "next/link";
import { loginAction } from "@/app/admin/auth-actions";

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="wordmark" href="/">
          院長<span>コンパス</span>
        </Link>
        <p className="eyebrow teal">ADMIN LOGIN</p>
        <h1>管理画面ログイン</h1>
        <p>登録済みのメールアドレスとパスワードでログインしてください。</p>
        {params?.error && <div className="auth-alert">メールアドレスまたはパスワードを確認してください。</div>}
        <form action={loginAction} className="auth-form">
          <label>
            メールアドレス
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            パスワード
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button" type="submit">
            ログイン
          </button>
        </form>
        <Link className="auth-link" href="/admin/forgot-password">
          パスワードを忘れた場合
        </Link>
      </section>
    </main>
  );
}
