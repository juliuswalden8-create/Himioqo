import { cookies } from "next/headers";
import { PENDING_SIGNUP_COOKIE } from "@/lib/constants";
import { upsertTrialAccountFromTicket } from "@/lib/data/store";
import {
  decodeSignupTicket,
  isSignupTicketExpired,
} from "@/lib/signup-ticket";

export async function getPendingSignup() {
  const jar = await cookies();
  const value = jar.get(PENDING_SIGNUP_COOKIE)?.value;
  if (!value) return null;
  const ticket = decodeSignupTicket(value);
  if (!ticket || isSignupTicketExpired(ticket)) return null;
  return {
    profile: upsertTrialAccountFromTicket(ticket),
    token: value,
    ticket,
  };
}

export async function getPendingSignupId() {
  return (await getPendingSignup())?.profile.id ?? null;
}
