import { FOUNDER_FIRST_NAME, founderInbox, QR_SIGN_PRICE_EUR, SUPPORT_EMAIL } from "@/lib/constants";
import type { QrSignOrder } from "@/lib/types";
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
    to: founderInbox(),
    subject: input.dict.email.adminSubject,
    text,
  });
}

export async function sendPilotLeadNotice(lead: {
  name: string;
  company: string;
  email: string;
  phone: string;
  region: string;
  propertyCount: string;
  rentalType: string;
  currentMethod: string;
  mostValuable: string;
  message?: string;
  accountType?: "company" | "private";
  wantsPilot: boolean;
  locale: string;
}) {
  const to = founderInbox();
  const subject = lead.wantsPilot
    ? `Homioqo: ny pilotförfrågan från ${lead.name}`
    : `Homioqo: ny demoförfrågan från ${lead.name}`;
  const text = [
    "Ny förfrågan från startsidans formulär.",
    "",
    `Namn: ${lead.name}`,
    `Företag: ${lead.company || "—"}`,
    `E-post: ${lead.email}`,
    `Telefon: ${lead.phone || "—"}`,
    `Roll: ${lead.accountType === "company" ? "Företag" : "Privatperson"}`,
    `Antal bostäder: ${lead.propertyCount || "—"}`,
    `Region: ${lead.region || "—"}`,
    `Uthyrning: ${lead.rentalType || "—"}`,
    `Pilot: ${lead.wantsPilot ? "ja" : "nej"}`,
    `Språk: ${lead.locale}`,
    lead.currentMethod ? `Nuvarande sätt: ${lead.currentMethod}` : "",
    lead.mostValuable ? `Viktigast: ${lead.mostValuable}` : "",
    "",
    "Meddelande:",
    lead.message || "—",
  ]
    .filter((line) => line !== "")
    .join("\n");

  console.info("[homioqo] demo-lead", { to, subject, text });

  const client = await resendClient();
  if (!client) {
    return { delivered: false as const };
  }
  try {
    await client.emails.send({
      from: fromAddress(),
      to,
      replyTo: lead.email,
      subject,
      text,
    });
    return { delivered: true as const };
  } catch (error) {
    console.error("[homioqo] demo-lead email failed", error);
    return { delivered: false as const };
  }
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

export async function sendAccessEmail(input: {
  to: string;
  subject: string;
  title: string;
  body: string;
  cta: string;
  url: string;
  ttl: string;
  dict: Dictionary;
}) {
  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#F7F4ED;font-family:Manrope,Arial,Helvetica,sans-serif;color:#1D292B;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F4ED;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E7E2;">
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#16383F;">${escapeHtml(input.title)}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5d6b7c;">${escapeHtml(input.body)}</p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#B64A32;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:650;font-size:15px;">${escapeHtml(input.cta)}</a>
                </p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#5d6b7c;">${escapeHtml(input.ttl)}</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#5d6b7c;">${escapeHtml(input.dict.email.fallback)}</p>
                <p style="margin:0;font-size:13px;line-height:1.55;word-break:break-all;">
                  <a href="${escapeHtml(input.url)}" style="color:#16383F;">${escapeHtml(input.url)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  const text = [input.title, "", input.body, "", input.cta, input.url, "", input.ttl].join("\n");
  const client = await resendClient();
  if (!client) {
    console.info("[homioqo] access email (logged)", { to: input.to, url: input.url });
    return { delivered: false as const };
  }
  await client.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    html,
    text,
  });
  return { delivered: true as const };
}

export async function sendQrSignOrderNotice(input: {
  order: QrSignOrder;
  propertyName: string;
  organizationName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) {
  const to = founderInbox();
  const { order } = input;
  const subject = `Beställning: tryckt QR-skylt – ${input.propertyName}`;
  const text = [
    `${FOUNDER_FIRST_NAME}, det här är en betald beställning av en tryckt QR-skylt.`,
    "Kunden har inte debiterats. Följ upp med faktura och leverans.",
    "",
    `Pris: ${QR_SIGN_PRICE_EUR} € inkl. moms (QR-skylt + uppstart, frakt i Sverige ingår)`,
    `Bostad: ${input.propertyName}`,
    `Property-id: ${order.propertyId}`,
    `QR-token: ${order.qrToken}`,
    `Organisation: ${input.organizationName}`,
    `Kund: ${input.customerName}`,
    `E-post: ${input.customerEmail}`,
    `Telefon: ${input.customerPhone}`,
    "",
    "Leveransadress:",
    order.shippingName,
    order.shippingAddress,
    `${order.shippingPostalCode} ${order.shippingCity}`,
    order.shippingPhone,
    order.shippingEmail,
    "",
    `Tid: ${order.createdAt}`,
    `Order-id: ${order.id}`,
  ].join("\n");
  const client = await resendClient();
  if (!client) {
    console.info("[homioqo] QR sign order (logged)", { to, subject, text });
    return { delivered: false as const };
  }
  await client.emails.send({
    from: fromAddress(),
    to,
    subject,
    text,
  });
  return { delivered: true as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
