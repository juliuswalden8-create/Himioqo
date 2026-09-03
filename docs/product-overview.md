# Product overview

## What Homioqo is

Homioqo is a multilingual property operations and guest-service platform for
property managers and rental companies. It replaces the scattered mix of phone
calls, text messages and WhatsApp threads that most small managers use to run
maintenance, cleaning and guest communication.

## The problem

A guest calls about a leak. The manager texts a contractor. The cleaner notices
damage and mentions it in passing. Nobody is certain who is doing what, and then
the owner calls to ask how it is going.

Three things go wrong repeatedly:

1. Guests do not know who to contact, so problems are reported late or not at
   all.
2. Contractors and cleaners have no account anywhere, so tasks live in private
   message threads with no history and no photos.
3. Owners have no visibility, so they phone the manager instead of checking for
   themselves.

## The approach

Every property gets a unique QR code. Guests scan it with a phone camera — no
app, no account. From there they reach the guest guide and the problem-reporting
form. A submitted report lands in the manager's dashboard with photos, category
and urgency already attached.

The manager triages the issue and assigns a contractor. The contractor receives
a secure link that unlocks exactly one task; they can accept it, change status,
upload before-and-after photos and send updates without ever creating an
account. Cleaners work the same way, against a checklist.

The owner gets a revocable read-only link showing approved work and cleaning
status for their property only.

## Who it is for

| Role | Needs | What Homioqo gives them |
| --- | --- | --- |
| Property manager | One place to see everything and assign work | Dashboard with live statistics, filtering, issue triage, contractor and cleaner assignment, property management, guest guides, QR codes, notifications |
| Guest or tenant | To get information and report a problem without friction | QR guest guide with Wi-Fi, check-in and check-out, house rules and local recommendations, plus a reporting form with photo upload |
| Contractor | To see only the job they were given | Secure mobile link: accept or decline, change status, upload before/after photos, send messages |
| Cleaner | A clear checklist and a way to flag problems | Secure mobile link: checklist, photo upload, report damage or missing items |
| Property owner | To follow work remotely without being in the way | Read-only link with status, approved work, before/after photos and cleaning progress for their property |

## Design principles

The interface should feel premium, calm and trustworthy, and be usable by people
who are not technical.

- White and warm off-white backgrounds, dark navy typography and primary
  buttons, soft grey borders
- Green only for completed and successful states
- Red only for urgent issues and errors
- Blue for informational and new states
- Generous spacing, rounded cards, consistent shadows, simple line icons
- No unnecessary gradients or animation

Guest, contractor and cleaner experiences are mobile-first. The management
dashboard works on desktop, tablet and mobile. Horizontal scrolling is never
acceptable.

## Languages

The interface is fully translated in Swedish, English and Spanish, with German,
French and Dutch derived from the same dictionaries. No visible text is
hard-coded in a component; everything comes from `src/i18n/messages.ts` through
translation keys, including statuses, priorities and validation messages.

Language can be selected manually and the choice is remembered in a cookie.

Automatic translation of free-text messages between guest, manager, contractor
and owner is prepared through an adapter interface but is not connected. When no
translation service is configured, the original message is shown and clearly
marked as untranslated. Homioqo never displays a fabricated translation.

## What is real today

Functional against the in-memory data layer: property management, QR codes and
the guest guide, guest problem reporting, the manager dashboard and issue
workflow, the cleaning workflow, the contractor portal, the owner portal,
in-app notifications, and the pilot enquiry form.

Not connected: a production database, outbound email, live translation, SMS and
WhatsApp. See the README and `docs/production-readiness.md` for detail.
