import QRCode from "qrcode";

export async function qrDataUrl(text: string, size = 480): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#15233B", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}

export async function qrPngBuffer(text: string, size = 720): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    width: size,
    margin: 1,
    color: { dark: "#15233B", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
    type: "png",
  });
}
