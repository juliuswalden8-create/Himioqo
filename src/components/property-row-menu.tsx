"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PropertyRowMenu({
  label,
  qrLabel,
  qrHref,
  guideLabel,
  guideHref,
  caseLabel,
  caseHref,
}: {
  label: string;
  qrLabel: string;
  qrHref: string;
  guideLabel: string;
  guideHref: string;
  caseLabel: string;
  caseHref: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-navy-700 hover:bg-canvas"
          aria-label={label}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={qrHref}>{qrLabel}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={guideHref}>{guideLabel}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={caseHref}>{caseLabel}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
