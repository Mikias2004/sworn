import nodemailer from "nodemailer";

// Configure these in your .env.local / Vercel environment variables:
//   SMTP_HOST     — e.g. smtp.postmarkapp.com or smtp.sendgrid.net
//   SMTP_PORT     — e.g. 587 (TLS) or 465 (SSL)
//   SMTP_SECURE   — "true" for port 465, omit or "false" for 587
//   SMTP_USER     — SMTP username / API key token
//   SMTP_PASS     — SMTP password / API key secret
//   SMTP_FROM     — e.g. "Sworn <hello@sworn.app>"

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[email] SMTP not configured — email not sent to:", to);
    console.warn("[email] Subject:", subject);
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Sworn <noreply@sworn.app>",
    to,
    subject,
    html,
  });
}

// ─── Email Templates ────────────────────────────────────────────────────────

const base = (body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sworn</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:36px;">
              <a href="https://sworn.app" style="font-size:20px;font-weight:500;color:#0d0d0d;letter-spacing:-0.02em;text-decoration:none;">Sworn.</a>
            </td>
          </tr>
          ${body}
          <tr>
            <td style="padding-top:40px;border-top:0.5px solid rgba(0,0,0,0.08);">
              <p style="font-size:12px;color:#999990;line-height:1.6;margin:0;">
                You're receiving this email because you have an account at Sworn.
                If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const btnStyle =
  "display:inline-block;font-size:14px;font-weight:500;background:#0d0d0d;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;";

export function passwordResetEmail(resetUrl: string) {
  return base(`
    <tr>
      <td style="padding-bottom:16px;">
        <h1 style="font-size:22px;font-weight:500;color:#0d0d0d;letter-spacing:-0.02em;margin:0 0 10px;">Reset your password</h1>
        <p style="font-size:14px;color:#555550;line-height:1.6;margin:0 0 28px;">
          We received a request to reset your Sworn password. Click the button below to choose a new one.
        </p>
        <a href="${resetUrl}" style="${btnStyle}">Reset password</a>
        <p style="font-size:13px;color:#999990;line-height:1.6;margin:24px 0 0;">
          This link expires in <strong style="color:#555550;">24 hours</strong>.
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `);
}

export function usernameReminderEmail(username: string) {
  return base(`
    <tr>
      <td style="padding-bottom:16px;">
        <h1 style="font-size:22px;font-weight:500;color:#0d0d0d;letter-spacing:-0.02em;margin:0 0 10px;">Your Sworn username</h1>
        <p style="font-size:14px;color:#555550;line-height:1.6;margin:0 0 20px;">
          Here's the username associated with your account:
        </p>
        <div style="background:#f7f7f5;border:0.5px solid rgba(0,0,0,0.08);border-radius:8px;padding:16px 20px;margin-bottom:28px;">
          <span style="font-size:18px;font-weight:500;color:#0d0d0d;letter-spacing:-0.01em;">${username}</span>
        </div>
        <a href="${process.env.NEXTAUTH_URL ?? "https://sworn.app"}/login" style="${btnStyle}">Sign in</a>
      </td>
    </tr>
  `);
}
