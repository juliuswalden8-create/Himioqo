import { Logo } from "@/components/brand/logo";
import { RoleSwitcher } from "@/components/role-switcher";
import type { Dictionary } from "@/i18n/messages";
import { logoutAction } from "@/lib/actions";
import { listMembershipsForUser, getOrganization } from "@/lib/data/store";
import { getSession } from "@/lib/session";

export async function StaffHeader({
  dict,
  title,
}: {
  dict: Dictionary;
  title: string;
}) {
  const session = await getSession();
  const memberships = session ? listMembershipsForUser(session.profileId) : [];
  const options = memberships.map((item) => ({
    id: item.id,
    label: `${getOrganization(item.organizationId)?.name ?? ""} · ${dict.access.roles[item.role]}`,
  }));

  return (
    <header className="border-b border-border bg-white">
      <div className="container-page flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/" />
          <p className="truncate text-sm font-medium text-navy-800">{title}</p>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {options.length > 1 && session ? (
            <RoleSwitcher dict={dict} currentId={session.membershipId} options={options} />
          ) : null}
          <form action={logoutAction}>
            <button type="submit" className="min-h-11 text-sm text-navy-700 hover:underline">
              {dict.nav.logout}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
