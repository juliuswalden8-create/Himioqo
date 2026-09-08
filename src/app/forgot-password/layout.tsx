import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.forgot.title);
}

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
