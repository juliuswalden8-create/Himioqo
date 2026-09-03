import { SUPPORT_EMAIL } from "@/lib/constants";
import type { Dictionary } from "@/i18n/messages";
import { interpolate } from "@/i18n/interpolate";

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
}) {
  const { dict, firstName, verifyUrl } = input;
  const lang = (input.locale ?? "sv").split("-")[0] ?? "sv";
  const items = dict.email.items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;font-size:15px;color:#1D292B;">✓ ${escapeHtml(item)}</td></tr>`,
    )
    .join("");
  const sign = dict.email.sign.replace("\n", "<br/>");
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
  <body style="margin:0;background:#F7F4ED;font-family:Manrope,Arial,sans-serif;color:#1D292B;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F4ED;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E7E2;">
            <tr>
              <td style="background:#16383F;padding:22px 28px;">
                <p style="margin:0;color:#F7F4ED;font-size:20px;font-weight:700;">homio<span style="color:#B64A32;">q</span>o</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 12px;font-size:16px;">${escapeHtml(interpolate(dict.email.hello, { name: firstName }))}</p>
                <p style="margin:0 0 16px;font-size:18px;font-weight:650;">${escapeHtml(dict.email.welcome)}</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#5d6b7c;">${escapeHtml(dict.email.intro)}</p>
                <p style="margin:0 0 8px;font-size:15px;font-weight:650;">${escapeHtml(dict.email.included)}</p>
                <table role="presentation" width="100%" style="margin:0 0 24px;">${items}</table>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">${escapeHtml(dict.email.confirmLead)}</p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#B64A32;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:650;">${escapeHtml(dict.email.confirm)}</a>
                </p>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#5d6b7c;">${escapeHtml(dict.email.after)}</p>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#5d6b7c;">${escapeHtml(dict.email.reply)}</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">${escapeHtml(dict.email.close)}</p>
                <p style="margin:0;font-size:15px;white-space:pre-line;">${sign}</p>
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
    dict.email.included,
    ...dict.email.items.map((item) => `✓ ${item}`),
    "",
    dict.email.confirmLead,
    verifyUrl,
    "",
    dict.email.after,
    dict.email.reply,
    dict.email.close,
    "",
    dict.email.sign,
  ].join("\n");
}

export async function sendWelcomeEmail(input: {
  to: string;
  dict: Dictionary;
  firstName: string;
  verifyUrl: string;
  locale?: string;
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
