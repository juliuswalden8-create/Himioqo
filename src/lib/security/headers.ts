/**
 * Security headers for every HTML response.
 * CSP allows 'unsafe-inline' for scripts and styles because Next.js 15
 * App Router injects inline bootstraps. Production must not use unsafe-eval
 * or a wildcard script-src. Dev needs unsafe-eval for Fast Refresh.
 */
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : "",
  "https://www.googletagmanager.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
]
  .filter(Boolean)
  .join(" ");

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://www.google-analytics.com",
      "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "DENY" },
];
