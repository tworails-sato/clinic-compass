"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveReportAction } from "@/app/admin/actions";
import type { AdminReport } from "@/lib/admin/data";
import { applyDraftToEmptyReportFields, type ReportDraft } from "@/lib/admin/comment-drafts";

type Props = {
  responseId: string;
  report: AdminReport | null;
  draft: ReportDraft;
};

function isEmpty(value?: string) {
  return !value || value.trim() === "";
}

export function AdminReportEditor({ responseId, report, draft }: Props) {
  const initialValues = useMemo(() => applyDraftToEmptyReportFields(report, draft), [report, draft]);
  const [values, setValues] = useState(initialValues);

  const draftedFields = {
    overall_comment: isEmpty(report?.overall_comment),
    strengths_comment: isEmpty(report?.strengths_comment),
    priority_comment: isEmpty(report?.priority_comment),
    next_actions: isEmpty(report?.next_actions),
  };

  function update(field: keyof ReportDraft, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function regenerateDraft() {
    setValues(draft);
  }

  return (
    <form action={saveReportAction}>
      <input type="hidden" name="response_id" value={responseId} />
      <div className="draft-tools">
        <p>空欄のコメント欄には、スコアに応じた自動下書きを表示しています。必要に応じて編集してから保存してください。</p>
        <button className="button subtle compact" type="button" onClick={regenerateDraft}>
          下書きを再生成
        </button>
      </div>
      <div className="report-fields">
        <label>
          総評サマリー
          {draftedFields.overall_comment && <span className="draft-badge">自動下書き</span>}
          <textarea name="overall_comment" value={values.overall_comment} onChange={(event) => update("overall_comment", event.target.value)} />
        </label>
        <label>
          クリニックの強み
          {draftedFields.strengths_comment && <span className="draft-badge">自動下書き</span>}
          <textarea name="strengths_comment" value={values.strengths_comment} onChange={(event) => update("strengths_comment", event.target.value)} />
        </label>
        <label>
          課題（優先テーマ）
          {draftedFields.priority_comment && <span className="draft-badge">自動下書き</span>}
          <textarea name="priority_comment" value={values.priority_comment} onChange={(event) => update("priority_comment", event.target.value)} />
        </label>
        <label>
          アクション
          {draftedFields.next_actions && <span className="draft-badge">自動下書き</span>}
          <textarea name="next_actions" value={values.next_actions} onChange={(event) => update("next_actions", event.target.value)} />
        </label>
        <label>
          内部メモ
          <textarea name="internal_notes" defaultValue={report?.internal_notes ?? ""} />
        </label>
      </div>
      <button className="button" type="submit">
        コメントを保存
      </button>
      <Link className="button subtle print-link" href={`/admin/reports/${responseId}/print`} target="_blank">
        レポート印刷ページを開く
      </Link>
    </form>
  );
}
