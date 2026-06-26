import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserByAccessToken } from "@/lib/supabase/rest";

export const adminCookieNames = {
  accessToken: "clinic_admin_access_token",
  refreshToken: "clinic_admin_refresh_token",
};

export async function getAdminUser() {
  const store = await cookies();
  const accessToken = store.get(adminCookieNames.accessToken)?.value;
  if (!accessToken) return null;
  return getUserByAccessToken(accessToken);
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
