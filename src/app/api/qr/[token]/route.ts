import { getPropertyByToken } from "@/lib/data/store";
import { qrPngBuffer } from "@/lib/qr";
import { appUrl, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Downloadable PNG of a property's guest QR code. Resolving the token first
 * means a rotated or unknown token cannot be used to probe for valid codes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const property = getPropertyByToken(token);
  if (!property) {
    return new Response("Not found", { status: 404 });
  }

  const png = await qrPngBuffer(appUrl(`/g/${token}`));
  const filename = `homioqo-qr-${slugify(property.name) || "property"}.png`;

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}
