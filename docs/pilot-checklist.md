# Pilot checklist

Practical steps for taking one pilot customer from first conversation to running
Homioqo on their own properties.

Read `docs/production-readiness.md` first. The most important constraint is that
data does not currently survive a restart, so a pilot with real operational
dependency requires the database work to be done first.

## Before contacting the customer

- [ ] `SESSION_SECRET` is set in the deployment environment from a secret manager
- [ ] A persistent database is connected, or the customer explicitly understands
      that data is not durable yet
- [ ] Backups are configured and a restore has actually been tested
- [ ] Error tracking and uptime monitoring are running
- [ ] Terms and privacy pages have been reviewed
- [ ] It is clear in writing which features are live and which are planned

## Setting up the organisation

- [ ] Create the organisation with its real name, support email, support phone
      and emergency number
- [ ] Create the manager account and verify sign-in
- [ ] Set the organisation's default language
- [ ] Confirm the manager can reset their own password

## Properties

- [ ] Add each property with name, address, city and type
- [ ] Add owner name and email per property
- [ ] Add internal notes where useful, and confirm with the manager that these
      are never visible to guests or owners
- [ ] Confirm the property list, search and filters behave with their real data

## Guest guides

For each property:

- [ ] Wi-Fi name and password
- [ ] Check-in and check-out instructions
- [ ] House rules
- [ ] Parking
- [ ] Waste and recycling
- [ ] AC and appliance instructions
- [ ] Pool information, where relevant
- [ ] Emergency information and manager contact details
- [ ] Guide content entered in every language the property's guests use
- [ ] At least eight local recommendations across the relevant categories
- [ ] Any sponsored recommendation is marked as sponsored
- [ ] Open the guide on a real phone and read it end to end

## QR codes

- [ ] Generate the QR code for each property
- [ ] Download the PNG and print at the size that will actually be used
- [ ] Scan each printed code with both an iPhone and an Android phone
- [ ] Confirm the guide opens without login and in a sensible language
- [ ] Explain to the manager that rotating a token invalidates printed codes

## People

- [ ] Add contractors with trade, email and phone
- [ ] Add cleaners
- [ ] Walk one contractor through their secure link on their own phone
- [ ] Walk one cleaner through the checklist on their own phone
- [ ] Confirm both understand that the link is personal to that task and should
      not be forwarded
- [ ] Show the manager how to rotate or revoke a link

## Owners

- [ ] Create an owner access link for one property
- [ ] Open it and confirm no internal notes, no guest details and no other
      property are visible
- [ ] Show the manager how to deactivate and rotate the link

## End-to-end rehearsal

Run one full cycle on a real property before go-live:

- [ ] Scan the QR code as a guest and submit a problem report with photos
- [ ] Confirm it appears on the dashboard with the right category and urgency,
      and raises a notification
- [ ] Triage it, set a priority and assign a contractor
- [ ] Accept the task through the contractor link and upload before/after photos
- [ ] Mark it complete and approve it as the manager
- [ ] Create a cleaning task and complete the checklist through the cleaner link
- [ ] Report damage as the cleaner and convert it into a maintenance issue
- [ ] Approve the cleaning and confirm the property shows ready for the next
      guest
- [ ] Confirm the owner link reflects the approved work

## Handover to the customer

- [ ] 30-minute walkthrough of the dashboard, issues, cleaning and properties
- [ ] Show how to add a property and generate its QR code
- [ ] Show how to share and revoke contractor, cleaner and owner links
- [ ] Agree how the manager reports problems to you during the pilot
- [ ] Agree a check-in cadence, weekly is a reasonable default
- [ ] Confirm in writing what is free during the pilot and what happens after

## During the pilot

- [ ] Weekly check-in with the manager
- [ ] Log every issue and feature request with the property and role it affects
- [ ] Watch which guest-guide categories actually get opened
- [ ] Note where the manager falls back to phone or WhatsApp; that is the real
      product gap
- [ ] Review at 30 days: what to keep, what to change, and what pricing would be
      fair
