import {
  getTypeDefinition,
  getTypeDiagnosisConfig,
  type TypeDiagnosisResultData,
} from "@/lib/type-diagnosis/engine";

type Props = {
  result: TypeDiagnosisResultData | null;
  compact?: boolean;
};

export function TypeDiagnosisResult({ result, compact = false }: Props) {
  if (!result) return null;

  const config = getTypeDiagnosisConfig(result.respondentType);
  const definition = getTypeDefinition(result.respondentType, result.mainTypeKey);
  const featureRows = Object.entries(config.featureLabels).map(([key, label]) => ({
    key,
    label,
    score: result.featureScores[key] ?? 0,
  }));

  return (
    <section className={`type-diagnosis-card ${compact ? "compact" : ""}`}>
      <div className="type-diagnosis-head">
        <div>
          <p className="eyebrow teal">{config.title}</p>
          <h2>{result.mainTypeLabel}</h2>
          <p>{definition?.summary ?? "回答傾向から医院経営スタイルを整理した参考タイプです。"}</p>
        </div>
        {result.maturityLabel && (
          <span>
            成熟度
            <b>{result.maturityLabel}</b>
          </span>
        )}
      </div>

      {result.typeJudgementStatus === "reference" && (
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
      </div>

      {!compact && (
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
      )}
    </section>
  );
}
