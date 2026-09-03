import { VERIFY_TTL_HOURS } from "@/lib/constants";
import { signValue, unsignValue } from "@/lib/crypto";
import { ACCOUNT_TYPES, type AccountType, type Organization, type Profile, type UnitBand } from "@/lib/types";

const UNIT_BANDS: readonly UnitBand[] = ["1-5", "6-20", "21-50", "51-200", "200+"];

/** Compact signed payload so a verification link works without in-memory state. */
export interface SignupTicket {
  v: 1;
  pid: string;
  oid: string;
  fn: string;
  ln: string;
  em: string;
  ph: string;
  pc: string;
  co: string;
  lo: string;
  ub: UnitBand;
  mk: boolean;
  on: string;
  at: AccountType;
  exp: number;
}

export function encodeSignupTicket(
  ticket: Omit<SignupTicket, "v" | "exp"> & { exp?: number },
) {
  const payload: SignupTicket = {
    v: 1,
    ...ticket,
    exp: ticket.exp ?? Date.now() + VERIFY_TTL_HOURS * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return signValue(encoded);
}

export function decodeSignupTicket(raw: string): SignupTicket | null {
  const encoded = unsignValue(raw);
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<SignupTicket>;
    if (parsed.v !== 1) return null;
    if (!parsed.pid || !parsed.oid || !parsed.em || !parsed.fn || !parsed.ln) return null;
    if (!parsed.ph || !parsed.pc || !parsed.co || !parsed.lo || !parsed.on) return null;
    if (typeof parsed.exp !== "number" || typeof parsed.mk !== "boolean") return null;
    if (!UNIT_BANDS.includes(parsed.ub as UnitBand)) return null;
    if (!ACCOUNT_TYPES.includes(parsed.at as AccountType)) return null;
    return parsed as SignupTicket;
  } catch {
    return null;
  }
}

export function isSignupTicketExpired(ticket: SignupTicket) {
  return ticket.exp < Date.now();
}

export function ticketFromProfile(profile: Profile, org: Organization): Omit<SignupTicket, "v" | "exp"> {
  return {
    pid: profile.id,
    oid: org.id,
    fn: profile.firstName,
    ln: profile.lastName,
    em: profile.email,
    ph: profile.phone,
    pc: profile.phoneCountry,
    co: profile.country,
    lo: profile.locale,
    ub: profile.unitBand,
    mk: profile.marketingConsent,
    on: org.name,
    at: org.accountType,
  };
}
