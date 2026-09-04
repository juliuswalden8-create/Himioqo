import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/constants";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface PhotoInput {
  url: string;
  caption?: string;
}

const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i;

const MAGIC = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: "RIFF",
} as const;

/** Approximate decoded byte length of a base64 payload without decoding it. */
function base64Bytes(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function sniffImage(bytes: Uint8Array): (typeof ALLOWED_IMAGE_TYPES)[number] | null {
  if (bytes.length < 12) return null;
  if (MAGIC.jpeg.every((value, index) => bytes[index] === value)) return "image/jpeg";
  if (MAGIC.png.every((value, index) => bytes[index] === value)) return "image/png";
  const ascii = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (ascii === MAGIC.webp && webp === "WEBP") return "image/webp";
  return null;
}

/** Drop JPEG APP1 (EXIF/GPS). Other types are returned unchanged. */
export function stripJpegExif(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const chunks: Buffer[] = [Buffer.from([0xff, 0xd8])];
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) {
      chunks.push(Buffer.from(bytes.subarray(i)));
      break;
    }
    const marker = bytes[i + 1];
    if (marker === 0xda) {
      chunks.push(Buffer.from(bytes.subarray(i)));
      break;
    }
    const size = (bytes[i + 2] << 8) + bytes[i + 3];
    if (size < 2) break;
    if (marker === 0xe1) {
      i += 2 + size;
      continue;
    }
    chunks.push(Buffer.from(bytes.subarray(i, i + 2 + size)));
    i += 2 + size;
  }
  return new Uint8Array(Buffer.concat(chunks));
}

function toDataUrl(mime: string, bytes: Uint8Array) {
  const binary = Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${binary}`;
}

export type PhotoParseResult =
  | { ok: true; photos: PhotoInput[] }
  | { ok: false; reason: "malformed" | "type" | "size" | "count" };

/**
 * Server-side gate for anything that accepts photos. Checks declared MIME,
 * magic bytes, size, and strips JPEG EXIF/GPS. SVG/HTML/scripts never pass.
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
    const declared = mime.toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(declared as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return { ok: false, reason: "type" };
    }
    if (base64Bytes(base64) > MAX_PHOTO_BYTES) return { ok: false, reason: "size" };

    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(Buffer.from(base64, "base64"));
    } catch {
      return { ok: false, reason: "malformed" };
    }
    const sniffed = sniffImage(bytes);
    if (!sniffed || sniffed !== declared) return { ok: false, reason: "type" };
    const cleaned = sniffed === "image/jpeg" ? stripJpegExif(bytes) : bytes;

    const caption = (entry as { caption?: unknown }).caption;
    photos.push({
      url: toDataUrl(sniffed, cleaned),
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
