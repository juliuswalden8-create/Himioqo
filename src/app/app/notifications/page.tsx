import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { markNotificationsReadAction } from "@/lib/actions";
import {
  getOrganization,
  getProfile,
  listNotifications,
  unreadNotificationCount,
} from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const viewerLocale = profile?.locale || locale;
  const dict = await getDictionary(viewerLocale);

  const notifications = listNotifications(session.organizationId);
  const unread = unreadNotificationCount(session.organizationId);

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="overview" />
      <main className="container-page max-w-2xl space-y-6 py-8">
        <PageHeader
          title={dict.notifications.title}
          actions={
            unread ? (
              <form action={markNotificationsReadAction}>
                <Button type="submit" variant="secondary">
                  {dict.notifications.markAllRead}
                </Button>
              </form>
            ) : undefined
          }
        />

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict.notifications.empty}</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notice) => (
                <li key={notice.id}>
                  <Link
                    href={notice.href}
                    className="flex items-start gap-3 py-3"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        notice.read ? "bg-navy-200" : "bg-status-new",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm text-navy-800",
                          !notice.read && "font-medium",
                        )}
                      >
                        {notice.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{notice.body}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(notice.createdAt, viewerLocale)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
