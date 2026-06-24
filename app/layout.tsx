import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "院長コンパス", description: "医院経営・運営アセスメント" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
