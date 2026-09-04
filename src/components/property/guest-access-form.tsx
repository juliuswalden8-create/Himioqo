"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { revokeGuestLinkAction, saveGuestAccessAction } from "@/lib/access-actions";

export function GuestAccessForm({
  dict,
  propertyId,
  hasPin,
  expiresAt,
}: {
  dict: Dictionary;
  propertyId: string;
  hasPin: boolean;
  expiresAt?: string;
}) {
  const [state, action, pending] = useActionState(saveGuestAccessAction, null);
  const dateValue = expiresAt ? expiresAt.slice(0, 16) : "";

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="propertyId" value={propertyId} />
        <FormField label={dict.homes.guestPin} htmlFor="guest-pin" hint={dict.homes.guestPinHelp}>
          <Input
            id="guest-pin"
            name="pin"
            type="text"
            autoComplete="off"
            placeholder={dict.homes.guestPinPlaceholder}
          />
        </FormField>
        {hasPin ? (
          <label className="flex min-h-11 items-center gap-3 text-sm text-navy-800">
            <input type="checkbox" name="clearPin" value="1" className="h-4 w-4" />
            {dict.homes.guestClearPin}
          </label>
        ) : null}
        <FormField label={dict.homes.guestExpiry} htmlFor="guest-expiry" hint={dict.homes.guestExpiryHelp}>
          <Input id="guest-expiry" name="expiresAt" type="datetime-local" defaultValue={dateValue} />
        </FormField>
        {state?.error ? <FormError>{dict.errors.generic}</FormError> : null}
        {state?.saved ? <p className="text-sm text-green-700">{dict.homes.saved}</p> : null}
        {hasPin ? <p className="text-xs text-muted-foreground">{dict.homes.guestHasPin}</p> : null}
        <Button type="submit" variant="secondary" disabled={pending}>
          {dict.homes.saveGuestAccess}
        </Button>
      </form>
      <form action={revokeGuestLinkAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <p className="text-xs text-muted-foreground">{dict.homes.guestRevokeHelp}</p>
        <Button type="submit" variant="secondary" className="mt-2">
          {dict.homes.guestRevoke}
        </Button>
      </form>
    </div>
  );
}
