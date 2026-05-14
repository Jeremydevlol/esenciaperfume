import crypto from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 h

function sign(value: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");
}

export function createAdminSession(): { token: string; expires: Date } {
  const id = crypto.randomUUID();
  const signature = sign(id);
  const token = `${id}.${signature}`;
  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  return { token, expires };
}

export function verifyAdminSession(cookieValue: string): boolean {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [id, signature] = parts;
  const expected = sign(id);
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
}
