"use server";

import { revalidatePath } from "next/cache";
import {
  createOwnerAccess,
  rotateOwnerAccess,
  setOwnerAccessActive,
} from "@/lib/data/store";
import { requireSession } from "@/lib/session";
import { isValidEmail } from "@/lib/utils";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createOwnerAccessAction(formData: FormData) {
  const session = await requireSession();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "");

  if (!ownerName) return { error: "required" as const };
  if (!ownerEmail || !isValidEmail(ownerEmail)) return { error: "email" as const };

  try {
    createOwnerAccess({
      organizationId: session.organizationId,
      propertyId,
      ownerName: ownerName.slice(0, 120),
      ownerEmail: ownerEmail.slice(0, 200),
    });
  } catch {
    return { error: "generic" as const };
  }
  revalidateAll();
}

export async function toggleOwnerAccessAction(formData: FormData) {
  const session = await requireSession();
  setOwnerAccessActive(
    session.organizationId,
    String(formData.get("id") ?? ""),
    String(formData.get("active") ?? "") === "1",
  );
  revalidateAll();
}

export async function rotateOwnerAccessAction(formData: FormData) {
  const session = await requireSession();
  rotateOwnerAccess(session.organizationId, String(formData.get("id") ?? ""));
  revalidateAll();
}
