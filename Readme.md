# Super-Organizer

A desktop app (Electron + React + MUI + Tailwind) for tracking savings goals.

## Features

- Create, edit and delete savings goals (title, target amount, amount already saved)
- Add or withdraw money from a goal, with quick-amount shortcuts
- Overview of the total saved, the total target and how many goals are complete
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
| Database         | `src/database/db.ts`    | Schema setup, validation and CRUD queries                    |
| Main process     | `src/main.ts`           | Registers the `targets:*` IPC handlers                       |
| Preload          | `src/preload.ts`        | Exposes `window.electronAPI.targets` to the renderer         |
| Renderer         | `src/Bundler.tsx`       | Loads goals and manages the create/edit/delete/add-money dialogs |
| Components       | `src/component/`        | Goal card, form dialog, add-money dialog, menu, confirm dialog |
