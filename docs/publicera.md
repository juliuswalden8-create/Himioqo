# Publicera Homioqo

Sajten är redan ute på internet. Den publika adressen är:

**https://homioqo.vercel.app**

Varje gång du pushar till `main` på GitHub bygger Vercel om och uppdaterar den adressen automatiskt. Du behöver inte klicka Deploy för vanliga ändringar.

Det här dokumentet är checklistan för att göra den synlig för allmänheten: egen domän, Google och de miljövariabler som produktionen behöver.

## 1. Kontrollera att produktionssajten svarar

1. Öppna [https://homioqo.vercel.app](https://homioqo.vercel.app) i ett privat fönster.
2. Startsida, Logga in och Kom igång ska ladda.
3. Demokonto: `anna@homioqo.se` / `demo1234`.

Om sidan är vit eller visar ett client-fel: gör en hård omladdning (**Cmd + Shift + R**). Safari kan hålla kvar gamla JavaScript-filer efter en deploy.

## 2. Sätt miljövariabler i Vercel

I [Vercel](https://vercel.com) → projektet **himioqo** → **Settings** → **Environment Variables**. Lägg minst dessa på **Production**:

| Variabel | Varför |
| --- | --- |
| `SESSION_SECRET` | Obligatorisk. Skapa med `openssl rand -base64 32` i Terminal. Utan den kan inloggning krascha. |
| `NEXT_PUBLIC_APP_URL` | `https://homioqo.vercel.app` tills du har en egen domän. QR-koder och delningslänkar använder den. |

Valfritt, när du är redo att skicka riktiga mejl:

| Variabel | Varför |
| --- | --- |
| `RESEND_API_KEY` | Skickar verifierings- och inbjudningsmejl. |
| `RESEND_FROM` | Till exempel `Homioqo <hej@dindoman.se>` efter att du verifierat avsändardomänen hos Resend. |

Efter att du sparat `NEXT_PUBLIC_*`-variabler: **Deployments** → tre prickar på senaste produktion → **Redeploy**. Annars syns inte de publika värdena.

## 3. Egen domän (homioqo.com, homioqo.se eller liknande)

`homioqo.com` och `homioqo.se` är inte kopplade ännu (ingen DNS). Canonical och sitemap följer `NEXT_PUBLIC_APP_URL` automatiskt när du sätter den.

1. Köp domänen hos Loopia, one.com, Namecheap eller liknande.
2. I Vercel → **Settings** → **Domains** → **Add** → skriv `homioqo.com` (och `www.homioqo.com` om du vill).
3. Vercel visar vilka DNS-poster du ska lägga in hos registrar:
   - Apex: A-pekare mot Vercels IP, **eller** byt nameservers till Vercel.
   - `www`: CNAME mot `cname.vercel-dns.com`.
4. Vänta tills DNS är grönt (ofta 5–60 minuter).
5. Uppdatera `NEXT_PUBLIC_APP_URL` till `https://homioqo.com` och gör **Redeploy**.
6. I Search Console: lägg till den nya URL-egendomen, skicka sitemap igen och begär indexering.

## 4. Göra sajten sökbar på Google

HTML-verifieringsfilen ligger redan live:

https://homioqo.vercel.app/google456fbda9b9b435e4.html

### Search Console (gör detta en gång)

1. Öppna [Google Search Console](https://search.google.com/search-console).
2. Egendom: URL-prefix `https://homioqo.vercel.app` (byt till din egen domän när den är kopplad).
3. Verifiera med **HTML-fil** (redan uppladdad). Ta inte bort filen.
4. **Sitemaps** → skicka `https://homioqo.vercel.app/sitemap.xml`.
5. **URL-granskning** → `https://homioqo.vercel.app` → **Begär indexering**.

Google kan ta från några timmar upp till några dagar. Testa med `site:homioqo.vercel.app` i Google.

### Om Google ber om en metatagg i stället

Klistra in hela taggen i chatten, till exempel:

`<meta name="google-site-verification" content="KODEN_HÄR" />`

Den ska in i `<head>` och får inte tas bort efteråt. Säg till så läggs den in och pushas.

### Om Google ber om Analytics (gtag)

Koden finns redan i sidhuvudet, men den laddas bara om mätnings-ID:t är satt.

1. Google Analytics → Admin → Dataströmmar → kopiera `G-XXXXXXXX`.
2. Vercel → Environment Variables → `NEXT_PUBLIC_GA_MEASUREMENT_ID` = det ID:t.
3. **Redeploy**.

## 5. Vad du kan dela redan nu

| Mottagare | Länk |
| --- | --- |
| Allmänheten / Google | https://homioqo.vercel.app |
| Förvaltare (demo) | https://homioqo.vercel.app/login |
| Gästguide utan konto | https://homioqo.vercel.app/g/qr_strand14 |

## 6. Viktigt innan riktiga kunder

Data ligger fortfarande i serverns minne. En ny deploy eller en kall server kan nollställa bostäder, ärenden och inbjudningar. Det räcker för att visa produkten och samla intresse. För skarp drift behövs databasen (Supabase-schemat finns, men appen är inte kopplad ännu).

Bilder, mejl och SMS är också begränsade tills Resend/Twilio och lagring är inkopplade. Läs `docs/production-readiness.md` innan en pilot med skarp data.

## Snabbcheck

- [ ] https://homioqo.vercel.app öppnas i inkognito
- [ ] `SESSION_SECRET` och `NEXT_PUBLIC_APP_URL` finns i Vercel Production
- [ ] Search Console är verifierad och sitemap är inskickad
- [ ] Indexering är begärd för startsidan
- [ ] (Valfritt) egen domän kopplad och `NEXT_PUBLIC_APP_URL` uppdaterad
- [ ] (Valfritt) `G-` mätnings-ID i Vercel om Google kräver Analytics
