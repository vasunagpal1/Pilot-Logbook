# Pilot Logbook

A browser-based pilot logbook web app styled around a traditional 32-column paper logbook sheet.

It lets you:

- add flight entries
- edit existing entries
- delete one entry, selected entries, or all entries
- reorder saved entries
- include or exclude entries from manual sum calculations
- keep entries saved locally in the browser between sessions
- print the ledger in a landscape-friendly format

Made by Uran Khatola.

## Project Structure

- `index.html`  
  Main application layout and UI markup

- `styles.css`  
  Visual design, responsive layout, and print styling

- `script.js`  
  Application logic for entries, persistence, totals, edit/delete/reorder, and bulk actions

- `.gitignore`  
  Ignores generated test artifacts

## How It Works

This project is a static frontend app. There is no backend and no database server.

All saved data is stored in your browser using `localStorage`.

That means:

- entries stay available when you close and reopen the page in the same browser
- data is specific to the browser/profile/device you used
- clearing browser storage can remove saved entries
- there is no cloud sync by default

## Requirements

You only need a modern web browser.

Optional for local serving:

- Python 3, or
- any simple static file server

## Running the Project

### Option 1: Open Directly

You can open the app directly in a browser:

1. Go to the project folder.
2. Double-click `index.html`.
3. The app should open in your default browser.

This is the fastest way to use it.

### Option 2: Run a Local Server

Running a local server is recommended for more predictable browser behavior.

From the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If port `8000` is busy, use another one:

```bash
python3 -m http.server 4321
```

Then open:

```text
http://localhost:4321
```

## Using the App

### 1. Add a Flight Entry

Fill in the form sections:

- Core details
- Instrument and instruction
- Aircraft time

Then click:

```text
Save entry
```

The entry will appear in:

- the saved entry stack
- the logbook ledger below

### 2. Edit an Entry

You can edit an entry in two ways:

- click `Edit` on a saved entry card
- click the corresponding filled row in the logbook view

The form will load that entry. After changes, click:

```text
Update entry
```

### 3. Delete a Single Entry

Click:

```text
Delete
```

on any saved entry card.

You will be asked to confirm before the entry is removed.

### 4. Select Multiple Entries and Delete Together

Each saved entry card has a checkbox for bulk selection.

Available bulk actions:

- `Select all entries`
- `Clear selection`
- `Delete selected`
- `Delete all entries`

Bulk delete always asks for confirmation first.

### 5. Reorder Entries

Entries can be reordered using:

- drag and drop
- `Move up`
- `Move down`

The logbook rows follow the saved order.

### 6. Sum Controls

The app supports two sum modes:

- Automatic sum  
  Uses all saved entries by default

- Manual sum  
  Uses only entries that are marked with `Use in sum` / `Sum on`

This affects the subtotal rows shown in the ledger footer.

## Printing

The app includes print styling designed for landscape printing of the ledger.

### Recommended Print Steps

1. Open the app in a desktop browser.
2. Click:

```text
Print sheet
```

3. In the browser print dialog:
   - choose `Landscape`
   - use `A4` if that is your target paper size
   - keep margins small if your printer allows it
4. Print or save as PDF.

### Print Notes

- the main entry UI is hidden during print
- the ledger is compacted for paper output
- the logbook table is formatted to fit much better on landscape pages

## Data Persistence

The app stores data in browser `localStorage` under internal keys used by the app.

This includes:

- saved entries
- manual sum selections

Bulk delete and single delete update this storage immediately.

## Feature Summary

Current features include:

- traditional pilot logbook-style ledger
- structured entry form
- persistent browser storage
- edit/update workflow
- single delete
- bulk select and delete
- delete all entries
- reorder saved entries
- automatic totals
- manual subtotal selection
- print-optimized ledger output

## Development Notes

This is a plain HTML/CSS/JavaScript project with no build step.

You can edit the files directly:

- `index.html`
- `styles.css`
- `script.js`

After changes, refresh the browser.

## GitHub

Repository:

[https://github.com/vasunagpal1/Pilot-Logbook](https://github.com/vasunagpal1/Pilot-Logbook)

## Troubleshooting

### Entries are not showing after reopening

Check whether:

- you are using the same browser and browser profile
- browser storage was cleared
- you opened the same local copy of the project

### Delete is not working

Refresh the page once to ensure the latest JavaScript is loaded.

Then try one of:

- single-entry `Delete`
- checkbox + `Delete selected`
- `Delete all entries`

### Print does not fit correctly

Try:

- using desktop Chrome or Edge
- selecting `Landscape`
- saving as PDF first
- checking paper size and scale settings in the print dialog

## License

No license file has been added yet. Add one if you want to define reuse terms explicitly.
