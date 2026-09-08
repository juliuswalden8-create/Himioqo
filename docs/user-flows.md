# User flows

Routes are given as they appear in `src/app`.

## Manager

### Sign in

`/login` with a real verified account → `/app`. There is no demo login.

Unauthenticated requests to `/app/*` are redirected to `/login` by middleware,
and every page independently calls `requireSession()`.

### Dashboard — `/app`

Shows counts calculated from live data: properties, new issues, open issues,
resolved this month, urgent issues, cleaning tasks and properties ready for the
next guest. Below that: recent issues, cleaning jobs, and before/after
documentation.

Every row and card links through to its detail page.

### Issues — `/app/cases`

Filter by search text, status, priority, category and property. Filters are
GET parameters, so a filtered view can be bookmarked and shared.

### Issue detail — `/app/cases/[id]`

Case number, property, category, description, guest photos, priority, status,
assigned contractor, timeline, messages, internal notes and before/after photos.

The manager can change priority and status, assign a contractor, write work
instructions, add an internal note, copy or rotate the contractor link, review
uploaded work, approve completion and reopen a closed issue.

Internal notes are visible here only. They never reach guest, contractor or
owner views.

### Properties — `/app/properties`

Filter by search text, city and health. Add a property.

### Property detail — `/app/properties/[id]`

Overview, issues, cleaning history, guest guide, documents and photos, activity
history, owner access and QR code. The manager can edit details, add internal
notes and archive the property.

### QR code

On the property page: preview, download as PNG (`/api/qr/[token]`), copy the
guest link, and rotate the token. Rotating immediately invalidates the previous
QR code, so a printed code stops working — the UI warns about this before
confirming.

### Owner access

Create a read-only owner link with a name and email, deactivate it, or rotate
it. Rotation invalidates the previous link immediately.

### Notifications — `/app/notifications`

A unified feed of new guest issues, urgent issues, contractor accepted and
completed, cleaning started and completed, damage reported, property ready, and
manager approvals or reopenings. The header shows an unread count. Items can be
marked as read.

## Guest

### Guest guide — `/g/[token]`

Reached by scanning the property QR code. No app, no account, no login.

Home screen: property name, welcome message, language selector, property
information, explore the area, report a problem, contact the manager and
emergency information.

Property information covers Wi-Fi name and password, check-in and check-out,
house rules, parking, waste and recycling, AC and appliance instructions, pool
information, emergency numbers and manager contact details.

Local recommendations are grouped by category and can carry an image,
description, distance, opening hours, phone, WhatsApp link, website, directions
link, booking link and a discount code. Sponsored entries are visibly marked.
Directions use standard external map links, so no paid maps API is required.

The guest page never shows owner contact details, internal notes, private
maintenance history, contractor costs or any other property.

### Report a problem

1. Choose a category (water, electricity, AC, appliance, internet, keys,
   furniture, cleaning, pool or garden, other)
2. Write a description
3. Choose urgency (low, high, urgent — `normal` is manager-only)
4. Upload photos
5. Optionally leave contact details
6. Review and submit
7. Receive a confirmation with a case number

Validation, allowed file types, upload limits and per-IP rate limiting are all
enforced server-side. The issue immediately appears in the manager dashboard and
in the property timeline, and raises a notification.

## Contractor

### Task link — `/w/[token]`

The manager assigns a contractor and shares the secure link. No account needed.

The contractor sees only the assigned task and can accept or decline it, set the
status to in progress, add an update, upload before-and-after photos and mark
the work as completed.

The link is unguessable, scoped to one case, and can be rotated or revoked at
any time. It grants no access to any other case, property or organisation data.

## Cleaner

### Task link — `/c/[token]`

The cleaner accepts the task, starts it, reads the property instructions, ticks
off checklist items, uploads photos, reports missing items or damage, leaves a
comment and marks the cleaning as completed.

Default checklist: kitchen cleaned, bathroom cleaned, beds prepared, towels
replaced, floors cleaned, rubbish removed, consumables refilled, windows and
doors checked, keys returned, final photos uploaded.

If the cleaner reports damage, the manager can convert it into a maintenance
issue without re-entering any of the information.

When the manager approves the cleaning, the property shows **ready for the next
guest**.

## Owner

### Owner view — `/o/[token]`

Read-only and scoped to a single property: property status, approved issues,
work progress, cleaning status, before-and-after photos, completed work history
and recent activity.

The owner never sees internal staff notes, private guest information, security
tokens, information about any other property, or internal contractor discussion
that has not been approved for sharing.

The link is revocable and can be rotated.

## Prospective customer

### Landing page — `/`

Hero, three-step explanation, the problem, benefits, the free pilot programme,
FAQ and the pilot interest form. Available in Swedish, English and Spanish with
copy written natively for each rather than translated word for word.

### Pilot enquiry — `/#pilot`

Name, company, email, phone, area of operation, number of properties, type of
rentals, current management method, most valuable feature, interest in a 30-day
pilot, and consent to be contacted.

Validated server-side with Zod, rate limited per IP, protected by a honeypot
field, and shown a clear success state on completion. Submissions are stored in
the data layer. No email is sent, because no email provider is connected.
