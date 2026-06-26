import Link from "next/link";
import { forgotPasswordAction } from "@/app/admin/auth-actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams?: Promise<{ sent?: string }> }) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="wordmark" href="/">
          院長<span>コンパス</span>
        </Link>
        <p className="eyebrow teal">PASSWORD RESET</p>
        <h1>パスワード再設定</h1>
        {params?.sent ? (
          <div className="auth-success">該当するアカウントがある場合、再設定メールを送信しました。</div>
        ) : (
          <>
            <p>登録済みのメールアドレスを入力してください。</p>
            <form action={forgotPasswordAction} className="auth-form">
              <label>
                メールアドレス
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <button className="button" type="submit">
                再設定メールを送信
              </button>
            </form>
          </>
        )}
        <Link className="auth-link" href="/admin/login">
          ログイン画面へ戻る
        </Link>
      </section>
    </main>
  );
}
