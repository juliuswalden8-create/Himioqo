import { SUPPORT_EMAIL } from "@/lib/constants";
import type { Dictionary } from "@/i18n/messages";
import { interpolate } from "@/i18n/interpolate";
import { appUrl } from "@/lib/utils";

async function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    const { Resend } = await import("resend");
    return new Resend(key);
  } catch {
    return null;
  }
}

function fromAddress() {
  return process.env.RESEND_FROM ?? `Homioqo <${SUPPORT_EMAIL}>`;
}

export function welcomeEmailHtml(input: {
  dict: Dictionary;
  firstName: string;
  verifyUrl: string;
  locale?: string;
  logoUrl?: string;
}) {
  const { dict, firstName, verifyUrl } = input;
  const lang = (input.locale ?? "sv").split("-")[0] ?? "sv";
  const logoUrl = input.logoUrl ?? appUrl("/brand/logo-email.png");
  const hello = interpolate(dict.email.hello, { name: firstName });
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
  <body style="margin:0;background:#F7F4ED;font-family:Manrope,Arial,Helvetica,sans-serif;color:#1D292B;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(dict.email.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F4ED;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E7E2;">
            <tr>
              <td style="padding:32px 28px 8px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">${escapeHtml(hello)}</p>
                <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#16383F;">${escapeHtml(dict.email.welcome)}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5d6b7c;">${escapeHtml(dict.email.intro)}</p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#B64A32;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:650;font-size:15px;">${escapeHtml(dict.email.confirm)}</a>
                </p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#5d6b7c;">${escapeHtml(dict.email.ttl)}</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#5d6b7c;">${escapeHtml(dict.email.fallback)}</p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.55;word-break:break-all;">
                  <a href="${escapeHtml(verifyUrl)}" style="color:#16383F;">${escapeHtml(verifyUrl)}</a>
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:#5d6b7c;">${escapeHtml(dict.email.ignore)}</p>
                <p style="margin:0 0 4px;font-size:15px;">${escapeHtml(dict.email.sign)}</p>
                <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#16383F;">${escapeHtml(dict.email.signName)}</p>
                <p style="margin:0 0 8px;font-size:14px;font-style:italic;color:#5d6b7c;">${escapeHtml(dict.email.tagline)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 28px 32px;">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(dict.email.logoAlt)}" width="178" height="36" style="display:block;width:178px;height:auto;border:0;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmailText(input: {
  dict: Dictionary;
  firstName: string;
  verifyUrl: string;
}) {
  const { dict, firstName, verifyUrl } = input;
  return [
    interpolate(dict.email.hello, { name: firstName }),
    "",
    dict.email.welcome,
    "",
    dict.email.intro,
    "",
    dict.email.confirm,
    verifyUrl,
    "",
    dict.email.ttl,
    "",
    dict.email.fallback,
    verifyUrl,
    "",
    dict.email.ignore,
    "",
    dict.email.sign,
    dict.email.signName,
    dict.email.tagline,
  ].join("\n");
}

export async function sendWelcomeEmail(input: {
  to: string;
  dict: Dictionary;
  firstName: string;
  verifyUrl: string;
  locale?: string;
  logoUrl?: string;
}) {
  const html = welcomeEmailHtml(input);
  const text = welcomeEmailText(input);
  const client = await resendClient();
  if (!client) {
    console.info("[homioqo] welcome email (logged)", { to: input.to, verifyUrl: input.verifyUrl });
    return { delivered: false as const, html, text };
  }
  await client.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: input.dict.email.subject,
    html,
    text,
  });
  return { delivered: true as const, html, text };
}

export async function sendAdminSignupNotice(input: {
  dict: Dictionary;
  companyName: string;
  emailMasked: string;
  locale: string;
}) {
  const client = await resendClient();
  const text = `${input.dict.email.adminSubject}\n${input.companyName}\n${input.emailMasked}\n${input.locale}`;
  if (!client) {
    console.info("[homioqo] admin notice", text);
    return;
  }
  await client.emails.send({
    from: fromAddress(),
    to: SUPPORT_EMAIL,
    subject: input.dict.email.adminSubject,
    text,
  });
}

export async function sendCleaningCompleteNotice(input: {
  to: string[];
  propertyName: string;
  completedAt: string;
}) {
  const text = `${input.propertyName} är redo för nästa gäst.\nStädningen markerades som klar ${input.completedAt}.`;
  const client = await resendClient();
  if (!client) {
    console.info("[homioqo] cleaning complete", { to: input.to, propertyName: input.propertyName });
    return;
  }
  await client.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: `${input.propertyName} är redo för nästa gäst`,
    text,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
