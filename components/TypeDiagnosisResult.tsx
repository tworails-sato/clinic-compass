"use client";

import { useState } from "react";
import {
  getTypeDefinition,
  getTypeDiagnosisConfig,
  type TypeDiagnosisResultData,
} from "@/lib/type-diagnosis/engine";

type Props = {
  result: TypeDiagnosisResultData | null;
  compact?: boolean;
  showMeta?: boolean;
};

const animalIcons: Record<string, string> = {
  オオカミ: "🐺",
  ライオン: "🦁",
  フクロウ: "🦉",
  シェパード: "🐕",
  ゾウ: "🐘",
  ハヤブサ: "🦅",
  カピバラ: "🦫",
  クジャク: "🦚",
  ビーバー: "🦫",
  キツネ: "🦊",
  カメ: "🐢",
  ゴリラ: "🦍",
  オウム: "🦜",
  イルカ: "🐬",
  ウマ: "🐴",
  ミーアキャット: "🐾",
  クロヒョウ: "🐆",
};

export function TypeDiagnosisResult({ result, compact = false, showMeta = true }: Props) {
  const [iconFailed, setIconFailed] = useState(false);

  if (!result) return null;

  const config = getTypeDiagnosisConfig(result.respondentType);
  const definition = getTypeDefinition(result.respondentType, result.mainTypeKey);
  const subDefinition = result.subTypeKey ? getTypeDefinition(result.respondentType, result.subTypeKey) : null;
  const featureRows = Object.entries(config.featureLabels).map(([key, label]) => ({
    key,
    label,
    score: result.featureScores[key] ?? 0,
  }));
  const auxiliaryRows = Object.entries(config.auxiliaryLabels).map(([key, label]) => ({
    key,
    label,
    score: result.auxiliaryScores[key] ?? 0,
  }));
  const animal = definition?.animal ?? "";
  const icon = animalIcons[animal] ?? "🧭";
  const iconPath = definition?.iconPath;

  return (
    <section className={`type-diagnosis-card ${compact ? "compact" : ""}`}>
      <div className="type-diagnosis-head">
        <div>
          <p className="eyebrow teal">{config.title}</p>
          <h2>
            <span className="type-animal-icon" aria-hidden="true">
              {iconPath && !iconFailed ? (
                <img src={iconPath} alt="" onError={() => setIconFailed(true)} />
              ) : (
                icon
              )}
            </span>
            {result.mainTypeLabel}
          </h2>
          <p>{definition?.summary ?? "回答傾向から医院経営スタイルを整理した参考タイプです。"}</p>
        </div>
        {showMeta && result.maturityLabel && (
          <span>
            成熟度
            <b>{result.maturityLabel}</b>
          </span>
        )}
      </div>

      {showMeta && result.typeJudgementStatus === "reference" && (
        <p className="type-note">条件に完全一致するタイプがないため、今回は回答傾向に最も近いタイプを参考表示しています。</p>
      )}

      <div className="type-summary-grid">
        <article>
          <small>メインタイプ</small>
          <strong>{result.mainTypeLabel}</strong>
        </article>
        <article>
          <small>サブタイプ候補</small>
          <strong>{result.subTypeLabel ?? "未判定"}</strong>
        </article>
        <article>
          <small>動物アイコン</small>
          <strong>
            {iconPath && !iconFailed ? <img className="type-inline-icon" src={iconPath} alt="" onError={() => setIconFailed(true)} /> : icon}{" "}
            {animal || subDefinition?.animal || "未設定"}
          </strong>
        </article>
        {showMeta && (
          <>
            <article>
              <small>判定ステータス</small>
              <strong>{result.typeJudgementStatus}</strong>
            </article>
            <article>
              <small>成熟度</small>
              <strong>{result.maturityLabel ?? "未判定"}</strong>
            </article>
            <article>
              <small>判定日時</small>
              <strong>{result.calculatedAt ? formatDate(result.calculatedAt) : "未記録"}</strong>
            </article>
          </>
        )}
      </div>

      {!compact && (
        <>
          <div className="type-score-block">
            <h3>6特性スコア</h3>
            <div className="type-feature-list">
              {featureRows.map((row) => (
                <div key={row.key}>
                  <span>{row.label}</span>
                  <i>
                    <b style={{ width: `${Math.max(0, Math.min(100, (row.score / 5) * 100))}%` }} />
                  </i>
                  <strong>{row.score.toFixed(1)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="type-score-block">
            <h3>補助指標</h3>
            <div className="type-auxiliary-grid">
              {auxiliaryRows.map((row) => (
                <div key={row.key}>
                  <span>{row.label}</span>
                  <strong>{row.score.toFixed(1)}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
