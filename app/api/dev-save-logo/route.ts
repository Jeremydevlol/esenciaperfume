import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const { slug, svg } = await req.json();
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const filePath = path.join(process.cwd(), "public", "brands", `${slug}.svg`);
  writeFileSync(filePath, svg, "utf8");
  return NextResponse.json({ ok: true });
}
