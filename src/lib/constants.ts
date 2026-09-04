export const DEMO_EMAIL = "anna@homioqo.se";
export const DEMO_PASSWORD = "demo1234";
export const TEST_CLEANER_EMAIL = "maria@homioqo.se";
export const TEST_CONTRACTOR_EMAIL = "omar@homioqo.se";
export const TEST_OWNER_EMAIL = "lina@homioqo.se";
export const TEST_OTHER_HOST_EMAIL = "erik@norrbo.se";
export const SESSION_COOKIE = "homioqo.session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const LOCALE_COOKIE = "homioqo.locale";
export const PENDING_SIGNUP_COOKIE = "homioqo.pendingSignup";
export const ACCOUNT_SNAPSHOT_COOKIE = "homioqo.account";
export const EMAIL_FLASH_COOKIE = "homioqo.emailFlash";
export const DEFAULT_LOCALE = "sv";
export const FALLBACK_LOCALE = "en";
export const TRIAL_DAYS = 30;
export const TRIAL_PROPERTY_LIMIT = 5;
export const VERIFY_TTL_HOURS = 24;
export const INCLUDED_QR_CODES = 5;
export const RESEND_LIMIT = 3;
export const RESEND_WINDOW_MS = 15 * 60 * 1000;
export const REGISTER_LIMIT = 5;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;
export const LOGIN_LIMIT = 8;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const PUBLIC_QR_LIMIT = 80;
export const PUBLIC_QR_WINDOW_MS = 60 * 1000;
export const REPORT_LIMIT = 8;
export const REPORT_WINDOW_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_HOURS = 1;
export const INVITE_TTL_HOURS = 72;
export const LOGIN_LINK_TTL_MINUTES = 20;
export const GUEST_UNLOCK_COOKIE = "homioqo.guestUnlock";
export const GUEST_UNLOCK_MAX_AGE = 60 * 60 * 12;

export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export const SUPPORT_EMAIL = "hej@homioqo.se";
export const SUPPORT_PHONE = "08-123 45 67";
export const EMERGENCY_PHONE = "112";

/** Founder first name only — no last name is used in the product. */
export const FOUNDER_FIRST_NAME = "Julius";

/** Inbox for demo, signup and QR-order notices. Override with ADMIN_EMAIL. */
export const FOUNDER_EMAIL = "juliuswalden8@gmail.com";

/** Monthly price per property, inkl. moms. Founder range was 12–15 €. */
export const PRICE_MONTHLY_EUR = 14;
/** QR sign + startup per property, inkl. moms. Founder range was 39–59 €. */
export const PRICE_SETUP_EUR = 49;
/** Same as setup — printed QR sign plus personal install, invoiced by Julius. */
export const QR_SIGN_PRICE_EUR = PRICE_SETUP_EUR;
/** Rough SEK hint for Swedish copy. Not a live FX rate. */
export const EUR_TO_SEK_APPROX = 11;

export function founderInbox() {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    FOUNDER_EMAIL
  );
}
