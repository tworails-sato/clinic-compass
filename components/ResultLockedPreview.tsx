import { Radar } from "@/components/Radar";
import type { GroupScore } from "@/lib/assessment";

type Props = {
  scores: GroupScore[];
  improvementHintCount: number;
};

const fallbackScores: GroupScore[] = [
  { name: "ビジョン", score: 3.6, children: [] },
  { name: "現場運営", score: 2.8, children: [] },
  { name: "組織づくり", score: 3.2, children: [] },
  { name: "数値管理", score: 2.6, children: [] },
  { name: "リスク管理", score: 3.4, children: [] },
  { name: "改善推進", score: 2.9, children: [] },
];

export function ResultLockedPreview({ scores, improvementHintCount }: Props) {
  const previewScores = scores.length > 0 ? scores : fallbackScores;
  const headline =
    improvementHintCount > 0
      ? `医院経営を伸ばすための、${improvementHintCount}つのポイントが見つかりました！`
      : "医院経営をさらに伸ばせるポイントが見つかりました！";

  return (
    <section className="locked-result-card">
      <p className="eyebrow teal">RESULT PREVIEW</p>
      <h2>{headline}</h2>
      <p className="locked-result-lead">
        詳細結果では、6領域スコア・レーダーチャート・強みと課題の整理を確認できます。
      </p>
      <p className="locked-result-warning">
        ※このページから離れると結果が見れなくなりますのでご注意ください。
      </p>

      <section className="result-preview" aria-hidden="true">
        <div className="result-preview__blur">
          <div className="result-preview__grid">
            <div className="result-preview__radar">
              <p className="eyebrow teal">THEME BALANCE</p>
              <h3>テーマ別スコア</h3>
              <Radar data={previewScores} />
            </div>
            <div className="result-preview__scores">
              <p className="eyebrow teal">SIX AREAS</p>
              <h3>6領域スコア</h3>
              <div className="preview-score-list">
                {previewScores.slice(0, 6).map((row) => (
                  <div key={row.name}>
                    <span>{row.name}</span>
                    <i>
                      <b style={{ width: `${Math.max(0, Math.min(100, (row.score / 5) * 100))}%` }} />
                    </i>
                    <strong>{row.score.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="result-preview__comment">
            <p className="eyebrow teal">REPORT COMMENT</p>
            <h3>強み・課題の整理</h3>
            <p>
              日々の診療や現場運営の状況をもとに、強みとして活かせる領域と、優先的に確認したいテーマを整理します。
            </p>
            <p>
              具体的な改善の入口として、役割分担・業務導線・数値管理など、次に話し合うべき観点を確認できます。
            </p>
          </div>
        </div>
        <div className="result-preview__watermark">SAMPLE</div>
        <div className="result-preview__overlay-cta">
          <p>詳しい診断結果を見るには、REFOLMO Medの会員登録が必要です</p>
        </div>
      </section>
    </section>
  );
}
