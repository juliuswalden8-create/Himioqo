"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
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
      <div className="space-y-1.5">
        <Label htmlFor="owner-name">{dict.owner.ownerName}</Label>
        <Input id="owner-name" name="ownerName" required maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="owner-email">{dict.owner.ownerEmail}</Label>
        <Input id="owner-email" name="ownerEmail" type="email" required maxLength={200} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {dict.owner.createAccess}
        </Button>
      </div>
    </form>
  );
}
