"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/session";
import { supabaseAdminFetch } from "@/lib/supabase/rest";

export async function saveReportAction(formData: FormData) {
  await requireAdminUser();
  const responseId = String(formData.get("response_id") ?? "");
  if (!responseId) redirect("/admin");

  await supabaseAdminFetch("/rest/v1/clinic_assessment_reports", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      response_id: responseId,
      overall_comment: String(formData.get("overall_comment") ?? ""),
      strengths_comment: String(formData.get("strengths_comment") ?? ""),
      priority_comment: String(formData.get("priority_comment") ?? ""),
      next_actions: String(formData.get("next_actions") ?? ""),
      internal_notes: String(formData.get("internal_notes") ?? ""),
    }),
  });

  revalidatePath("/admin");
  redirect(`/admin?id=${responseId}&saved=1`);
}

export async function deleteResponseAction(formData: FormData) {
  await requireAdminUser();
  const responseId = String(formData.get("response_id") ?? "");
  if (!responseId) redirect("/admin");

  await supabaseAdminFetch(`/rest/v1/clinic_assessment_responses?id=eq.${encodeURIComponent(responseId)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });

  revalidatePath("/admin");
  redirect("/admin?deleted=1");
}
