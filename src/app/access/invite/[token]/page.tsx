import Link from "next/link";
import { decodeAccessTicket, isAccessTicketExpired } from "@/lib/access/tickets";
import { AcceptInviteForm } from "@/components/access/accept-invite-form";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { getInvitationByToken, getOrganization } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: encoded } = await params;
  const token = decodeURIComponent(encoded);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const ticket = decodeAccessTicket(token);
  const invitation = getInvitationByToken(token);
  const invalid =
    !ticket ||
    ticket.k !== "invite" ||
    isAccessTicketExpired(ticket) ||
    !invitation ||
    invitation.acceptedAt ||
    invitation.revokedAt;

  if (invalid) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 bg-canvas px-5 py-10">
        <h1 className="text-xl font-semibold text-navy-800">{dict.access.loginFailed}</h1>
        <Link href="/login" className="text-sm font-medium text-navy-700 underline">
          {dict.access.backToLogin}
        </Link>
      </main>
    );
  }

  const org = getOrganization(invitation.organizationId);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-canvas px-5 py-10">
      <div className="rounded-3xl border border-border bg-white p-7 shadow-soft">
        <h1 className="text-xl font-semibold text-navy-800">{dict.access.inviteTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {interpolate(dict.access.inviteBody, {
            org: org?.name ?? "Homioqo",
            role: dict.access.roles[invitation.role],
          })}
        </p>
        <AcceptInviteForm dict={dict} token={token} email={invitation.email} />
      </div>
    </main>
  );
}
