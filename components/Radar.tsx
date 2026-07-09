import { GroupScore } from "@/lib/assessment";

export function Radar({ data, averageData = [] }: { data: GroupScore[]; averageData?: GroupScore[] }) {
  const center = 150;
  const radius = 102;
  const n = data.length;
  const averageByName = new Map(averageData.map((row) => [row.name, row.score]));
  const point = (value: number, i: number) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / n;
    const r = (radius * value) / 5;
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  };
  const full = (v: number) => data.map((_, i) => point(v, i)).join(" ");
  const averagePoints = data.map((d, i) => point(averageByName.get(d.name) ?? 0, i)).join(" ");

  return (
    <div className="radar">
      <svg viewBox="0 0 300 300" role="img" aria-label="テーマ別レーダーチャート">
        {[1, 2, 3, 4, 5].map((v) => (
          <polygon key={v} points={full(v)} className="radar-grid" />
        ))}
        {data.map((d, i) => (
          <line
            key={d.name}
            x1={center}
            y1={center}
            x2={point(5, i).split(",")[0]}
            y2={point(5, i).split(",")[1]}
            className="radar-axis"
          />
        ))}
        {averageData.length > 0 && <polygon points={averagePoints} className="radar-average-area" />}
        <polygon points={data.map((d, i) => point(d.score, i)).join(" ")} className="radar-area" />
        {data.map((d, i) => {
          const angle = -Math.PI / 2 + (i * Math.PI * 2) / n;
          return (
            <text
              key={d.name}
              x={center + Math.cos(angle) * 128}
              y={center + Math.sin(angle) * 128}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-label"
            >
              {d.name}
            </text>
          );
        })}
      </svg>
      {averageData.length > 0 && (
        <div className="radar-legend">
          <span>
            <i className="current" />
            今回の結果
          </span>
          <span>
            <i className="average" />
            過去受検者平均
          </span>
        </div>
      )}
    </div>
  );
}
