import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { RoleSwitcher } from "@/components/role-switcher";
import type { Dictionary } from "@/i18n/messages";
import { interpolate } from "@/i18n/interpolate";
import { logoutAction } from "@/lib/actions";
import { getOrganization, listMembershipsForUser, unreadNotificationCount } from "@/lib/data/store";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function AppHeader({
  dict,
  orgName,
  current,
}: {
  dict: Dictionary;
  orgName?: string;
  current?: "overview" | "cases" | "cleaning" | "homes" | "settings";
}) {
  // Resolved here rather than passed in, so every page gets an accurate badge
  // without each one having to remember to fetch it.
  const session = await getSession();
  const unreadCount = session ? unreadNotificationCount(session.organizationId) : 0;
  const memberships = session ? listMembershipsForUser(session.profileId) : [];
  const switcherOptions = memberships.map((item) => ({
    id: item.id,
    label: `${getOrganization(item.organizationId)?.name ?? ""} · ${dict.access.roles[item.role]}`,
  }));

  const links = [
    { href: "/app", id: "overview" as const, label: dict.nav.overview },
    { href: "/app/cases", id: "cases" as const, label: dict.nav.cases },
    { href: "/app/cleaning", id: "cleaning" as const, label: dict.nav.cleaning },
    { href: "/app/properties", id: "homes" as const, label: dict.nav.homes },
    { href: "/app/settings", id: "settings" as const, label: dict.settings.title },
  ];

  return (
    <header className="border-b border-border bg-white">
      <div className="container-page flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-6">
          <Logo href="/app" />
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-navy-700 hover:underline",
                  current === link.id && "font-medium text-navy-800",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/app/notifications"
            className="relative shrink-0 text-sm text-navy-700 hover:underline"
          >
            {dict.notifications.title}
            {unreadCount ? (
              <span
                className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-status-urgent px-1.5 py-0.5 text-[11px] font-medium text-white"
                aria-label={interpolate(dict.notifications.unread, {
                  count: String(unreadCount),
                })}
              >
                {unreadCount}
              </span>
            ) : null}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-navy-700 hover:underline">
              {dict.nav.logout}
            </button>
          </form>
          {switcherOptions.length > 1 && session ? (
            <RoleSwitcher dict={dict} currentId={session.membershipId} options={switcherOptions} />
          ) : null}
          <p className="hidden truncate text-sm text-muted-foreground sm:block">{orgName}</p>
        </div>
      </div>
      <nav className="container-page flex gap-4 overflow-x-auto pb-2 text-sm sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 text-navy-700",
              current === link.id && "font-medium text-navy-800",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
