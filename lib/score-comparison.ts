import type { GroupScore } from "@/lib/assessment";

export type AverageSourceResponse = {
  id: string;
  participant_type: string;
  theme_scores: unknown;
  basic_info?: unknown;
};

export type ThemeAverage = {
  name: string;
  score: number;
};

export type ThemeComparison = {
  name: string;
  score: number;
  averageScore: number | null;
  diff: number | null;
  label: "平均より高い" | "平均並み" | "平均より低い" | "比較対象なし";
};

export type AverageComparisonResult = {
  count: number;
  averages: ThemeAverage[];
  comparisons: ThemeComparison[];
};

function normalizeThemeScores(value: unknown): GroupScore[] {
  if (Array.isArray(value)) {
    return value.reduce<GroupScore[]>((items, item) => {
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const name = String(row.name ?? row.theme ?? "");
        const score = Number(row.score ?? 0);
        const children = Array.isArray(row.children) ? row.children.map(String) : [];
        if (name && Number.isFinite(score)) items.push({ name, score, children });
      }
      return items;
    }, []);
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([name, score]) => ({
      name,
      score: Number(score),
      children: [],
    }));
  }

  return [];
}

function isTestResponse(response: AverageSourceResponse) {
  if (!response.basic_info || typeof response.basic_info !== "object") return false;
  const row = response.basic_info as Record<string, unknown>;
  return row.is_test === true || row.test === true || row.exclude_from_average === true;
}

function comparisonLabel(diff: number | null): ThemeComparison["label"] {
  if (diff === null) return "比較対象なし";
  if (diff >= 0.3) return "平均より高い";
  if (diff <= -0.3) return "平均より低い";
  return "平均並み";
}

export function buildAverageComparison(
  currentScores: GroupScore[],
  sourceResponses: AverageSourceResponse[],
  options: { participantType: string; currentResponseId?: string },
): AverageComparisonResult {
  const comparableResponses = sourceResponses.filter(
    (response) =>
      response.participant_type === options.participantType &&
      response.id !== options.currentResponseId &&
      !isTestResponse(response),
  );

  const scoreBuckets = new Map<string, number[]>();

  comparableResponses.forEach((response) => {
    normalizeThemeScores(response.theme_scores).forEach((score) => {
      const values = scoreBuckets.get(score.name) ?? [];
      values.push(score.score);
      scoreBuckets.set(score.name, values);
    });
  });

  const averages = currentScores.map((score) => {
    const values = scoreBuckets.get(score.name) ?? [];
    return {
      name: score.name,
      score: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    };
  });

  const comparisons = currentScores.map((score) => {
    const average = averages.find((row) => row.name === score.name);
    const hasAverage = Boolean(average && scoreBuckets.get(score.name)?.length);
    const averageScore = hasAverage ? Number((average?.score ?? 0).toFixed(2)) : null;
    const diff = averageScore === null ? null : Number((score.score - averageScore).toFixed(2));

    return {
      name: score.name,
      score: Number(score.score.toFixed(2)),
      averageScore,
      diff,
      label: comparisonLabel(diff),
    };
  });

  return {
    count: comparableResponses.length,
    averages: averages.filter((average) => (scoreBuckets.get(average.name)?.length ?? 0) > 0),
    comparisons,
  };
}

export function averageScoreForTheme(comparisons: ThemeComparison[], themeName: string) {
  return comparisons.find((comparison) => comparison.name === themeName)?.averageScore ?? null;
}
