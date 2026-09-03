"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import { exportDataAction } from "@/lib/signup-actions";

export function ExportDataButton({ dict }: { dict: Dictionary }) {
  const [pending, start] = useTransition();

  return (
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
  );
}
