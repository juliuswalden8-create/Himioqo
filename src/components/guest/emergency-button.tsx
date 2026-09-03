"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/messages";
import { EMERGENCY_PHONE } from "@/lib/constants";

export function EmergencyButton({
  dict,
  managerPhone,
  emergencyText,
}: {
  dict: Dictionary;
  managerPhone?: string;
  emergencyText?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-navy-700"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-status-urgent" />
          {dict.guide.emergency}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.guide.emergencyTitle}</DialogTitle>
          <DialogDescription>{dict.guide.emergency112}</DialogDescription>
        </DialogHeader>
        {emergencyText ? (
          <p className="text-sm leading-relaxed text-navy-800">{emergencyText}</p>
        ) : null}
        <div className="grid gap-2">
          <Button asChild className="h-12">
            <a href={`tel:${EMERGENCY_PHONE}`}>
              <Phone className="h-4 w-4" />
              {EMERGENCY_PHONE}
            </a>
          </Button>
          {managerPhone ? (
            <Button asChild variant="secondary" className="h-12">
              <a href={`tel:${managerPhone.replace(/\s/g, "")}`}>
                {dict.guide.contact} · {managerPhone}
              </a>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
