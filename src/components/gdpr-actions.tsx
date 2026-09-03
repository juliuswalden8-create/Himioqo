"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteAccountAction, exportDataAction } from "@/lib/signup-actions";
import type { Dictionary } from "@/i18n/messages";

export function GdprActions({ dict }: { dict: Dictionary }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const data = await exportDataAction();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "homioqo-export.json";
            a.click();
            URL.revokeObjectURL(url);
          });
        }}
      >
        {dict.settings.export}
      </Button>
      <form
        action={deleteAccountAction}
        onSubmit={(event) => {
          if (!window.confirm(dict.settings.deleteConfirm)) event.preventDefault();
        }}
      >
        <Button type="submit" variant="destructive">
          {dict.settings.delete}
        </Button>
      </form>
    </div>
  );
}
