# Data model

All types live in `src/lib/types.ts`. The in-memory store and every read/write
helper live in `src/lib/data/store.ts`. Seed data lives in
`src/lib/data/seed.ts`.

Every entity extends `BaseRecord`:

```ts
interface BaseRecord {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```

## Ownership rule

Every record that belongs to a company carries an `organizationId`. Store
functions that read organisation data take the `organizationId` from the
verified session, never from a URL or form field. There is no code path that
lets one organisation read another's records; a regression test in
`tests/workflows.test.ts` asserts this.

Token-addressed records (guest guide, contractor task, cleaner task, owner view)
are resolved by looking the token up first and then reading only the single
record it points at.

## Core entities

| Entity | Key fields | Notes |
| --- | --- | --- |
| `Organization` | `name`, `supportEmail`, `supportPhone`, `emergencyPhone`, `plan`, `qrAllowance` | The tenant boundary |
| `Profile` | `organizationId`, `fullName`, `email`, `locale`, `passwordHash` | A manager user. Membership is expressed by `organizationId` |
| `Property` | `organizationId`, `name`, `address`, `city`, `type`, `health`, `publicToken`, `ownerName`, `ownerEmail`, `internalNotes` | `publicToken` backs the QR link. `internalNotes` is never sent to guest or owner views |
| `Contractor` | `organizationId`, `name`, `trade`, `email`, `phone` | Assigned to cases |
| `Cleaner` | `organizationId`, `name`, `email`, `phone` | Assigned to cleaning jobs |

## Issues

| Entity | Key fields | Notes |
| --- | --- | --- |
| `MaintenanceCase` | `organizationId`, `propertyId`, `reference`, `category`, `status`, `priority`, `contractorId`, `workToken`, `workOrder`, `contractorAcceptedAt` | `reference` is the human-facing case number (`HQ-2026-0188`) |
| `CaseNote` | `caseId`, `body`, `authorId` | Internal only. Never leaves the manager UI |
| `CaseMessage` | `caseId`, `author`, `body` | Conversation between manager, contractor and guest |
| `Attachment` | `caseId`, `url`, `kind` | Guest photos and contractor before/after photos |
| `ActivityLog` | `organizationId`, `type`, `caseId`, `propertyId`, `label` | Timeline entries |

`CaseStatus` (`src/lib/types.ts`):
`new`, `reviewing`, `assigned`, `accepted`, `progress`, `waiting`, `done`,
`approved`, `cancelled`.

`CasePriority`: `low`, `normal`, `soon` (high), `urgent`.

`GUEST_PRIORITIES` deliberately excludes `normal` so guests choose between low,
high and urgent only. `OPEN_STATUSES`, `CLOSED_STATUSES` and
`CONTRACTOR_STATUSES` are derived sets used by dashboard statistics and the
contractor portal.

`CaseCategory`: water, electricity, AC, appliance, internet, keys, furniture,
cleaning, pool or garden, other.

## Cleaning

| Entity | Key fields | Notes |
| --- | --- | --- |
| `CleaningJob` | `organizationId`, `propertyId`, `cleanerId`, `status`, `scheduledFor`, `instructions`, `token`, `checklist` | `token` backs the secure cleaner link |
| `CleaningChecklistItem` | `label`, `done`, `doneAt` | Ten default items, editable per job |
| `CleaningPhoto` | `jobId`, `url`, `kind` | Before and after documentation |
| `CleaningIssue` | `jobId`, `kind`, `note`, `photos` | Damage or missing items reported by the cleaner. Can be converted into a `MaintenanceCase` without re-entering the details |
| `CleaningSchedule` | `propertyId`, `cadence` | Recurring cleaning |

`CleaningStatus`: `scheduled`, `assigned`, `accepted`, `progress`,
`awaitingInspection`, `done`, `approved`, `ready`.

`ready` is what surfaces as "Property ready for the next guest".

## Guest guide

| Entity | Key fields | Notes |
| --- | --- | --- |
| `PropertyGuide` | `propertyId`, `welcome`, `wifiName`, `wifiPassword`, `checkIn`, `checkOut`, `houseRules`, `parking`, `waste`, `acInstructions`, `appliances`, `pool`, `emergency`, `contacts` | Free-text fields are `LocalizedText` |
| `Place` | `organizationId`, `name`, `category`, `description`, `image`, `phone`, `whatsapp`, `website`, `bookingUrl`, `coordinates`, `monetization` | A local recommendation, reusable across properties |
| `PropertyPlace` | `propertyId`, `placeId`, `order`, `active`, `distance` | Join row that also carries per-property ordering and activation, which is what makes copying recommendations between properties possible |
| `PlaceMonetization` | `kind`, `discountCode`, `sponsored` | Sponsored entries are visibly marked in the guest UI |
| `GuideEvent` | `propertyId`, `kind`, `placeId` | Anonymous QR opens and recommendation clicks. No personal data |

`PlaceCategory` covers restaurants, cafés, food shops, taxi and transport, boat
and jet-ski rental, car rental, beaches, golf, activities, shopping, nightlife,
pharmacy and healthcare, children's activities, food delivery, and gyms.

`LocalizedText` is a per-locale map, so guide content can differ by language
rather than being machine-translated at render time.

## Access tokens

There is no single token table. Each token lives on the record it unlocks, which
keeps the blast radius of a leaked link to exactly one resource.

| Token | Lives on | Prefix | Unlocks |
| --- | --- | --- | --- |
| QR access | `Property.publicToken` | `pc_` | The public guest guide and report form for one property |
| Secure task | `MaintenanceCase.workToken` | `wk_` | One contractor task |
| Cleaning task | `CleaningJob.token` | `cl_` | One cleaning job |
| Owner access | `OwnerAccess.token` | `ow_` | Read-only view of one property |

All are 18 random bytes from `crypto.getRandomValues`, rotatable and revocable.

`OwnerAccess` additionally carries `propertyId`, `ownerName`, `ownerEmail` and
`active`, so an owner link can be disabled without deleting the record.

## Notifications and activity

| Entity | Key fields |
| --- | --- |
| `Notification` | `organizationId`, `kind`, `title`, `body`, `caseId`, `propertyId`, `readAt` |
| `ActivityLog` | `organizationId`, `type`, `label`, `caseId`, `propertyId` |

`NotificationKind` covers: new guest issue, urgent issue, contractor accepted,
contractor completed, cleaning started, cleaning completed, damage reported,
property ready, and manager approved or reopened work.

Notifications are for the manager inbox. Activity events are the per-property
and per-case timeline. They are deliberately separate: an activity entry is part
of the record's history, a notification is a transient alert with a read state.

## Pilot

`PilotLead` stores public pilot enquiries: `name`, `company`, `email`, `phone`,
`region`, `propertyCount`, `rentalType`, `currentMethod`, `mostValuable`,
`wantsPilot`, `consent`, `locale`. It has no `organizationId` because it is
submitted before an organisation exists.

## Persistence

The store is an in-memory object held on `globalThis` so it survives hot reload
but not a restart. `resetStore()` exists for tests.

`supabase/schema.sql` contains the SQL equivalent for a real database. It is not
currently the live data source; moving to it is the first item in
`docs/production-readiness.md`.
