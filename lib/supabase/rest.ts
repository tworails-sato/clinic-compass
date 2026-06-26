const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type SupabaseUser = {
  id: string;
  email?: string;
};

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function baseUrl() {
  return requireEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
}

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && anonKey && serviceRoleKey);
}

export async function supabaseAdminFetch(path: string, init: RequestInit = {}) {
  const key = requireEnv(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase admin request failed: ${response.status} ${message}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function signInWithPassword(email: string, password: string) {
  const key = requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const response = await fetch(`${baseUrl()}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) return null;
  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: SupabaseUser;
  }>;
}

export async function getUserByAccessToken(accessToken: string) {
  const key = requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const response = await fetch(`${baseUrl()}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json() as Promise<SupabaseUser>;
}

export async function requestPasswordRecovery(email: string, redirectTo: string) {
  const key = requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  await fetch(`${baseUrl()}/auth/v1/recover`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
}

export async function updateUserPassword(accessToken: string, password: string) {
  const key = requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const response = await fetch(`${baseUrl()}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  return response.ok;
}
