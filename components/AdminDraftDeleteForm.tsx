"use client";

import { deleteDraftAction } from "@/app/admin/actions";

export function AdminDraftDeleteForm({ draftId }: { draftId: string }) {
  return (
    <form
      action={deleteDraftAction}
      onSubmit={(event) => {
        if (!window.confirm("この途中保存データを削除します。よろしいですか？")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="draft_id" value={draftId} />
      <button className="button danger compact" type="submit">
        削除
      </button>
    </form>
  );
}
