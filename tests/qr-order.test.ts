import { beforeEach, describe, expect, it } from "vitest";
import { canOrderQrSign } from "@/lib/access/permissions";
import { FOUNDER_FIRST_NAME, QR_SIGN_PRICE_EUR } from "@/lib/constants";
import {
  createMembership,
  createProperty,
  createStaffProfile,
  getGuestGuide,
  getMembership,
  getOpenQrSignOrder,
  getPublicQrSign,
  listQrSignOrders,
  placeQrSignOrder,
  resetStore,
  updateProperty,
} from "@/lib/data/store";
import { sv } from "@/i18n/messages";
import { interpolate } from "@/i18n/interpolate";

const ORG = "org_bergstrom";
const HOST_MEM = "mem_anna_host";

function shipping() {
  return {
    shippingName: "Anna Bergström",
    shippingAddress: "Strandvägen 14B",
    shippingPostalCode: "114 51",
    shippingCity: "Stockholm",
    shippingPhone: "070-312 44 18",
    shippingEmail: "anna@homioqo.se",
    orderedByProfileId: "profile_anna",
  };
}

beforeEach(() => {
  resetStore();
});

describe("QR sign orders", () => {
  it("lets a host order a printed sign for a property in their organisation", () => {
    const host = getMembership(HOST_MEM);
    const order = placeQrSignOrder({
      membership: host,
      propertyId: "prop_strand",
      ...shipping(),
    });

    expect(order.organizationId).toBe(ORG);
    expect(order.propertyId).toBe("prop_strand");
    expect(order.qrToken).toBe("qr_strand14");
    expect(order.priceEur).toBe(QR_SIGN_PRICE_EUR);
    expect(order.priceEur).toBe(49);
    expect(order.status).toBe("open");
    expect(listQrSignOrders(ORG, "prop_strand")).toHaveLength(1);
    expect(getOpenQrSignOrder(ORG, "prop_strand")?.id).toBe(order.id);
  });

  it("keeps the founder setup price at 49 € and allows another order for extras", () => {
    expect(QR_SIGN_PRICE_EUR).toBe(49);
    const host = getMembership(HOST_MEM);
    placeQrSignOrder({ membership: host, propertyId: "prop_strand", ...shipping() });
    const extra = placeQrSignOrder({
      membership: host,
      propertyId: "prop_strand",
      ...shipping(),
      shippingName: "Extra skylt",
    });
    expect(extra.priceEur).toBe(49);
    expect(listQrSignOrders(ORG, "prop_strand")).toHaveLength(2);
    expect(getOpenQrSignOrder(ORG, "prop_strand")).toBeDefined();
  });

  it("rejects unauthenticated and non-host actors", () => {
    expect(() =>
      placeQrSignOrder({ membership: null, propertyId: "prop_strand", ...shipping() }),
    ).toThrow("forbidden");

    const cleaner = createStaffProfile({
      organizationId: ORG,
      firstName: "Mia",
      lastName: "Clean",
      email: "mia-qr@clean.test",
    });
    const cleanerMem = createMembership({
      userId: cleaner.id,
      organizationId: ORG,
      role: "cleaner",
      propertyIds: ["prop_strand"],
    });
    expect(canOrderQrSign(cleanerMem, "prop_strand")).toBe(false);
    expect(() =>
      placeQrSignOrder({ membership: cleanerMem, propertyId: "prop_strand", ...shipping() }),
    ).toThrow("forbidden");
    expect(listQrSignOrders(ORG, "prop_strand")).toHaveLength(0);
  });

  it("does not let another organisation order for a home they do not own", () => {
    const host = getMembership(HOST_MEM);
    const outsider = createProperty("org_intruder", {
      name: "Intruder House",
      address: "Nowhere 1",
      city: "Nowhere",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "apartment",
      sqm: 50,
      rooms: 2,
      tenantName: "Someone",
      tenantEmail: "",
      tenantPhone: "",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
    });
    expect(() =>
      placeQrSignOrder({ membership: host, propertyId: outsider.id, ...shipping() }),
    ).toThrow("forbidden");
  });
});

describe("public QR sign", () => {
  it("never includes notes or owner internals on the print payload", () => {
    const home = createProperty(ORG, {
      name: "Villa Test",
      address: "Testvägen 1",
      city: "Malmö",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "house",
      sqm: 90,
      rooms: 4,
      tenantName: "Hidden Tenant",
      tenantEmail: "owner-secret@example.com",
      tenantPhone: "070-000 00 00",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
      notes: "SECRET_OWNER_NOTE",
    });
    updateProperty(ORG, home.id, { notes: "SECRET_OWNER_NOTE" });

    const view = getPublicQrSign(home.reportToken);
    const raw = JSON.stringify(view);
    expect(view?.name).toBe("Villa Test");
    expect(raw).not.toContain("SECRET_OWNER_NOTE");
    expect(raw).not.toContain("owner-secret@example.com");
    expect(raw).not.toContain("Hidden Tenant");
    expect(raw).not.toContain("notes");
    expect(Object.keys(view ?? {})).toEqual(["name", "address", "city", "reportToken"]);

    const guide = getGuestGuide(home.reportToken);
    const guideRaw = JSON.stringify(guide);
    expect(guideRaw).not.toContain("SECRET_OWNER_NOTE");
    expect(guide?.property).not.toHaveProperty("notes");
    expect(guide?.property).not.toHaveProperty("tenantEmail");
  });

  it("mints a unique QR token when a host creates a home", () => {
    const first = createProperty(ORG, {
      name: "First",
      address: "A 1",
      city: "Göteborg",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "apartment",
      sqm: 40,
      rooms: 1,
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
    });
    const second = createProperty(ORG, {
      name: "Second",
      address: "B 2",
      city: "Göteborg",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "apartment",
      sqm: 40,
      rooms: 1,
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
    });
    expect(first.reportToken).toMatch(/^qr_/);
    expect(second.reportToken).toMatch(/^qr_/);
    expect(first.reportToken).not.toBe(second.reportToken);
  });
});

describe("founder copy", () => {
  it("names Julius as founder in customer-facing QR order strings", () => {
    const named = interpolate(sv.qrOrder.founder, { name: FOUNDER_FIRST_NAME });
    const success = interpolate(sv.qrOrder.success, { name: FOUNDER_FIRST_NAME });
    expect(FOUNDER_FIRST_NAME).toBe("Julius");
    expect(named).toContain("Julius");
    expect(named.toLowerCase()).toContain("grundare");
    expect(success).toContain("Julius");
    expect(sv.marketing.founder.heading).toContain("{name}");
    expect(sv.marketing.founder.heading).toContain("grundare av Homioqo");
  });
});
