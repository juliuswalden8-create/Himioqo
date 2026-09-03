import {
  AlertCircle,
  Compass,
  Home,
  Sparkles,
  Wifi,
} from "lucide-react";
import { PhoneFrame } from "@/components/landing/phone-frame";
import type { Dictionary } from "@/i18n/messages";

export function GuestGuidePhone({
  dict,
  label,
  size = "sm",
}: {
  dict: Dictionary;
  label: string;
  size?: "sm" | "md";
}) {
  const p = dict.marketing.phone;
  const items = [
    { icon: Wifi, label: p.wifi },
    { icon: Home, label: p.checkin },
    { icon: Sparkles, label: p.house },
    { icon: AlertCircle, label: p.report },
    { icon: Compass, label: p.area },
  ];

  return (
    <PhoneFrame label={label} size={size} className="shadow-lift">
      <div className="flex h-full flex-col px-4 pb-4 pt-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-navy-400">
          Homioqo
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-ocean">{p.welcome}</p>
        <p className="mt-1 text-xs text-navy-500">{p.villa}</p>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-soft"
            >
              <item.icon className="h-4 w-4 text-ocean" strokeWidth={1.7} aria-hidden />
              <span className="text-xs font-medium text-ocean">{item.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto rounded-2xl bg-terracotta px-3 py-2.5 text-center text-xs font-medium text-white">
          {p.help}
        </div>
      </div>
    </PhoneFrame>
  );
}
