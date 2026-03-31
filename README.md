# Pilot Logbook Atelier

A polished browser-based pilot logbook styled after a traditional 32-column paper training logbook, with a fast entry workflow, printable ledger sheets, guest-mode storage, and Firebase-backed cloud sync.

Made by Uran Khatola.

Live site:
[https://pilot-logbook-by-uran.web.app](https://pilot-logbook-by-uran.web.app)

Repository:
[https://github.com/vasunagpal1/Pilot-Logbook](https://github.com/vasunagpal1/Pilot-Logbook)

## What This Project Does

Pilot Logbook Atelier lets a user:

- enter pilot logbook rows in a structured digital form
- view entries on a ledger styled like a real paper logbook
- edit, delete, split, and reorder entries
- keep entries locally on the same device without logging in
- sign in with Google and sync entries privately to Firebase
- import device data into cloud at any time
- download a JSON backup of current table data
- upload a JSON backup to restore the table
- calculate automatic totals and manual subtotals
- hide zero values and hide fully empty columns
- print the ledger in a landscape-friendly format

## Core Experience

The app is designed around two usage modes.

### 1. Guest Mode

Guest mode works immediately with no login.

In this mode:

- all entries are stored in the browser on that device
- the app continues to work after refresh or reopening the page
- the data stays tied to that browser profile unless you export it
- this is ideal for quick testing or first-time use

### 2. Cloud Mode

Cloud mode starts after Google sign-in.

In this mode:

- the user’s entries are stored in Cloud Firestore
- the same logbook can be accessed from multiple devices
- each user can read and write only their own entries
- guest/device data remains available separately on the device
- guest/device data can be imported into cloud whenever needed

This dual-mode setup keeps the app easy to try while still allowing proper cross-device sync later.

## Feature Overview

### Entry Management

- Add a new flight entry
- Edit an existing entry from the card list or the ledger row
- Delete a single entry
- Delete selected entries in bulk
- Delete all entries
- Split one entry into two consecutive entries in the same original position
- Reorder entries by drag-and-drop
- Reorder entries using move buttons

### Ledger Features

- 32-column paper-style logbook layout
- grouped headers matching a training logbook structure
- sticky top header while scrolling through the ledger
- horizontal scrolling for the sheet view
- print-specific landscape ledger pages
- automatic footer totals for numeric columns
- manual subtotal based on selected rows

### Table Visibility Controls

- Hide `0` / `0.0` values
- Hide columns with no meaningful value in any saved row

These help the user scan the ledger quickly without visual clutter.

### Selection and Summation

- default totals include all rows
- manual subtotal can be built from selected rows
- row selection can be made from the ledger itself
- selection state is saved and restored

### Backup and Restore

- Download the current table as a JSON backup
- Upload a backup file to replace the current active table
- imported backups restore:
  - entries
  - sum selection
  - display preferences

### Firebase and User Sync

- Google sign-in
- private Firestore storage per user
- user profile record saved at `users/{uid}`
- entries saved under `users/{uid}/entries/{entryId}`
- secure Firestore rules

## Tech Stack

- HTML
- CSS
- vanilla JavaScript
- Firebase Hosting
- Firebase Authentication
- Cloud Firestore

There is no custom backend server for this project.

## Project Structure

- `index.html`
  Main application markup and UI structure

- `styles.css`
  Full visual design, responsive behavior, print styling, and ledger layout

- `script.js`
  Main application logic for form handling, ledger rendering, entry actions, totals, guest/cloud mode, import/export, and UI state

- `firebase-client.js`
  Firebase integration layer for Auth and Firestore operations

- `firebase.json`
  Firebase Hosting and Firestore configuration

- `.firebaserc`
  Firebase project linkage for local CLI usage

- `firestore.rules`
  Firestore security rules

- `firestore.indexes.json`
  Firestore index configuration

- `404.html`
  Firebase Hosting fallback page

- `.gitignore`
  Ignores local generated artifacts such as `.firebase/` and test outputs

## Data Model

### Firestore

User profile:

- `users/{uid}`

Contains:

- `uid`
- `displayName`
- `email`
- `photoURL`
- `providerId`
- `lastSeenAt`

User entries:

- `users/{uid}/entries/{entryId}`

Each entry stores:

- all logbook form fields
- `id`
- `createdAt`
- `updatedAt`
- `sortOrder`

### Local Browser Storage

In guest mode, the app stores local state in `localStorage`.

This includes:

- entries
- manual subtotal row selection
- display preferences

## How the App Behaves in Different Environments

### On the Firebase-hosted website

The app supports:

- guest mode
- Google sign-in
- Firestore cloud sync
- local-device import into cloud
- backup export/import

### On a plain local static server

The app supports:

- guest mode
- backup export/import
- full entry workflow

Google sign-in and cloud sync are intended to work from the Firebase-hosted site because Firebase config is loaded there from Hosting runtime config.

## How To Run the Project Locally

### Option 1: Quick local static server

From the project folder:

```bash
python3 -m http.server 4326
```

Then open:

```text
http://127.0.0.1:4326
```

This is good for:

- UI work
- guest mode testing
- print testing
- backup import/export testing

### Option 2: Firebase Hosting local workflow

If you want the environment closer to the hosted site:

```bash
firebase serve
```

or

```bash
firebase emulators:start
```

depending on what you want to test.

This is more useful when checking Firebase-connected behavior.

## How To Use the App

## 1. Start in Guest Mode

Open the site and begin using the form.

In guest mode:

- no login is required
- entries are saved on that browser/device
- the top sync panel explains the current storage mode

## 2. Add a Flight Entry

Fill in:

- core details
- instrument and instruction fields
- aircraft time fields
- landings and remarks

Then click:

```text
Save entry
```

The row appears in:

- the saved entry stack
- the ledger below

## 3. Edit an Entry

You can edit an entry by:

- clicking `Edit` on the saved entry card
- clicking the corresponding ledger row in edit mode

Then click:

```text
Update entry
```

## 4. Split an Entry Into Two

When editing an existing row:

- click `Split into two`
- adjust both entry blocks
- save split entries

The original row will be replaced by two consecutive rows in the same location.

## 5. Delete Entries

Single delete:

- use `Delete` on a card
- or `Delete entry` inside the edit form

Bulk delete:

- select rows with checkboxes
- use `Delete selected`
- or `Delete all entries`

All destructive actions ask for confirmation first.

## 6. Reorder Entries

Use either:

- drag-and-drop in the saved entry stack
- `Move up`
- `Move down`

The ledger order follows the saved stack order.

## 7. Manual Sum Selection

The app supports:

- automatic totals across all rows
- manual subtotal based on selected rows

You can select rows for the subtotal by:

- clicking the manual sum toggle on cards
- switching the ledger into row selection mode and clicking rows directly

## 8. Visibility Controls

Use the ledger toolbar to:

- hide `0` / `0.0` values
- hide empty columns that have no real values in any saved row

## 9. Print the Sheet

Click:

```text
Print sheet
```

The app generates print-friendly landscape pages.

Recommended print settings:

- `Landscape`
- `A4` if applicable
- low or default margins depending on printer support

The print flow uses generated print pages rather than trying to print the live scrolling ledger directly.

## 10. Sign In With Google

Use:

```text
Sign in with Google
```

After sign-in:

- the app writes or updates a readable user profile document in Firestore
- the app loads the user’s cloud entries
- the top panel changes to cloud status

## 11. Import Device Data Into Cloud

While signed in:

- click `Import device data to cloud`

The app will:

- compare device entries with current cloud entries
- avoid duplicating matching rows
- append imported entries into the cloud logbook

This import remains available at any time.

## 12. Download a Backup

Click:

```text
Download backup
```

This creates a JSON file containing:

- current active entries
- selected subtotal rows
- display preferences
- export metadata

## 13. Upload a Backup

Click:

```text
Upload backup
```

Choose a JSON backup created by the app.

The app will replace the current active table with the imported data.

Behavior depends on mode:

- guest mode: replaces the device logbook
- cloud mode: replaces the current cloud logbook

## Firebase Setup Summary

This repository is already configured for:

- Firebase Hosting
- Firestore
- Google Authentication

Project:

- `pilot-logbook-by-uran`

Hosting URL:

- [https://pilot-logbook-by-uran.web.app](https://pilot-logbook-by-uran.web.app)

## Firestore Security Model

The current Firestore rules enforce:

- users can read only their own profile document
- users can create and update only their own profile document
- users can read only their own entries
- users can create, update, and delete only their own entries
- no public read/write access

This keeps beta user data private by default.

## How To Inspect User Data in Firebase Console

To inspect users and entries:

1. Open Firebase Console
2. Open `Firestore Database`
3. Go to `Data`
4. Open `users`
5. Click a user UID document
6. Read the profile fields:
   - display name
   - email
   - photo URL
   - provider
7. Open that document’s `entries` subcollection

This makes it much easier to tell whose data is whose.

## Deployment

### Deploy Hosting

```bash
firebase deploy --only hosting
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Both

```bash
firebase deploy
```

## Local Development Notes

- the app is a static frontend
- there is no bundler
- there is no custom backend server
- files can be edited directly and refreshed in the browser

When using a plain local server:

- guest mode works
- cloud sign-in is intentionally not the main target
- the Firebase client falls back gracefully rather than breaking the app

## Feature Checklist

Current implemented features include:

- paper-style 32-column ledger
- compact entry form
- local guest persistence
- Google sign-in
- Firebase cloud sync
- readable Firestore user profiles
- add/edit/delete workflow
- split entry workflow
- drag reorder
- move buttons
- bulk delete
- delete from edit form
- automatic totals
- manual subtotal row selection
- selection from ledger rows
- sticky ledger header
- hide zero values
- hide empty columns
- print-friendly landscape pages
- JSON backup export
- JSON backup import

## Troubleshooting

### Google sign-in does not open locally

Use the Firebase-hosted site for sign-in and sync:

[https://pilot-logbook-by-uran.web.app](https://pilot-logbook-by-uran.web.app)

Plain local servers are primarily for guest-mode development and UI testing.

### Entries disappeared after changing browser or device

In guest mode, entries are tied to the browser/device.

Use either:

- Google sign-in for cloud sync
- `Download backup` to keep your own JSON copy

### Import says no new device entries are available

That usually means the current cloud logbook already contains matching rows from this device.

### The print view looks different from the on-screen ledger

This is expected.

The app uses a separate print-optimized layout to fit the ledger better on landscape paper.

### GitHub secret warning appeared

The current code no longer hardcodes Firebase config in tracked source. The app now loads Firebase config at runtime from Firebase Hosting.

## Future Expansion Ideas

The current architecture leaves room for:

- richer aircraft database
- endorsements and instructor records
- custom dashboards
- PDF export improvements
- team/admin tools
- premium features
- payment integration later
- deeper analytics

## License / Ownership

Project built and maintained as Pilot Logbook Atelier by Uran Khatola.
