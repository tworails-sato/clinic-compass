import { ParticipantType } from "@/lib/questions";
import {
  type Condition,
  type RespondentType,
  type ScoreRef,
  type TypeDefinition,
  type TypeDiagnosisConfig,
  doctorTypeConfig,
  managerTypeConfig,
} from "@/lib/type-diagnosis/config";

type Answers = Record<number, number>;

export type TypeDistance = {
  typeKey: string;
  label: string;
  distance: number;
  matchedRequiredCount: number;
  requiredCount: number;
  excludedReasons: string[];
};

export type TypeDiagnosisResultData = {
  respondentType: RespondentType;
  featureScores: Record<string, number>;
  auxiliaryScores: Record<string, number>;
  mainTypeKey: string;
  mainTypeLabel: string;
  subTypeKey: string | null;
  subTypeLabel: string | null;
  mainTypeDistance: number;
  subTypeDistance: number | null;
  typeDistances: TypeDistance[];
  excludedCandidateReasons: Array<{ typeKey: string; label: string; reasons: string[] }>;
  maturityKey: string | null;
  maturityLabel: string | null;
  typeJudgementStatus: "standard" | "reference";
  typeLogicVersion: string;
  calculatedAt: string;
};

export const TYPE_LOGIC_VERSION = "clinic-compass-12type-v1";

export function respondentTypeForParticipant(participantType?: ParticipantType | null): RespondentType | null {
  if (participantType === "director") return "doctor";
  if (participantType === "office_manager") return "manager";
  return null;
}

export function participantTypeForRespondent(respondentType?: RespondentType | null): ParticipantType | null {
  if (respondentType === "doctor") return "director";
  if (respondentType === "manager") return "office_manager";
  return null;
}

export function getTypeDiagnosisConfig(respondentType: RespondentType): TypeDiagnosisConfig {
  return respondentType === "doctor" ? doctorTypeConfig : managerTypeConfig;
}

export function getTypeDefinition(respondentType: RespondentType, typeKey: string): TypeDefinition | null {
  return getTypeDiagnosisConfig(respondentType).types.find((type) => type.key === typeKey) ?? null;
}

export function calculateTypeDiagnosis(
  participantType: ParticipantType | RespondentType,
  answers: Answers,
  totalScore?: number,
): TypeDiagnosisResultData | null {
  const respondentType =
    participantType === "doctor" || participantType === "manager" ? participantType : respondentTypeForParticipant(participantType);
  if (!respondentType) return null;

  const config = getTypeDiagnosisConfig(respondentType);
  const featureScores = scoreGroups(config.features, answers);
  const auxiliaryScores = Object.fromEntries(
    Object.entries(config.auxiliaries).map(([key, source]) => {
      if (Array.isArray(source)) return [key, round1(averageQuestions(source, answers))];
      return [key, round1(6 - averageQuestions(source.inverseAverageOf, answers))];
    }),
  );

  const scored = config.types.map((type) => {
    const excludedReasons = evaluateRequired(type.required ?? [], {
      answers,
      featureScores,
      auxiliaryScores,
      config,
    });
    return {
      typeKey: type.key,
      label: type.label,
      distance: round3(euclideanDistance(featureScores, type.baseline)),
      requiredCount: type.required?.length ?? 0,
      matchedRequiredCount: (type.required?.length ?? 0) - excludedReasons.length,
      excludedReasons,
    } satisfies TypeDistance;
  });

  const eligible = scored.filter((row) => row.excludedReasons.length === 0);
  const ranked = [...(eligible.length > 0 ? eligible : scored)].sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.matchedRequiredCount - a.matchedRequiredCount;
  });
  const main = ranked[0] ?? scored[0];
  const sub = ranked.find((row) => row.typeKey !== main?.typeKey) ?? null;

  if (!main) return null;

  const mainDefinition = getTypeDefinition(respondentType, main.typeKey);
  const subDefinition = sub ? getTypeDefinition(respondentType, sub.typeKey) : null;
  const maturity = pickMaturity(config, totalScore ?? average(Object.values(featureScores)));

  return {
    respondentType,
    featureScores,
    auxiliaryScores,
    mainTypeKey: main.typeKey,
    mainTypeLabel: mainDefinition?.label ?? main.label,
    subTypeKey: sub?.typeKey ?? null,
    subTypeLabel: subDefinition?.label ?? sub?.label ?? null,
    mainTypeDistance: main.distance,
    subTypeDistance: sub?.distance ?? null,
    typeDistances: scored.sort((a, b) => a.distance - b.distance),
    excludedCandidateReasons: scored
      .filter((row) => row.excludedReasons.length > 0)
      .map((row) => ({ typeKey: row.typeKey, label: row.label, reasons: row.excludedReasons })),
    maturityKey: maturity?.key ?? null,
    maturityLabel: maturity?.label ?? null,
    typeJudgementStatus: eligible.length > 0 ? "standard" : "reference",
    typeLogicVersion: TYPE_LOGIC_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}

export function normalizeTypeDiagnosisResult(value: unknown): TypeDiagnosisResultData | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const respondentType = row.respondent_type ?? row.respondentType;
  const mainTypeKey = row.main_type_key ?? row.mainTypeKey;
  if (respondentType !== "doctor" && respondentType !== "manager") return null;
  if (!mainTypeKey || typeof mainTypeKey !== "string") return null;
  const mainDefinition = getTypeDefinition(respondentType, mainTypeKey);
  const subTypeKey = typeof (row.sub_type_key ?? row.subTypeKey) === "string" ? String(row.sub_type_key ?? row.subTypeKey) : null;
  const subDefinition = subTypeKey ? getTypeDefinition(respondentType, subTypeKey) : null;

  return {
    respondentType,
    featureScores: normalizeNumberRecord(row.feature_scores ?? row.featureScores),
    auxiliaryScores: normalizeNumberRecord(row.auxiliary_scores ?? row.auxiliaryScores),
    mainTypeKey,
    mainTypeLabel: String(row.main_type_label ?? row.mainTypeLabel ?? mainDefinition?.label ?? mainTypeKey),
    subTypeKey,
    subTypeLabel: row.sub_type_label ? String(row.sub_type_label) : row.subTypeLabel ? String(row.subTypeLabel) : subDefinition?.label ?? null,
    mainTypeDistance: Number(row.main_type_distance ?? row.mainTypeDistance ?? 0),
    subTypeDistance: row.sub_type_distance || row.subTypeDistance ? Number(row.sub_type_distance ?? row.subTypeDistance) : null,
    typeDistances: Array.isArray(row.type_distances ?? row.typeDistances) ? ((row.type_distances ?? row.typeDistances) as TypeDistance[]) : [],
    excludedCandidateReasons: Array.isArray(row.excluded_candidate_reasons ?? row.excludedCandidateReasons)
      ? ((row.excluded_candidate_reasons ?? row.excludedCandidateReasons) as Array<{ typeKey: string; label: string; reasons: string[] }>)
      : [],
    maturityKey: typeof (row.maturity_key ?? row.maturityKey) === "string" ? String(row.maturity_key ?? row.maturityKey) : null,
    maturityLabel: typeof (row.maturity_label ?? row.maturityLabel) === "string" ? String(row.maturity_label ?? row.maturityLabel) : null,
    typeJudgementStatus: row.type_judgement_status === "reference" || row.typeJudgementStatus === "reference" ? "reference" : "standard",
    typeLogicVersion: String(row.type_logic_version ?? row.typeLogicVersion ?? TYPE_LOGIC_VERSION),
    calculatedAt: String(row.calculated_at ?? row.calculatedAt ?? ""),
  };
}

function scoreGroups(groups: Record<string, number[]>, answers: Answers) {
  return Object.fromEntries(Object.entries(groups).map(([key, questionIds]) => [key, round1(averageQuestions(questionIds, answers))]));
}

function averageQuestions(questionIds: number[], answers: Answers) {
  const scores = questionIds.map((id) => Number(answers[id] ?? 0)).filter((score) => score > 0);
  return average(scores);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function euclideanDistance(scores: Record<string, number>, baseline: Record<string, number>) {
  const keys = Object.keys(baseline);
  const sum = keys.reduce((acc, key) => acc + Math.pow((scores[key] ?? 0) - baseline[key], 2), 0);
  return Math.sqrt(sum);
}

function resolveRef(ref: ScoreRef, context: { answers: Answers; featureScores: Record<string, number>; auxiliaryScores: Record<string, number> }) {
  if (ref.kind === "feature" && ref.key) return context.featureScores[ref.key] ?? 0;
  if (ref.kind === "auxiliary" && ref.key) return context.auxiliaryScores[ref.key] ?? 0;
  if (ref.kind === "question" && ref.questionId) return Number(context.answers[ref.questionId] ?? 0);
  return 0;
}

function refLabel(ref: ScoreRef, config: TypeDiagnosisConfig) {
  if (ref.kind === "feature" && ref.key) return config.featureLabels[ref.key] ?? ref.key;
  if (ref.kind === "auxiliary" && ref.key) return config.auxiliaryLabels[ref.key] ?? ref.key;
  if (ref.kind === "question" && ref.questionId) return `Q${ref.questionId}`;
  return "条件";
}

function evaluateRequired(
  conditions: Condition[],
  context: {
    answers: Answers;
    featureScores: Record<string, number>;
    auxiliaryScores: Record<string, number>;
    config: TypeDiagnosisConfig;
  },
) {
  const sortedFeatureScores = Object.entries(context.featureScores).sort((a, b) => b[1] - a[1]);

  return conditions
    .map((condition) => {
      if (condition.type === "min") {
        const value = resolveRef(condition.ref, context);
        return value >= condition.value ? "" : `${refLabel(condition.ref, context.config)}が${condition.value.toFixed(1)}未満`;
      }
      if (condition.type === "max") {
        const value = resolveRef(condition.ref, context);
        return value <= condition.value ? "" : `${refLabel(condition.ref, context.config)}が${condition.value.toFixed(1)}超`;
      }
      if (condition.type === "gteRef") {
        const left = resolveRef(condition.left, context);
        const right = resolveRef(condition.right, context);
        const margin = condition.margin ?? 0;
        return left + margin >= right
          ? ""
          : `${refLabel(condition.left, context.config)}が${refLabel(condition.right, context.config)}を下回る`;
      }
      if (condition.type === "top") {
        if (condition.ref.kind !== "feature" || !condition.ref.key) return "";
        const rank = sortedFeatureScores.findIndex(([key]) => key === condition.ref.key) + 1;
        return rank > 0 && rank <= condition.rank ? "" : `${refLabel(condition.ref, context.config)}が上位${condition.rank}位外`;
      }
      return "";
    })
    .filter(Boolean);
}

function pickMaturity(config: TypeDiagnosisConfig, score: number) {
  return config.maturityStages?.find((stage) => score >= stage.min && score <= stage.max) ?? null;
}

function normalizeNumberRecord(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, score]) => [key, Number(score ?? 0)]),
  );
}
