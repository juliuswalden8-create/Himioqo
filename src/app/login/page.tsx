import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/app";

  return <LoginForm dict={dict} next={next} />;
}
