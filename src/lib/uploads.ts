import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/constants";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export interface PhotoInput {
  url: string;
  caption?: string;
}

const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i;

/** Approximate decoded byte length of a base64 payload without decoding it. */
function base64Bytes(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export type PhotoParseResult =
  | { ok: true; photos: PhotoInput[] }
  | { ok: false; reason: "malformed" | "type" | "size" | "count" };

/**
 * Server-side gate for anything that accepts photos. The browser also checks,
 * but a public form can be posted to directly, so this is the check that counts.
 */
export function parsePhotoPayload(raw: unknown, max = MAX_PHOTOS): PhotoParseResult {
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!Array.isArray(parsed)) return { ok: false, reason: "malformed" };
  if (parsed.length > max) return { ok: false, reason: "count" };

  const photos: PhotoInput[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") return { ok: false, reason: "malformed" };
    const url = (entry as { url?: unknown }).url;
    if (typeof url !== "string") return { ok: false, reason: "malformed" };

    const match = DATA_URL.exec(url);
    if (!match) return { ok: false, reason: "malformed" };
    const [, mime, base64] = match;
    if (!ALLOWED_IMAGE_TYPES.includes(mime.toLowerCase() as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return { ok: false, reason: "type" };
    }
    if (base64Bytes(base64) > MAX_PHOTO_BYTES) return { ok: false, reason: "size" };

    const caption = (entry as { caption?: unknown }).caption;
    photos.push({
      url,
      caption: typeof caption === "string" ? caption.slice(0, 200) : undefined,
    });
  }
  return { ok: true, photos };
}

/** Browser-side pre-check so the user gets feedback before a slow upload. */
export function checkFiles(files: File[]): { ok: true } | { ok: false; reason: "type" | "size" } {
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase() as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return { ok: false, reason: "type" };
    }
    if (file.size > MAX_PHOTO_BYTES) return { ok: false, reason: "size" };
  }
  return { ok: true };
}
