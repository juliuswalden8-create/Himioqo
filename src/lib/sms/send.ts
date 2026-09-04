/**
 * Sends an SMS through Twilio's REST API when credentials are configured.
 * Returns delivered: false without pretending otherwise when they are missing.
 */
export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();
  if (!sid || !token || !from) {
    console.info("[homioqo] sms skipped (no Twilio credentials)", { to });
    return { delivered: false as const };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );
    if (!response.ok) {
      console.info("[homioqo] sms failed", { to, status: response.status });
      return { delivered: false as const };
    }
    return { delivered: true as const };
  } catch {
    console.info("[homioqo] sms error", { to });
    return { delivered: false as const };
  }
}
