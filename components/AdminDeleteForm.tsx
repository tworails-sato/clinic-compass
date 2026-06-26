"use client";

import { deleteResponseAction } from "@/app/admin/actions";

export function AdminDeleteForm({ responseId }: { responseId: string }) {
  return (
    <form
      action={deleteResponseAction}
      onSubmit={(event) => {
        if (!window.confirm("この回答データを削除します。よろしいですか？")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="response_id" value={responseId} />
      <button className="button danger" type="submit">
        回答データを削除
      </button>
    </form>
  );
}
