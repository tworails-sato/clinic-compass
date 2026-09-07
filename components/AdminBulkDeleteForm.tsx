"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { deleteResponsesAction } from "@/app/admin/actions";

export function AdminBulkDeleteForm({ children, count }: { children: ReactNode; count: number }) {
  const [selectedCount, setSelectedCount] = useState(0);

  function updateSelectedCount(form: HTMLFormElement) {
    setSelectedCount(form.querySelectorAll<HTMLInputElement>('input[name="response_ids"]:checked').length);
  }

  function setAll(form: HTMLFormElement, checked: boolean) {
    form.querySelectorAll<HTMLInputElement>('input[name="response_ids"]').forEach((input) => {
      input.checked = checked;
    });
    updateSelectedCount(form);
  }

  return (
    <form
      action={deleteResponsesAction}
      className="admin-bulk-delete-form"
      onChange={(event) => updateSelectedCount(event.currentTarget)}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const checked = form.querySelectorAll<HTMLInputElement>('input[name="response_ids"]:checked');
        if (checked.length === 0) {
          event.preventDefault();
          window.alert("削除する回答を選択してください。");
          return;
        }
        if (!window.confirm(`選択した${checked.length}件の回答データを削除します。よろしいですか？`)) {
          event.preventDefault();
        }
      }}
    >
      <div className="admin-bulk-toolbar">
        <div>
          <button type="button" onClick={(event) => setAll(event.currentTarget.form!, true)} disabled={count === 0}>
            すべて選択
          </button>
          <button type="button" onClick={(event) => setAll(event.currentTarget.form!, false)} disabled={selectedCount === 0}>
            選択解除
          </button>
        </div>
        <button className="button danger compact" type="submit" disabled={selectedCount === 0}>
          選択した回答を削除{selectedCount > 0 ? `（${selectedCount}件）` : ""}
        </button>
      </div>
      {children}
    </form>
  );
}
