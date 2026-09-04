const GA_MEASUREMENT_ID_PATTERN = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/i;

export function googleAnalyticsId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || !GA_MEASUREMENT_ID_PATTERN.test(id)) return undefined;
  return id;
}

/** Official gtag.js snippet in `<head>` for Google site-ownership checks. */
export function GoogleAnalytics() {
  const id = googleAnalyticsId();
  if (!id) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`,
        }}
      />
    </>
  );
}
