import type { ThemeComparison } from "@/lib/score-comparison";

export function AverageComparison({ comparisons, count }: { comparisons: ThemeComparison[]; count: number }) {
  if (!comparisons.length) return null;

  const strengths = comparisons.filter((comparison) => comparison.label === "平均より高い");
  const priorities = comparisons.filter((comparison) => comparison.label === "平均より低い");

  return (
    <section className="average-comparison">
      <div className="average-comparison-head">
        <div>
          <p className="eyebrow teal">REFERENCE AVERAGE</p>
          <h2>過去受検者平均との差分</h2>
        </div>
        <span>比較対象：過去受検者 {count}件</span>
      </div>
      <p className="average-note">
        過去受検者平均は、現時点の回答データをもとにした参考値です。
      </p>
      {(strengths.length > 0 || priorities.length > 0) && (
        <div className="average-highlight-grid">
          <article>
            <small>RELATIVE STRENGTH</small>
            <h3>相対的な強み</h3>
            {strengths.length > 0 ? (
              <ul>
                {strengths.map((comparison) => (
                  <li key={comparison.name}>
                    <strong>{comparison.name}</strong>
                    <span>{comparison.diff !== null ? `平均との差分 ${comparison.diff >= 0 ? "+" : ""}${comparison.diff.toFixed(1)}` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>現時点では、平均を明確に上回るテーマはありません。</p>
            )}
          </article>
          <article>
            <small>PRIORITY CHECK</small>
            <h3>優先確認テーマ</h3>
            {priorities.length > 0 ? (
              <ul>
                {priorities.map((comparison) => (
                  <li key={comparison.name}>
                    <strong>{comparison.name}</strong>
                    <span>{comparison.diff !== null ? `平均との差分 ${comparison.diff.toFixed(1)}` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>現時点では、平均を明確に下回るテーマはありません。</p>
            )}
          </article>
        </div>
      )}
      <div className="average-table">
        <div className="average-table-row average-table-header">
          <span>テーマ</span>
          <span>今回</span>
          <span>参考平均</span>
          <span>差分</span>
          <span>評価</span>
        </div>
        {comparisons.map((comparison) => (
          <div className="average-table-row" key={comparison.name}>
            <strong>{comparison.name}</strong>
            <span>{comparison.score.toFixed(1)}</span>
            <span>{comparison.averageScore === null ? "—" : comparison.averageScore.toFixed(1)}</span>
            <span className={comparison.diff === null ? "" : comparison.diff >= 0 ? "diff-plus" : "diff-minus"}>
              {comparison.diff === null ? "—" : `${comparison.diff >= 0 ? "+" : ""}${comparison.diff.toFixed(1)}`}
            </span>
            <span className={`average-label ${comparison.label === "平均より高い" ? "high" : comparison.label === "平均より低い" ? "low" : ""}`}>
              {comparison.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
