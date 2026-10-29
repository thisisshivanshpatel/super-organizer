# Super-Organizer

A desktop app (Electron + React + MUI + Tailwind) for tracking savings goals, debts and money lent.

## Features

- Three kinds of entries, each with create, edit and delete:
  - **Savings**: a goal amount you save towards (add money / withdraw)
  - **Debt**: money you owe a person or a lender (pay back / borrow more)
  - **Lent**: money someone owes you (received / lend more)
- Debts and money lent record who it's with and an optional due date, and are flagged when overdue
- Every change is recorded in a per-entry transaction history, with optional notes
- Overview of the total saved, how much you owe and how much you're owed
- All data is stored locally in SQLite

## Getting started

```bash
npm install
npm start
```

## Data storage

Data lives in a SQLite database at `<userData>/super-organizer.db`. On macOS that is
`~/Library/Application Support/super-organizer/super-organizer.db`.

The app uses Node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module that ships with Electron,
so no native module needs to be rebuilt.

## Architecture

| Layer            | File                    | Responsibility                                              |
| ---------------- | ----------------------- | ----------------------------------------------------------- |
| Database         | `src/database/db.ts`    | Schema setup and migrations, validation, CRUD and transactions |
| Main process     | `src/main.ts`           | Registers the `targets:*` IPC handlers                       |
| Preload          | `src/preload.ts`        | Exposes `window.electronAPI.targets` to the renderer         |
| Renderer         | `src/Bundler.tsx`       | Loads goals and manages the create/edit/delete/add-money dialogs |
| Components       | `src/component/`        | Goal card, form dialog, add-money dialog, menu, confirm dialog |


## Building

- For Mac

```bash
npm run make                                              # DMG + zip for your Mac (Apple Silicon)
npm run make -- --targets @electron-forge/maker-dmg       # DMG only
npm run make -- --arch=x64                                # for Intel Macs
npm run make -- --arch=universal                          # one DMG for both

```

- windows

```bash
git clone <your-repo-url>
cd super-organizer
npm ci
npm run make
```

- The installer appears in out\make\squirrel.windows\x64\: a … Setup.exe, plus a .nupkg and a RELEASES file. You only need those two if you add auto-updates later. Share the Setup.exe.
For Windows on ARM devices, run npm run make -- --arch=arm64.