export type RespondentType = "doctor" | "manager";

export type ScoreKind = "feature" | "auxiliary" | "question";

export type ScoreRef = {
  kind: ScoreKind;
  key?: string;
  questionId?: number;
};

export type Condition =
  | { type: "min"; ref: ScoreRef; value: number }
  | { type: "max"; ref: ScoreRef; value: number }
  | { type: "gteRef"; left: ScoreRef; right: ScoreRef; margin?: number }
  | { type: "top"; ref: ScoreRef; rank: number };

export type TypeDefinition = {
  key: string;
  name: string;
  animal: string;
  label: string;
  baseline: Record<string, number>;
  required?: Condition[];
  summary: string;
};

export type MaturityStage = {
  key: string;
  label: string;
  min: number;
  max: number;
};

export type TypeDiagnosisConfig = {
  respondentType: RespondentType;
  title: string;
  featureLabels: Record<string, string>;
  auxiliaryLabels: Record<string, string>;
  features: Record<string, number[]>;
  auxiliaries: Record<string, number[] | { inverseAverageOf: number[] }>;
  types: TypeDefinition[];
  maturityStages?: MaturityStage[];
};

const f = (key: string): ScoreRef => ({ kind: "feature", key });
const a = (key: string): ScoreRef => ({ kind: "auxiliary", key });
const q = (questionId: number): ScoreRef => ({ kind: "question", questionId });

export const doctorTypeConfig: TypeDiagnosisConfig = {
  respondentType: "doctor",
  title: "院長コンパス12タイプ診断",
  featureLabels: {
    vision: "ビジョン力",
    market: "市場創造力",
    operations: "現場運営力",
    patient: "患者価値力",
    organization: "組織育成力",
    structure: "構造経営力",
  },
  auxiliaryLabels: {
    numbers: "数字管理力",
    delegation: "権限移譲力",
    risk: "リスク管理力",
    improvement: "改善推進力",
    acquisition: "発信・集患力",
    directorDependency: "院長依存度",
  },
  features: {
    vision: [1, 3, 5, 6, 7],
    market: [4, 8, 9],
    operations: [10, 11, 12, 13, 14, 18],
    patient: [2, 15, 16, 17, 19, 20, 21],
    organization: [22, 23, 28, 29, 30, 31],
    structure: [24, 25, 26, 27, 32, 33, 34, 35, 36],
  },
  auxiliaries: {
    numbers: [10, 11, 14, 18, 35, 36],
    delegation: [32, 33, 34],
    risk: [19, 20, 21, 22, 23, 24, 25, 26, 27],
    improvement: [3, 7, 9, 14, 18, 21, 35, 36],
    acquisition: [4, 8, 9, 17],
    directorDependency: { inverseAverageOf: [27, 32, 33, 34] },
  },
  types: [
    {
      key: "solitary_master",
      name: "孤高の名医",
      animal: "オオカミ",
      label: "孤高の名医（オオカミ）",
      baseline: { vision: 4.4, market: 3.2, operations: 3.5, patient: 4.5, organization: 3.1, structure: 3.0 },
      required: [{ type: "min", ref: f("patient"), value: 4.0 }],
      summary: "診療品質や患者への価値提供に強みが出やすいタイプです。",
    },
    {
      key: "passionate_captain",
      name: "情熱の船長",
      animal: "ライオン",
      label: "情熱の船長（ライオン）",
      baseline: { vision: 4.5, market: 3.5, operations: 3.5, patient: 3.8, organization: 4.2, structure: 3.2 },
      required: [{ type: "min", ref: f("vision"), value: 4.0 }],
      summary: "方針や想いを軸に、医院全体を前に進める力が出やすいタイプです。",
    },
    {
      key: "future_architect",
      name: "未来の設計士",
      animal: "フクロウ",
      label: "未来の設計士（フクロウ）",
      baseline: { vision: 4.6, market: 4.1, operations: 3.3, patient: 3.7, organization: 3.3, structure: 3.4 },
      required: [
        { type: "min", ref: f("vision"), value: 4.0 },
        { type: "min", ref: f("market"), value: 3.8 },
      ],
      summary: "医院の方向性や地域ニーズを見ながら、未来の打ち手を考える力が出やすいタイプです。",
    },
    {
      key: "field_director",
      name: "現場主義院長",
      animal: "シェパード",
      label: "現場主義院長（シェパード）",
      baseline: { vision: 3.6, market: 3.3, operations: 4.5, patient: 4.0, organization: 3.5, structure: 3.3 },
      required: [{ type: "min", ref: f("operations"), value: 4.0 }],
      summary: "現場の流れや日々の運営状態をつかみ、着実に回す力が出やすいタイプです。",
    },
    {
      key: "people_builder",
      name: "人育て院長",
      animal: "ゾウ",
      label: "人育て院長（ゾウ）",
      baseline: { vision: 3.6, market: 3.2, operations: 3.4, patient: 4.0, organization: 4.5, structure: 3.4 },
      required: [{ type: "min", ref: f("organization"), value: 4.0 }],
      summary: "採用・育成・相談しやすさなど、人とチームづくりに強みが出やすいタイプです。",
    },
    {
      key: "reform_doctor",
      name: "改革ドクター",
      animal: "ハヤブサ",
      label: "改革ドクター（ハヤブサ）",
      baseline: { vision: 4.3, market: 4.1, operations: 4.0, patient: 3.6, organization: 3.4, structure: 3.4 },
      required: [
        { type: "min", ref: f("vision"), value: 3.8 },
        { type: "min", ref: a("improvement"), value: 3.8 },
      ],
      summary: "課題を見つけ、改善や新しい取り組みに向かう推進力が出やすいタイプです。",
    },
    {
      key: "local_face",
      name: "地域の顔",
      animal: "カピバラ",
      label: "地域の顔（カピバラ）",
      baseline: { vision: 3.7, market: 4.3, operations: 3.6, patient: 4.5, organization: 3.8, structure: 3.2 },
      required: [{ type: "min", ref: f("market"), value: 4.0 }],
      summary: "地域や患者との関係性を大切にし、患者価値を高める力が出やすいタイプです。",
    },
    {
      key: "charismatic_director",
      name: "カリスマ院長",
      animal: "クジャク",
      label: "カリスマ院長（クジャク）",
      baseline: { vision: 4.1, market: 4.6, operations: 3.5, patient: 3.7, organization: 3.2, structure: 3.0 },
      required: [
        { type: "min", ref: f("market"), value: 4.0 },
        { type: "min", ref: a("acquisition"), value: 3.8 },
      ],
      summary: "医院の魅力や特徴を外部に伝え、選ばれる状態をつくる力が出やすいタイプです。",
    },
    {
      key: "system_builder",
      name: "仕組み化院長",
      animal: "ビーバー",
      label: "仕組み化院長（ビーバー）",
      baseline: { vision: 3.8, market: 3.3, operations: 4.4, patient: 3.8, organization: 4.0, structure: 4.6 },
      required: [
        { type: "min", ref: f("operations"), value: 4.0 },
        { type: "min", ref: f("structure"), value: 4.0 },
      ],
      summary: "属人化を減らし、業務や判断を仕組みとして整える力が出やすいタイプです。",
    },
    {
      key: "numbers_director",
      name: "数字派院長",
      animal: "キツネ",
      label: "数字派院長（キツネ）",
      baseline: { vision: 3.7, market: 3.5, operations: 4.5, patient: 3.4, organization: 3.3, structure: 4.4 },
      required: [{ type: "min", ref: a("numbers"), value: 4.0 }],
      summary: "数値を手がかりに、収益・効率・改善を整理する力が出やすいタイプです。",
    },
    {
      key: "steady_manager",
      name: "堅実経営院長",
      animal: "カメ",
      label: "堅実経営院長（カメ）",
      baseline: { vision: 3.6, market: 3.1, operations: 4.0, patient: 4.3, organization: 3.8, structure: 4.4 },
      required: [
        { type: "min", ref: f("structure"), value: 4.0 },
        { type: "min", ref: a("risk"), value: 3.8 },
      ],
      summary: "安全・法令・継続性を重視し、安定した医院運営を支える力が出やすいタイプです。",
    },
    {
      key: "delegation_master",
      name: "任せ上手院長",
      animal: "ゴリラ",
      label: "任せ上手院長（ゴリラ）",
      baseline: { vision: 4.0, market: 3.6, operations: 4.3, patient: 4.0, organization: 4.5, structure: 4.7 },
      required: [
        { type: "min", ref: f("structure"), value: 4.3 },
        { type: "min", ref: f("organization"), value: 4.1 },
        { type: "min", ref: f("operations"), value: 4.0 },
        { type: "min", ref: a("delegation"), value: 4.3 },
        { type: "min", ref: q(34), value: 4 },
        { type: "min", ref: q(35), value: 4 },
        { type: "min", ref: q(36), value: 4 },
      ],
      summary: "院長以外の責任者や現場が判断し、医院全体で運営できる状態に近いタイプです。",
    },
  ],
};

export const managerTypeConfig: TypeDiagnosisConfig = {
  respondentType: "manager",
  title: "事務長コンパス12タイプ診断",
  featureLabels: {
    field: "現場把握力",
    workflow: "業務設計力",
    organization: "組織マネジメント力",
    policy: "方針翻訳力",
    execution: "実行推進力",
    control: "管理統制力",
  },
  auxiliaryLabels: {
    directorCoordination: "院長連携力",
    fieldCoordination: "現場調整力",
    training: "人材育成力",
    standardization: "標準化力",
    numbers: "数字管理力",
    risk: "リスク管理力",
    autonomySupport: "現場自走支援力",
    managerDependency: "事務長依存度",
  },
  features: {
    field: [1, 2, 3, 4, 5, 6],
    workflow: [7, 8, 9, 22, 23, 24],
    organization: [10, 11, 12, 13, 14, 15, 16, 17, 18],
    policy: [19, 20, 21],
    execution: [25, 26, 27, 30, 31],
    control: [28, 29, 32, 33, 34, 35, 36],
  },
  auxiliaries: {
    directorCoordination: [19, 20, 21, 28, 29],
    fieldCoordination: [10, 11, 12, 16, 17, 18],
    training: [13, 14, 15, 17, 18, 27],
    standardization: [7, 8, 9, 22, 23, 24],
    numbers: [4, 5, 6, 28, 29, 32, 33],
    risk: [32, 33, 34, 35, 36],
    autonomySupport: [23, 24, 25, 26, 27],
    managerDependency: { inverseAverageOf: [9, 23, 24, 25, 26, 27] },
  },
  types: [
    {
      key: "director_right_hand",
      name: "院長の右腕",
      animal: "オオカミ",
      label: "院長の右腕（オオカミ）",
      baseline: { field: 3.8, workflow: 3.4, organization: 3.6, policy: 4.6, execution: 3.7, control: 4.0 },
      required: [{ type: "min", ref: f("policy"), value: 4.0 }],
      summary: "院長の方針を理解し、現場に橋渡しする力が出やすいタイプです。",
    },
    {
      key: "strategic_staff",
      name: "戦略参謀",
      animal: "フクロウ",
      label: "戦略参謀（フクロウ）",
      baseline: { field: 3.7, workflow: 3.8, organization: 3.3, policy: 4.2, execution: 3.4, control: 4.6 },
      required: [{ type: "min", ref: f("control"), value: 4.0 }],
      summary: "数値や管理情報をもとに、院長の意思決定を支える力が出やすいタイプです。",
    },
    {
      key: "field_commander",
      name: "現場の司令塔",
      animal: "シェパード",
      label: "現場の司令塔（シェパード）",
      baseline: { field: 4.6, workflow: 3.5, organization: 4.2, policy: 3.7, execution: 4.3, control: 3.8 },
      required: [{ type: "min", ref: f("field"), value: 4.0 }],
      summary: "現場の状態を把握し、日々の運営を調整する力が出やすいタイプです。",
    },
    {
      key: "inhouse_translator",
      name: "院内の通訳者",
      animal: "オウム",
      label: "院内の通訳者（オウム）",
      baseline: { field: 3.8, workflow: 3.5, organization: 4.3, policy: 4.6, execution: 3.5, control: 3.5 },
      required: [
        { type: "min", ref: f("policy"), value: 4.0 },
        { type: "min", ref: f("organization"), value: 3.8 },
      ],
      summary: "院長の方針と現場の受け止めをつなぎ、認識のズレを整える力が出やすいタイプです。",
    },
    {
      key: "team_bridge",
      name: "チームの橋渡し役",
      animal: "イルカ",
      label: "チームの橋渡し役（イルカ）",
      baseline: { field: 4.0, workflow: 3.4, organization: 4.6, policy: 4.1, execution: 3.4, control: 3.3 },
      required: [{ type: "min", ref: f("organization"), value: 4.0 }],
      summary: "スタッフ同士の連携や相談しやすさを支える力が出やすいタイプです。",
    },
    {
      key: "execution_steward",
      name: "実行の番頭",
      animal: "ウマ",
      label: "実行の番頭（ウマ）",
      baseline: { field: 4.3, workflow: 3.7, organization: 3.5, policy: 3.7, execution: 4.7, control: 3.8 },
      required: [{ type: "min", ref: f("execution"), value: 4.0 }],
      summary: "改善策を決めて、担当者と期限を持って進める力が出やすいタイプです。",
    },
    {
      key: "workflow_builder",
      name: "仕組みづくりの達人",
      animal: "ビーバー",
      label: "仕組みづくりの達人（ビーバー）",
      baseline: { field: 3.8, workflow: 4.7, organization: 3.8, policy: 3.4, execution: 4.0, control: 4.1 },
      required: [{ type: "min", ref: f("workflow"), value: 4.0 }],
      summary: "業務手順や判断範囲を整え、属人化を減らす力が出やすいタイプです。",
    },
    {
      key: "numbers_keeper",
      name: "数字の番人",
      animal: "ミーアキャット",
      label: "数字の番人（ミーアキャット）",
      baseline: { field: 4.1, workflow: 3.8, organization: 3.3, policy: 3.5, execution: 3.8, control: 4.7 },
      required: [{ type: "min", ref: a("numbers"), value: 4.0 }],
      summary: "患者数・待ち時間・請求などの数値を見ながら現場改善につなげる力が出やすいタイプです。",
    },
    {
      key: "people_deputy",
      name: "人育ての副将",
      animal: "ゾウ",
      label: "人育ての副将（ゾウ）",
      baseline: { field: 3.8, workflow: 3.5, organization: 4.7, policy: 4.0, execution: 3.7, control: 3.3 },
      required: [{ type: "min", ref: a("training"), value: 4.0 }],
      summary: "新人教育やスタッフ育成を通じて、チームの力を底上げする力が出やすいタイプです。",
    },
    {
      key: "reform_driver",
      name: "改革の推進役",
      animal: "ハヤブサ",
      label: "改革の推進役（ハヤブサ）",
      baseline: { field: 4.0, workflow: 4.3, organization: 3.6, policy: 3.7, execution: 4.6, control: 3.6 },
      required: [
        { type: "min", ref: f("execution"), value: 4.0 },
        { type: "min", ref: f("workflow"), value: 3.8 },
      ],
      summary: "課題を整理し、改善を実行に移す推進力が出やすいタイプです。",
    },
    {
      key: "defensive_manager",
      name: "守りの責任者",
      animal: "カメ",
      label: "守りの責任者（カメ）",
      baseline: { field: 3.8, workflow: 4.0, organization: 3.4, policy: 3.5, execution: 3.3, control: 4.8 },
      required: [{ type: "min", ref: a("risk"), value: 4.0 }],
      summary: "請求・個人情報・労務・トラブル対応など、守りの管理に強みが出やすいタイプです。",
    },
    {
      key: "autonomous_team_supporter",
      name: "自走チームの黒子",
      animal: "クロヒョウ",
      label: "自走チームの黒子（クロヒョウ）",
      baseline: { field: 4.2, workflow: 4.6, organization: 4.5, policy: 4.1, execution: 4.5, control: 4.3 },
      required: [
        { type: "min", ref: f("workflow"), value: 4.1 },
        { type: "min", ref: f("organization"), value: 4.1 },
        { type: "min", ref: f("execution"), value: 4.1 },
        { type: "min", ref: a("autonomySupport"), value: 4.0 },
      ],
      summary: "現場が自分たちで判断・改善できる状態を支える力が出やすいタイプです。",
    },
  ],
  maturityStages: [
    { key: "role_forming", label: "役割形成期", min: 1.0, max: 2.4 },
    { key: "practice_developing", label: "実務整備期", min: 2.5, max: 3.2 },
    { key: "field_supervising", label: "現場統括期", min: 3.3, max: 3.8 },
    { key: "organization_driving", label: "組織推進期", min: 3.9, max: 4.4 },
    { key: "autonomy_supporting", label: "自走支援期", min: 4.5, max: 5.0 },
  ],
};

export const typeDiagnosisConfigs = {
  doctor: doctorTypeConfig,
  manager: managerTypeConfig,
} satisfies Record<RespondentType, TypeDiagnosisConfig>;
