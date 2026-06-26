import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/session";
import { formatDate, listResponses, normalizePriorities, participantLabel } from "@/lib/admin/data";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const rows = await listResponses();
  const header = ["回答ID", "回答日時", "医院名", "氏名", "メール", "対象者区分", "総合スコア", "優先確認テーマ"];
  const body = rows.map((row) => [
    row.id,
    formatDate(row.submitted_at),
    row.clinic_name,
    row.name,
    row.email,
    participantLabel(row.participant_type),
    Number(row.total_score).toFixed(1),
    normalizePriorities(row.priority_themes).join(" / "),
  ]);

  const csv = [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clinic-compass-responses.csv"`,
    },
  });
}
