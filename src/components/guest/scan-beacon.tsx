"use client";

import { useEffect } from "react";
import { recordScanAction } from "@/lib/guide-actions";

export function ScanBeacon({ token }: { token: string }) {
  useEffect(() => {
    void recordScanAction(token);
  }, [token]);
  return null;
}
