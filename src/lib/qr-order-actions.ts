"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { FOUNDER_FIRST_NAME } from "@/lib/constants";
import {
  getOrganization,
  getProfile,
  getProperty,
  placeQrSignOrder,
  pushNotification,
} from "@/lib/data/store";
import { sendQrSignOrderNotice } from "@/lib/email/send";
import { getSession } from "@/lib/session";
import { isValidEmail, isValidPhone } from "@/lib/utils";

export type QrOrderState = { error?: string; ok?: boolean } | null;

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function orderQrSignAction(
  _prev: QrOrderState,
  formData: FormData,
): Promise<QrOrderState> {
  const session = await getSession();
  if (!session) return { error: "forbidden" };

  const propertyId = field(formData, "propertyId");
  const shippingName = field(formData, "shippingName");
  const shippingAddress = field(formData, "shippingAddress");
  const shippingPostalCode = field(formData, "shippingPostalCode");
  const shippingCity = field(formData, "shippingCity");
  const shippingPhone = field(formData, "shippingPhone");
  const shippingEmail = field(formData, "shippingEmail").toLowerCase();

  if (
    !propertyId ||
    !shippingName ||
    !shippingAddress ||
    !shippingPostalCode ||
    !shippingCity ||
    !shippingPhone ||
    !shippingEmail
  ) {
    return { error: "required" };
  }
  if (!isValidEmail(shippingEmail)) return { error: "email" };
  if (!isValidPhone(shippingPhone)) return { error: "phone" };

  const membership = session.membership;
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);

  try {
    const order = placeQrSignOrder({
      membership,
      propertyId,
      shippingName,
      shippingAddress,
      shippingPostalCode,
      shippingCity,
      shippingPhone,
      shippingEmail,
      orderedByProfileId: session.profileId,
    });
    const property = getProperty(session.organizationId, propertyId);
    await sendQrSignOrderNotice({
      order,
      propertyName: property?.name ?? propertyId,
      organizationName: org?.name ?? session.organizationId,
      customerName: profile?.fullName ?? shippingName,
      customerEmail: profile?.email ?? shippingEmail,
      customerPhone: profile?.phone ?? shippingPhone,
    });
    const dict = await getDictionary(profile?.locale);
    pushNotification({
      organizationId: session.organizationId,
      kind: "qr_sign_ordered",
      title: interpolate(dict.qrOrder.notifyTitle, { name: FOUNDER_FIRST_NAME }),
      body: interpolate(dict.qrOrder.notifyBody, { name: FOUNDER_FIRST_NAME }),
      href: `/app/properties/${propertyId}?tab=qr`,
    });
    revalidatePath(`/app/properties/${propertyId}`);
    revalidatePath("/app/notifications");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return { error: "forbidden" };
    }
    return { error: "generic" };
  }
}
