"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField, FormGrid } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { interpolate } from "@/i18n/interpolate";
import type { Dictionary } from "@/i18n/messages";
import { FOUNDER_FIRST_NAME, QR_SIGN_PRICE_EUR } from "@/lib/constants";
import { orderQrSignAction, type QrOrderState } from "@/lib/qr-order-actions";

export function OrderQrForm({
  dict,
  propertyId,
  hasOpenOrder,
  defaults,
}: {
  dict: Dictionary;
  propertyId: string;
  hasOpenOrder: boolean;
  defaults: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
}) {
  const [state, action, pending] = useActionState<QrOrderState, FormData>(
    orderQrSignAction,
    null,
  );
  const copy = dict.qrOrder;
  const founder = { name: FOUNDER_FIRST_NAME };
  const errorText =
    state?.error && state.error in dict.errors
      ? dict.errors[state.error as keyof typeof dict.errors]
      : state?.error
        ? dict.errors.generic
        : undefined;

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-semibold text-navy-800">{copy.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{copy.help}</p>
        <p className="mt-2 text-sm font-semibold text-navy-800">
          {interpolate(copy.price, { price: String(QR_SIGN_PRICE_EUR) })}
        </p>
        <p className="mt-2 text-sm text-navy-700">{interpolate(copy.founder, founder)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{interpolate(copy.invoiceNote, founder)}</p>
      </div>

      {hasOpenOrder ? (
        <p className="rounded-xl bg-canvas px-3 py-2 text-sm text-navy-700">{copy.openOrder}</p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-xl bg-status-done/10 px-3 py-2 text-sm text-green-700" role="status">
          {interpolate(copy.success, founder)}
        </p>
      ) : null}

      <form action={action} className="space-y-4">
        <input type="hidden" name="propertyId" value={propertyId} />
        <p className="text-sm font-medium text-navy-800">{copy.shipping}</p>
        <FormField label={copy.shippingName} htmlFor="qr-shipping-name" required>
          <Input
            id="qr-shipping-name"
            name="shippingName"
            autoComplete="name"
            defaultValue={defaults.name}
            required
          />
        </FormField>
        <FormField label={copy.shippingAddress} htmlFor="qr-shipping-address" required>
          <Input
            id="qr-shipping-address"
            name="shippingAddress"
            autoComplete="street-address"
            defaultValue={defaults.address}
            required
          />
        </FormField>
        <FormGrid>
          <FormField label={copy.shippingPostalCode} htmlFor="qr-shipping-postcode" required>
            <Input
              id="qr-shipping-postcode"
              name="shippingPostalCode"
              autoComplete="postal-code"
              required
            />
          </FormField>
          <FormField label={copy.shippingCity} htmlFor="qr-shipping-city" required>
            <Input
              id="qr-shipping-city"
              name="shippingCity"
              autoComplete="address-level2"
              defaultValue={defaults.city}
              required
            />
          </FormField>
        </FormGrid>
        <FormField label={copy.shippingPhone} htmlFor="qr-shipping-phone" required>
          <Input
            id="qr-shipping-phone"
            name="shippingPhone"
            type="tel"
            autoComplete="tel"
            defaultValue={defaults.phone}
            required
          />
        </FormField>
        <FormField label={copy.shippingEmail} htmlFor="qr-shipping-email" required>
          <Input
            id="qr-shipping-email"
            name="shippingEmail"
            type="email"
            autoComplete="email"
            defaultValue={defaults.email}
            required
          />
        </FormField>
        {errorText ? <FormError>{errorText}</FormError> : null}
        <Button type="submit" disabled={pending}>
          {pending ? copy.submitting : copy.cta}
        </Button>
      </form>
    </div>
  );
}
