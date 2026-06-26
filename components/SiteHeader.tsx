import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="top">
      <Link href="/" className="wordmark">
        院長<span>コンパス</span>
      </Link>
      <nav>
        <Link href="/#about">診断について</Link>
        <Link href="/#flow">ご利用の流れ</Link>
        <Link href="/admin">管理画面</Link>
      </nav>
    </header>
  );
}
