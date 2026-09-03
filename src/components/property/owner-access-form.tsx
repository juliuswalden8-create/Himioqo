"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { createOwnerAccessAction } from "@/lib/owner-actions";

export function OwnerAccessForm({
  propertyId,
  dict,
}: {
  propertyId: string;
  dict: Dictionary;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-x-6 gap-y-5 border-t border-border pt-4 sm:grid-cols-2"
      action={(data) => {
        data.set("propertyId", propertyId);
        setError(null);
        start(async () => {
          const result = await createOwnerAccessAction(data);
          if (result?.error === "required") setError(dict.errors.required);
          else if (result?.error === "email") setError(dict.errors.email);
          else if (result?.error) setError(dict.errors.generic);
        });
      }}
    >
      <FormField label={dict.owner.ownerName} htmlFor="owner-name" required>
        <Input id="owner-name" name="ownerName" required maxLength={120} />
      </FormField>
      <FormField label={dict.owner.ownerEmail} htmlFor="owner-email" required>
        <Input id="owner-email" name="ownerEmail" type="email" required maxLength={200} />
      </FormField>
      {error ? <FormError className="sm:col-span-2">{error}</FormError> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {dict.owner.createAccess}
        </Button>
      </div>
    </form>
  );
}
