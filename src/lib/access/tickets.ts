import { INVITE_TTL_HOURS, LOGIN_LINK_TTL_MINUTES } from "@/lib/constants";
import { signValue, unsignValue } from "@/lib/crypto";
import { STAFF_ROLES, type StaffRole } from "@/lib/types";

export type AccessTicketKind = "invite" | "login";

export interface AccessTicket {
  v: 2;
  k: AccessTicketKind;
  oid: string;
  em: string;
  role: StaffRole;
  iid?: string;
  lid?: string;
  props: string[];
  dir?: string;
  exp: number;
}

function isRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

export function encodeAccessTicket(ticket: Omit<AccessTicket, "v" | "exp"> & { exp?: number }) {
  const hours = ticket.k === "login" ? LOGIN_LINK_TTL_MINUTES / 60 : INVITE_TTL_HOURS;
  const payload: AccessTicket = {
    v: 2,
    ...ticket,
    exp: ticket.exp ?? Date.now() + hours * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return signValue(encoded);
}

export function decodeAccessTicket(raw: string): AccessTicket | null {
  const encoded = unsignValue(raw);
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<AccessTicket>;
    if (parsed.v !== 2) return null;
    if (parsed.k !== "invite" && parsed.k !== "login") return null;
    if (!parsed.oid || !parsed.em || !isRole(parsed.role)) return null;
    if (typeof parsed.exp !== "number") return null;
    if (!Array.isArray(parsed.props)) return null;
    return parsed as AccessTicket;
  } catch {
    return null;
  }
}

export function isAccessTicketExpired(ticket: AccessTicket) {
  return ticket.exp < Date.now();
}
