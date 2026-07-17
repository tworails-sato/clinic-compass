import { ParticipantType, Question, questionsFor } from "@/lib/questions";

export type Profile = {
  name: string;
  email: string;
  clinic: string;
  type: ParticipantType | "";
  referralSource?: string;
  referrerName?: string;
};

export type Answers = Record<number, number>;

export type GroupScore = {
  name: string;
  score: number;
  children: string[];
};

export const roles = {
  director: ["院長", "医院経営・診療体制を総合的に確認します"],
  office_manager: ["事務長", "現場運営・組織体制を中心に確認します"],
} as const;

export const scale = ["できていない", "あまりできていない", "一部できている", "概ねできている", "できている"];

export const directorGroups = {
  "診療方針・患者市場": ["医療方針・診療設計", "商圏・ニーズ把握", "ポートフォリオ設計", "集患・地域連携"],
  "収益・業務設計": ["収益・業務設計"],
  "患者価値・品質": ["患者体験", "品質・安全管理"],
  "リスク管理": ["法令・労務・広告コンプライアンス", "医療情報・サイバーセキュリティ", "事業継続・緊急対応"],
  "人材・組織": ["採用・定着力", "育成・チーム連携"],
  "経営体制・改善": ["経営体制・権限移譲", "経営管理・改善力"],
};

export const managerGroups = {
  "業務オペレーション": ["業務導線・役割分担", "予約・待ち時間管理", "業務標準化"],
  "人員・育成": ["スタッフ配置・負荷管理", "教育・育成"],
  "情報共有・橋渡し": ["情報共有・報連相", "方針共有・橋渡し"],
  "権限移譲・現場自走": ["判断範囲・権限設計", "院長依存・現場自走"],
  "数値・改善・事務": ["数値管理", "改善活動", "請求・事務管理"],
  "リスク対応": ["個人情報・労務・トラブル対応"],
};

export const emptyProfile: Profile = {
  name: "",
  email: "",
  clinic: "",
  type: "",
  referralSource: "",
  referrerName: "",
};

export function getQuestions(profile: Profile): Question[] {
  return profile.type ? questionsFor(profile.type) : [];
}

export function getThemes(questions: Question[]): string[] {
  return [...new Set(questions.map((q) => q.theme))];
}

export function getThemeScores(questions: Question[], answers: Answers) {
  return getThemes(questions).map((theme) => {
    const themeQuestions = questions.filter((q) => q.theme === theme);
    const values = themeQuestions.map((q) => answers[q.id]).filter((v): v is number => !!v);
    return {
      theme,
      score: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    };
  });
}

export function getGroupedScores(profile: Profile, answers: Answers): GroupScore[] {
  const questions = getQuestions(profile);
  const scores = getThemeScores(questions, answers);
  const groups = profile.type === "director" ? directorGroups : managerGroups;

  return Object.entries(groups).map(([name, children]) => {
    const values = scores.filter((s) => children.includes(s.theme)).map((s) => s.score);
    return {
      name,
      score: values.reduce((a, b) => a + b, 0) / (values.length || 1),
      children,
    };
  });
}

export function getTotalScore(grouped: GroupScore[]) {
  return grouped.reduce((a, b) => a + b.score, 0) / (grouped.length || 1);
}

export function getPriorities(grouped: GroupScore[]) {
  return [...grouped].sort((a, b) => a.score - b.score).slice(0, 3);
}

export const storageKeys = {
  profile: "clinic-compass-profile",
  answers: "clinic-compass-answers",
  savedResponseId: "clinic-compass-response-id",
  draftId: "clinic-compass-draft-id",
};
