import type { StaffRole } from "@/lib/types";

export function roleHome(role: StaffRole): string {
  switch (role) {
    case "owner":
      return "/app/owner";
    case "cleaner":
      return "/app/cleaner";
    case "contractor":
      return "/app/contractor";
    default:
      return "/app";
  }
}

export function isHostPath(pathname: string): boolean {
  if (pathname === "/app/owner" || pathname.startsWith("/app/owner/")) return false;
  if (pathname === "/app/cleaner" || pathname.startsWith("/app/cleaner/")) return false;
  if (pathname === "/app/contractor" || pathname.startsWith("/app/contractor/")) return false;
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function allowedPathForRole(role: StaffRole, pathname: string): boolean {
  const home = roleHome(role);
  if (role === "host") return isHostPath(pathname);
  return pathname === home || pathname.startsWith(`${home}/`);
}
