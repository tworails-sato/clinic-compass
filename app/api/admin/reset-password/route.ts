import { NextResponse } from "next/server";
import { updateUserPassword } from "@/lib/supabase/rest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = String(body.accessToken ?? "");
    const password = String(body.password ?? "");

    if (!accessToken || password.length < 8) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ok = await updateUserPassword(accessToken, password);
    return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
