import nodemailer from "nodemailer";

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
      // El cert del hosting (Dinahosting) usa otro hostname; validamos contra él
      ...(process.env.SMTP_TLS_SERVERNAME
        ? { tls: { servername: process.env.SMTP_TLS_SERVERNAME } }
        : {}),
    })
  : null;

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!transporter) {
    console.log("─── EMAIL (dev fallback – SMTP not configured) ───");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML:    ${html.slice(0, 300)}…`);
    console.log("──────────────────────────────────────────────────");
    return { success: true, messageId: "dev-console" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Perfumería y Cosmética <noreply@perfumeriaycosmetica.com>",
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendEmail] Error:", message);
    return { success: false, error: message };
  }
}
