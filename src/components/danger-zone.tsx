"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeCheckbox } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { interpolate } from "@/i18n/interpolate";
import type { Dictionary } from "@/i18n/messages";
import { deleteAccountAction } from "@/lib/signup-actions";

export function DangerZone({ dict }: { dict: Dictionary }) {
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const word = dict.settings.deleteWord;
  const ready = checked && typed.trim().toUpperCase() === word.toUpperCase();

  return (
    <form
      action={deleteAccountAction}
      onSubmit={(event) => {
        if (!ready) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(dict.settings.deleteConfirm)) event.preventDefault();
      }}
      className="space-y-4"
    >
      <label className="flex items-start gap-3 text-sm text-navy-800">
        <NativeCheckbox
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-0.5"
        />
        <span>{dict.settings.deleteCheck}</span>
      </label>
      <div>
        <p className="mb-1.5 text-sm text-muted-foreground">
          {interpolate(dict.settings.deleteType, { word })}
        </p>
        <Input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className="h-11 max-w-xs"
          aria-label={word}
        />
      </div>
      <Button type="submit" variant="destructive" disabled={!ready}>
        {dict.settings.delete}
      </Button>
    </form>
  );
}
