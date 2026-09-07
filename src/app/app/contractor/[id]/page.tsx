import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RespondButtons,
  StatusButtons,
  WorkMessageForm,
  WorkPhotoUpload,
} from "@/components/contractor/work-actions";
import { StaffHeader } from "@/components/staff-header";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { contractorMayAccessCase, getCase, getOrganization } from "@/lib/data/store";
import { categoryLabel } from "@/lib/labels";
import { requireRoleSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.access.contractorHome);
}

export default async function ContractorCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRoleSession("contractor");
  const { id } = await params;
  const item = getCase(session.organizationId, id);
  if (!item || !contractorMayAccessCase(session.membership, item)) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const org = getOrganization(item.organizationId);
  const guestPhotos = item.attachments.filter((a) => a.kind === "reported");
  const responded = Boolean(item.contractorAcceptedAt);
  const finished = item.status === "resolved" || item.status === "approved";

  return (
    <div className="min-h-dvh bg-canvas">
      <StaffHeader dict={dict} title={dict.access.contractorHome} />
      <main className="container-page max-w-md space-y-4 py-6">
        <Link href="/app/contractor" className="text-sm font-medium text-navy-700 underline">
          {dict.guide.back}
        </Link>
        <header>
          <p className="text-xs text-muted-foreground">{item.reference}</p>
          <h1 className="mt-1 text-xl font-semibold text-navy-800">{item.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.property.name} · {item.property.address}, {item.property.city}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} dict={dict} />
            <PriorityBadge priority={item.priority} dict={dict} />
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.contractor.task}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{categoryLabel(dict, item.category)}</p>
          <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{item.description}</p>
          {item.workInstructions ? (
            <div className="mt-3 rounded-xl bg-canvas px-3 py-2">
              <p className="text-xs font-medium text-navy-700">{dict.contractor.instructions}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{item.workInstructions}</p>
            </div>
          ) : null}
          {org?.supportPhone ? (
            <p className="mt-3 text-sm text-navy-700">
              {dict.access.contactHost}: {org.supportPhone}
            </p>
          ) : null}
        </section>

        {guestPhotos.length ? (
          <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.contractor.guestPhotos}</h2>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {guestPhotos.map((photo) => (
                <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={photo.url} alt={photo.caption || item.title} fill className="object-cover" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!responded && !finished ? <RespondButtons caseId={item.id} dict={dict} /> : null}
        {responded && !finished ? (
          <StatusButtons caseId={item.id} current={item.status} dict={dict} />
        ) : null}
        {responded && !finished ? (
          <div className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-soft">
            <WorkPhotoUpload
              caseId={item.id}
              kind="before"
              label={dict.contractor.addBefore}
              dict={dict}
            />
            <WorkPhotoUpload
              caseId={item.id}
              kind="after"
              label={dict.contractor.addAfter}
              dict={dict}
            />
            <WorkMessageForm caseId={item.id} locale={locale} dict={dict} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
