import type { Metadata } from "next";
import Link from "next/link";
import { consumeLoginLinkAction } from "@/lib/access-actions";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.access.loginTitle);
}

export default async function LoginLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: encoded } = await params;
  const token = decodeURIComponent(encoded);
  const result = await consumeLoginLinkAction(token);
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 bg-canvas px-5 py-10">
      <h1 className="text-xl font-semibold text-navy-800">{dict.access.loginFailed}</h1>
      {result?.error ? (
        <p className="text-sm text-muted-foreground">
          {dict.errors[result.error] ?? dict.errors.token}
        </p>
      ) : null}
      <Link href="/login" className="text-sm font-medium text-navy-700 underline">
        {dict.access.backToLogin}
      </Link>
    </main>
  );
}
