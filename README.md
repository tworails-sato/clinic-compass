# 院長コンパス

院長・事務長向けの医院経営アセスメントアプリです。対象者区分に応じた設問、テーマ別の結果表示、管理画面のローカルモックを備えています。

## ローカル起動

```powershell
cd C:\Users\user\Documents\Codex\2026-06-24\new-chat\clinic-compass-app
npm.cmd install
npm.cmd run dev
```

ブラウザで `http://localhost:3000` を開きます。管理画面モックは `/admin` です。

## Gitに含めるもの

- アプリケーションコード、設定ファイル、README
- `package.json` と `package-lock.json`
- 環境変数の雛形である `.env.example`

## Gitに含めないもの

`.env` 系の秘密情報、`node_modules/`、`.next/`、ローカルログは `.gitignore` で除外しています。

## 今後の実装

Supabaseへの回答保存、結果URL、Resendメール送信、認証付き管理画面、CSV出力を接続します。
