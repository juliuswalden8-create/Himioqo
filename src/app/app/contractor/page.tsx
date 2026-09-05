import Link from "next/link";
import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StaffHeader } from "@/components/staff-header";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { listCasesForMembership } from "@/lib/data/store";
import { categoryLabel } from "@/lib/labels";
import { requireRoleSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.access.contractorHome);
}

export default async function ContractorDashboardPage() {
  const session = await requireRoleSession("contractor");
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const cases = listCasesForMembership(session.membership);

  return (
    <div className="min-h-dvh bg-canvas">
      <StaffHeader dict={dict} title={dict.access.contractorHome} />
      <main className="container-page space-y-4 py-8">
        {cases.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={dict.access.contractorEmpty}
            description={dict.contractor.subtitle}
          />
        ) : (
          <ul className="space-y-3">
            {cases.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/app/contractor/${item.id}`}
                  className="block min-h-20 rounded-3xl border border-border bg-white px-5 py-4 shadow-soft"
                >
                  <p className="text-xs text-muted-foreground">{item.reference}</p>
                  <p className="mt-1 text-base font-semibold text-navy-800">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.property.name} · {item.property.address}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoryLabel(dict, item.category)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={item.status} dict={dict} />
                    <PriorityBadge priority={item.priority} dict={dict} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
