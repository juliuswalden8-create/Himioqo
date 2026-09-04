"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField, NativeCheckbox, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { createInvitationAction, revokeInvitationAction } from "@/lib/access-actions";
import type { Invitation, Property, StaffRole } from "@/lib/types";

const INVITE_ROLES: StaffRole[] = ["owner", "cleaner", "contractor"];

export function InvitePanel({
  dict,
  properties,
  invitations,
}: {
  dict: Dictionary;
  properties: Pick<Property, "id" | "name">[];
  invitations: Invitation[];
}) {
  const [state, action, pending] = useActionState(createInvitationAction, null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <FormField label={dict.settings.inviteEmail} htmlFor="invite-email" required>
          <Input id="invite-email" name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField label={dict.settings.invitePhone} htmlFor="invite-phone">
          <Input id="invite-phone" name="phone" type="tel" autoComplete="tel" />
        </FormField>
        <FormField label={dict.settings.inviteRole} htmlFor="invite-role" required>
          <NativeSelect id="invite-role" name="role" required defaultValue="owner">
            {INVITE_ROLES.map((role) => (
              <option key={role} value={role}>
                {dict.access.roles[role]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <fieldset className="space-y-2">
          <legend className="text-[15px] font-medium text-ocean">{dict.settings.inviteProperties}</legend>
          <div className="grid gap-2 rounded-xl border border-border p-3">
            {properties.map((property) => (
              <label key={property.id} className="flex min-h-11 items-center gap-3 text-sm text-navy-800">
                <NativeCheckbox name="propertyIds" value={property.id} />
                {property.name}
              </label>
            ))}
          </div>
        </fieldset>
        {state?.error ? (
          <FormError>
            {dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic}
          </FormError>
        ) : null}
        {state?.inviteUrl ? (
          <div className="space-y-2 rounded-xl bg-canvas px-3 py-3">
            <p className="text-sm text-green-700">
              {state.channel === "sms" && state.smsDelivered === false
                ? dict.settings.inviteCopied
                : dict.settings.inviteSent}
            </p>
            <p className="overflow-x-auto font-mono text-xs text-navy-700">{state.inviteUrl}</p>
            <button
              type="button"
              className="text-sm font-medium text-navy-700 underline"
              onClick={async () => {
                await navigator.clipboard.writeText(state.inviteUrl ?? "");
                setCopied(true);
              }}
            >
              {copied ? dict.cleaning.copied : dict.settings.copyInvite}
            </button>
          </div>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? dict.settings.inviteSending : dict.settings.inviteSubmit}
        </Button>
      </form>

      <ul className="space-y-3">
        {invitations.length === 0 ? (
          <li className="text-sm text-muted-foreground">{dict.settings.inviteEmpty}</li>
        ) : (
          invitations.map((invite) => {
            const status = invite.acceptedAt
              ? dict.settings.inviteAccepted
              : invite.revokedAt
                ? dict.settings.inviteRevoked
                : dict.settings.invitePending;
            return (
              <li key={invite.id} className="rounded-xl border border-border px-3 py-3">
                <p className="text-sm font-medium text-navy-800">{invite.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dict.access.roles[invite.role]} · {status}
                </p>
                {!invite.acceptedAt && !invite.revokedAt ? (
                  <form action={revokeInvitationAction} className="mt-2">
                    <input type="hidden" name="invitationId" value={invite.id} />
                    <button type="submit" className="min-h-11 text-sm font-medium text-navy-700 underline">
                      {dict.settings.inviteRevoke}
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
