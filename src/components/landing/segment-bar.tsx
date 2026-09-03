import Link from "next/link";
import type { Dictionary } from "@/i18n/messages";
import type { AccountType } from "@/lib/types";

export const SEGMENT_PARAM = "segment";

/** The landing page defaults to rental companies, Homioqo's primary audience. */
export function resolveSegment(value?: string): AccountType {
  return value === "private" ? "private" : "company";
}

export function segmentHref(segment: AccountType) {
  return segment === "private" ? `/?${SEGMENT_PARAM}=private` : "/";
}

/**
 * Audience switcher above the header, matching the utility bar pattern:
 * a dark strip with two text links and an underline on the active one.
 * Rendered as links so a segment can be bookmarked and works without JS.
 */
export function SegmentBar({ dict, active }: { dict: Dictionary; active: AccountType }) {
  const segments: AccountType[] = ["private", "company"];

  return (
    <div className="bg-navy-800">
      <nav
        aria-label={dict.segments.label}
        className="container-page flex justify-end gap-4 sm:gap-6"
      >
        {segments.map((segment) => {
          const isActive = segment === active;
          return (
            <Link
              key={segment}
              href={segmentHref(segment)}
              aria-current={isActive ? "page" : undefined}
              className={`border-b-2 py-2.5 text-sm transition ${
                isActive
                  ? "border-white font-semibold text-white"
                  : "border-transparent font-medium text-white/75 hover:text-white"
              }`}
            >
              {dict.segments[segment].tab}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
