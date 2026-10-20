import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/session";
import { formatDate, getTypeResults, listResponses, normalizePriorities, participantLabel } from "@/lib/admin/data";
import { getTypeDefinition } from "@/lib/type-diagnosis/engine";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const rows = await listResponses();
  const typeResults = await getTypeResults(rows.map((row) => row.id));
  const header = [
    "回答ID",
    "回答日時",
    "医院名",
    "氏名",
    "メール",
    "対象者区分",
    "総合スコア",
    "優先確認テーマ",
    "メインタイプ",
    "サブタイプ",
    "動物",
    "アイコンパス",
    "6特性スコア",
    "補助指標",
    "判定日時",
  ];
  const body = rows.map((row, index) => {
    const typeResult = typeResults.get(row.id) ?? null;
    const definition = typeResult ? getTypeDefinition(typeResult.respondentType, typeResult.mainTypeKey) : null;
    return [
      row.id,
      formatDate(row.submitted_at),
      row.clinic_name,
      row.name,
      row.email,
      participantLabel(row.participant_type),
      Number(row.total_score).toFixed(1),
      normalizePriorities(row.priority_themes).join(" / "),
      typeResult?.mainTypeLabel ?? "",
      typeResult?.subTypeLabel ?? "",
      definition?.animal ?? "",
      definition?.iconPath ?? "",
      formatScoreRecord(typeResult?.featureScores),
      formatScoreRecord(typeResult?.auxiliaryScores),
      typeResult?.calculatedAt ? formatDate(typeResult.calculatedAt) : "",
    ];
  });

  const csv = [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clinic-compass-responses.csv"`,
    },
  });
}

function formatScoreRecord(scores?: Record<string, number>) {
  if (!scores) return "";
  return Object.entries(scores)
    .map(([key, value]) => `${key}:${Number(value).toFixed(1)}`)
    .join(" / ");
}
