import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Signing key for session cookies. Prefer SESSION_SECRET in every environment.
 * Production still needs a stable key if the env var is missing (Vercel login
 * would otherwise crash). Derive one from the project id so cookies cannot be
 * forged with an empty secret, then fall back to a per-process key in dev.
 */
function sessionSecret() {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  const vercelProject = process.env.VERCEL_PROJECT_ID?.trim();
  if (vercelProject) {
    return createHash("sha256")
      .update(`homioqo.session.v1:${vercelProject}`)
      .digest("hex");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a value of at least 16 characters.");
  }
  const globalForKey = globalThis as unknown as { __hqDevSessionKey?: string };
  globalForKey.__hqDevSessionKey ??= randomBytes(32).toString("base64url");
  return globalForKey.__hqDevSessionKey;
}

export function signValue(value: string) {
  const mac = createHmac("sha256", sessionSecret()).update(value).digest("base64url");
  return `${value}.${mac}`;
}

/** Returns the payload only when the signature verifies. */
export function unsignValue(signed: string): string | null {
  try {
    const index = signed.lastIndexOf(".");
    if (index <= 0) return null;
    const value = signed.slice(0, index);
    const provided = Buffer.from(signed.slice(index + 1));
    const expected = Buffer.from(
      createHmac("sha256", sessionSecret()).update(value).digest("base64url"),
    );
    if (provided.length !== expected.length) return null;
    return timingSafeEqual(provided, expected) ? value : null;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}
