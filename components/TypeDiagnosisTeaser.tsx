"use client";

import { useState } from "react";
import { getTypeDefinition, type TypeDiagnosisResultData } from "@/lib/type-diagnosis/engine";

type Props = {
  result: TypeDiagnosisResultData | null;
};

const animalFallbacks: Record<string, string> = {
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

export function TypeDiagnosisTeaser({ result }: Props) {
  const [iconFailed, setIconFailed] = useState(false);

  if (!result) return null;

  const definition = getTypeDefinition(result.respondentType, result.mainTypeKey);
  const animal = definition?.animal ?? "";
  const fallback = animalFallbacks[animal] ?? "🧭";

  const scrollToRegistration = () => {
    document.getElementById("refolmo-registration")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="type-teaser-card">
      <p className="eyebrow teal">YOUR MANAGEMENT TYPE</p>
      <div className="type-teaser-main">
        <div className="type-teaser-icon" aria-hidden="true">
          {definition?.iconPath && !iconFailed ? (
            <img src={definition.iconPath} alt="" onError={() => setIconFailed(true)} />
          ) : (
            <span>{fallback}</span>
          )}
        </div>
        <div>
          <p>あなたの医院経営タイプは</p>
          <h2>「{result.mainTypeLabel}」です</h2>
          <span>
            回答から見えた、あなたの経営スタイルです。詳しい特徴や強み、気をつけたいポイントは詳細結果で確認できます。
          </span>
        </div>
      </div>
      <div className="type-teaser-locked" aria-hidden="true">
        <span>このタイプの特徴</span>
        <span>強みが活きる場面</span>
        <span>見直したいポイント</span>
      </div>
      <button className="button cta-yellow type-teaser-cta" type="button" onClick={scrollToRegistration}>
        タイプの解説・特徴を見る
      </button>
      <p className="type-teaser-note">無料会員登録後、タイプの詳しい解説と診断結果をご覧いただけます。</p>
    </section>
  );
}
