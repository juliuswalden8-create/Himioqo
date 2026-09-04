type SecurityEventKind =
  | "login_failed"
  | "login_ok"
  | "logout"
  | "password_changed"
  | "password_reset_requested"
  | "role_switched"
  | "qr_rotated"
  | "qr_revoked"
  | "rate_limited"
  | "upload_rejected"
  | "guest_denied";

export interface SecurityEvent {
  at: string;
  kind: SecurityEventKind;
  /** Never a raw email, token or password. */
  subject?: string;
  detail?: string;
}

const globalForEvents = globalThis as unknown as { __hqSecurityLog?: SecurityEvent[] };

function logStore() {
  globalForEvents.__hqSecurityLog ??= [];
  return globalForEvents.__hqSecurityLog;
}

/** Security audit trail without personal data or secrets. */
export function logSecurityEvent(
  kind: SecurityEventKind,
  extra?: { subject?: string; detail?: string },
) {
  const entry: SecurityEvent = {
    at: new Date().toISOString(),
    kind,
    subject: extra?.subject?.slice(0, 80),
    detail: extra?.detail?.slice(0, 120),
  };
  const items = logStore();
  items.push(entry);
  if (items.length > 400) items.splice(0, items.length - 400);
  if (process.env.NODE_ENV !== "test") {
    console.info(`[security] ${kind}${entry.subject ? ` ${entry.subject}` : ""}`);
  }
}

export function listSecurityEvents() {
  return [...logStore()];
}

export function clearSecurityEvents() {
  logStore().length = 0;
}
