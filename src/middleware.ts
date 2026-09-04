import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { allowedPathForRole, roleHome } from "@/lib/access/roles";
import { sessionFromSignedCookie } from "@/lib/access/session-cookie";
import { PUBLIC_QR_LIMIT, PUBLIC_QR_WINDOW_MS, SESSION_COOKIE } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security/events";
import { updateSession } from "@/lib/supabase/middleware";

function publicTokenPath(pathname: string) {
  return (
    pathname.startsWith("/g/") ||
    pathname.startsWith("/qr/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/t/") ||
    pathname.startsWith("/o/") ||
    pathname.startsWith("/w/")
  );
}

function isAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export async function middleware(request: NextRequest) {
  let response: NextResponse;
  try {
    response = await updateSession(request);
  } catch {
    response = NextResponse.next({ request });
  }
  const { pathname } = request.nextUrl;
  if (publicTokenPath(pathname)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
    const limited = rateLimit(`qr:${ip}`, PUBLIC_QR_LIMIT, PUBLIC_QR_WINDOW_MS);
    if (!limited.ok) {
      logSecurityEvent("rate_limited", { subject: "public-token", detail: pathname.slice(0, 24) });
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionCookie ? sessionFromSignedCookie(sessionCookie) : null;

  if (isAppPath(pathname) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  if (session && isAppPath(pathname) && !allowedPathForRole(session.role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(session.role);
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
