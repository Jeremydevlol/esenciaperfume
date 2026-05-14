import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const validUser = process.env.ADMIN_USER ?? "admin";
    const validPass = process.env.ADMIN_PASSWORD ?? "";

    if (username !== validUser || password !== validPass) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 },
      );
    }

    const { token, expires } = createAdminSession();

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Solicitud no válida" },
      { status: 400 },
    );
  }
}
