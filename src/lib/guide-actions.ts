"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PLACE_CATEGORIES, parsePropertyType } from "@/lib/types";
import {
  assignPlaceToProperty,
  copyPropertyPlaces,
  copyPropertyGuide,
  canAddProperty,
  createPlace,
  createProperty,
  getPlace,
  getPropertyByToken,
  getProfile,
  moveGuideCategory,
  movePropertyPlace,
  recordGuideEvent,
  rotatePropertyToken,
  updatePlace,
  updateProperty,
  updatePropertyGuide,
  updatePropertyPlace,
} from "@/lib/data/store";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireHostSession } from "@/lib/session";
import type { LocalizedText, MonetizationKind, PlaceCategory } from "@/lib/types";

function revalidateGuide() {
  revalidatePath("/", "layout");
}

export async function createPropertyAction(formData: FormData) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const dict = await getDictionary(profile?.locale || "sv");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const tenantName =
    String(formData.get("tenantName") ?? "").trim() || dict.propertyForm.tenantDefault;
  if (!name || !address || !city) {
    redirect("/app/properties");
  }
  if (!canAddProperty(session.organizationId)) {
    redirect("/app/properties?limit=1");
  }
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const property = createProperty(session.organizationId, {
    name,
    address,
    city,
    country: "Sverige",
    countryCode: "SE",
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80",
    type: parsePropertyType(String(formData.get("type") ?? "")),
    sqm: 0,
    rooms: 0,
    tenantName,
    tenantEmail: "",
    tenantPhone: "",
    notes,
    leaseStart: new Date().toISOString(),
    leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastInspection: new Date().toISOString(),
  });
  revalidateGuide();
  redirect(`/app/properties/${property.id}`);
}

function loc(sv: string, en: string): LocalizedText {
  const next: LocalizedText = {};
  if (sv.trim()) next.sv = sv.trim();
  if (en.trim()) next.en = en.trim();
  return next;
}

export async function recordScanAction(token: string) {
  const property = getPropertyByToken(token);
  if (!property) return;
  recordGuideEvent({
    organizationId: property.organizationId,
    propertyId: property.id,
    kind: "scan",
  });
}

export async function recordGuideClickAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const placeId = String(formData.get("placeId") ?? "") || undefined;
  const kind = String(formData.get("kind") ?? "click_place") as
    | "click_place"
    | "click_whatsapp"
    | "click_maps"
    | "click_book"
    | "click_website"
    | "click_discount"
    | "click_phone"
    | "click_wifi";
  const property = getPropertyByToken(token);
  if (!property) return;
  recordGuideEvent({
    organizationId: property.organizationId,
    propertyId: property.id,
    placeId,
    kind,
  });
}

export async function rotatePropertyTokenAction(formData: FormData) {
  const session = await requireHostSession();
  rotatePropertyToken(session.organizationId, String(formData.get("propertyId") ?? ""));
  const { logSecurityEvent } = await import("@/lib/security/events");
  logSecurityEvent("qr_rotated");
  revalidatePath("/", "layout");
}

export async function savePropertyBasicsAction(formData: FormData) {
  const session = await requireHostSession();
  const id = String(formData.get("propertyId") ?? "");
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  updateProperty(session.organizationId, id, {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    type: parsePropertyType(String(formData.get("type") ?? "")),
    notes: notes || undefined,
    lat: latRaw ? Number(latRaw) : undefined,
    lng: lngRaw ? Number(lngRaw) : undefined,
  });
  revalidateGuide();
  redirect(`/app/properties/${id}?tab=info&saved=1`);
}

export async function saveGuideAction(formData: FormData) {
  const session = await requireHostSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  const numbers = String(formData.get("numbers") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, phone] = line.split("|").map((part) => part.trim());
      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        label: loc(label || "Nummer", label || "Number"),
        phone: phone || label || "",
      };
    });
  const applianceKeys = ["ac", "washer", "dishwasher", "pool", "other"] as const;
  const appliances = applianceKeys
    .map((key) => {
      const sv = String(formData.get(`appliance_${key}Sv`) ?? "").trim();
      const en = String(formData.get(`appliance_${key}En`) ?? "").trim();
      if (!sv && !en) return null;
      return {
        id: `ap_${propertyId}_${key}`,
        key,
        title: {},
        text: loc(sv, en),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  updatePropertyGuide(session.organizationId, propertyId, {
    welcome: loc(String(formData.get("welcomeSv") ?? ""), String(formData.get("welcomeEn") ?? "")),
    wifiName: String(formData.get("wifiName") ?? "").trim(),
    wifiPassword: String(formData.get("wifiPassword") ?? "").trim(),
    checkIn: String(formData.get("checkIn") ?? "").trim(),
    checkOut: String(formData.get("checkOut") ?? "").trim(),
    houseRules: loc(String(formData.get("rulesSv") ?? ""), String(formData.get("rulesEn") ?? "")),
    parking: loc(String(formData.get("parkingSv") ?? ""), String(formData.get("parkingEn") ?? "")),
    waste: loc(String(formData.get("wasteSv") ?? ""), String(formData.get("wasteEn") ?? "")),
    emergency: loc(String(formData.get("emergencySv") ?? ""), String(formData.get("emergencyEn") ?? "")),
    importantNumbers: numbers,
    appliances,
  });
  revalidateGuide();
  redirect(`/app/properties/${propertyId}?tab=info&saved=1`);
}

export async function createPlaceAction(formData: FormData) {
  const session = await requireHostSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  const category = String(formData.get("category") ?? "restaurants") as PlaceCategory;
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const sponsored = String(formData.get("sponsored") ?? "") === "on";
  const kind = (String(formData.get("monetization") ?? "none") as MonetizationKind) || "none";
  const place = createPlace(session.organizationId, {
    category: PLACE_CATEGORIES.includes(category) ? category : "restaurants",
    name: String(formData.get("name") ?? "").trim(),
    description: loc(String(formData.get("descriptionSv") ?? ""), String(formData.get("descriptionEn") ?? "")),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    hours: String(formData.get("hours") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || undefined,
    website: String(formData.get("website") ?? "").trim() || undefined,
    bookingUrl: String(formData.get("bookingUrl") ?? "").trim() || undefined,
    discountCode: String(formData.get("discountCode") ?? "").trim() || undefined,
    discountLabel: loc(
      String(formData.get("discountLabelSv") ?? ""),
      String(formData.get("discountLabelEn") ?? ""),
    ),
    lat: latRaw ? Number(latRaw) : undefined,
    lng: lngRaw ? Number(lngRaw) : undefined,
    sponsored: sponsored || kind === "sponsored" || kind === "paid",
    monetization: {
      kind,
      trackingCode: String(formData.get("trackingCode") ?? "").trim() || undefined,
    },
  });
  if (propertyId) assignPlaceToProperty(session.organizationId, propertyId, place.id);
  revalidateGuide();
}

export async function assignPlaceAction(formData: FormData) {
  const session = await requireHostSession();
  assignPlaceToProperty(
    session.organizationId,
    String(formData.get("propertyId") ?? ""),
    String(formData.get("placeId") ?? ""),
  );
  revalidateGuide();
}

export async function togglePlaceAction(formData: FormData) {
  const session = await requireHostSession();
  updatePropertyPlace(session.organizationId, String(formData.get("propertyPlaceId") ?? ""), {
    enabled: String(formData.get("enabled") ?? "") === "true",
  });
  revalidateGuide();
}

export async function movePlaceAction(formData: FormData) {
  const session = await requireHostSession();
  movePropertyPlace(
    session.organizationId,
    String(formData.get("propertyPlaceId") ?? ""),
    Number(formData.get("direction") ?? 0) === -1 ? -1 : 1,
  );
  revalidateGuide();
}

export async function copyPlacesAction(formData: FormData) {
  const session = await requireHostSession();
  copyPropertyPlaces(
    session.organizationId,
    String(formData.get("fromPropertyId") ?? ""),
    String(formData.get("propertyId") ?? ""),
  );
  revalidateGuide();
}

export async function copyGuideAction(formData: FormData) {
  const session = await requireHostSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  copyPropertyGuide(
    session.organizationId,
    String(formData.get("fromPropertyId") ?? ""),
    propertyId,
  );
  revalidateGuide();
  redirect(`/app/properties/${propertyId}?tab=info&saved=1`);
}

export async function moveCategoryAction(formData: FormData) {
  const session = await requireHostSession();
  moveGuideCategory(
    session.organizationId,
    String(formData.get("propertyId") ?? ""),
    String(formData.get("category") ?? "") as PlaceCategory,
    Number(formData.get("direction") ?? 0) === -1 ? -1 : 1,
  );
  revalidateGuide();
}

export async function savePlaceAction(formData: FormData) {
  const session = await requireHostSession();
  const placeId = String(formData.get("placeId") ?? "");
  const existing = getPlace(session.organizationId, placeId);
  if (!existing) return;
  const sponsored = String(formData.get("sponsored") ?? "") === "on";
  const kind = (String(formData.get("monetization") ?? existing.monetization.kind) as MonetizationKind) || "none";
  updatePlace(session.organizationId, placeId, {
    name: String(formData.get("name") ?? existing.name).trim(),
    hours: String(formData.get("hours") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || undefined,
    website: String(formData.get("website") ?? "").trim() || undefined,
    bookingUrl: String(formData.get("bookingUrl") ?? "").trim() || undefined,
    discountCode: String(formData.get("discountCode") ?? "").trim() || undefined,
    sponsored: sponsored || kind === "sponsored" || kind === "paid",
    monetization: {
      kind,
      trackingCode: String(formData.get("trackingCode") ?? "").trim() || existing.monetization.trackingCode,
    },
  });
  revalidateGuide();
}
