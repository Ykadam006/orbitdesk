import { logger } from "@/lib/logger";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "OrbitDesk <noreply@orbitdesk.dev>";

  if (!apiKey) {
    logger.info("Email (dev mode — not sent)", { to, subject, text: text || html.slice(0, 200) });
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Failed to send email", { to, subject, status: res.status, body });
      return false;
    }

    logger.info("Email sent", { to, subject });
    return true;
  } catch (error) {
    logger.error("Email send error", { to, subject, error: String(error) });
    return false;
  }
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Verify your OrbitDesk email",
    html: `
      <h2>Email Verification</h2>
      <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
    text: `Verify your email: ${verifyUrl}`,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Reset your OrbitDesk password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    text: `Reset your password: ${resetUrl}`,
  });
}
