"use client";

import { NativeSelect } from "@/components/ui/field";
import type { Dictionary } from "@/i18n/messages";
import { switchMembershipAction } from "@/lib/access-actions";

export function RoleSwitcher({
  dict,
  currentId,
  options,
}: {
  dict: Dictionary;
  currentId: string;
  options: { id: string; label: string }[];
}) {
  return (
    <form action={switchMembershipAction} className="min-w-0">
      <label className="sr-only" htmlFor="membershipId">
        {dict.access.switch}
      </label>
      <NativeSelect
        id="membershipId"
        name="membershipId"
        defaultValue={currentId}
        className="max-w-[180px] sm:max-w-xs"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </form>
  );
}
