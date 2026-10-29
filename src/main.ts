import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "node:path";
import started from "electron-squirrel-startup";
import {
  addToTarget,
  closeDb,
  createTarget,
  deleteTarget,
  listTargets,
  listTransactions,
  updateTarget,
} from "./database/db";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 420,
    minHeight: 500,
    backgroundColor: "#f5e9d8",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools in development only.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// IPC handlers for target CRUD operations (backed by SQLite)
ipcMain.handle("targets:list", () => listTargets());
ipcMain.handle("targets:create", (event, input) => createTarget(input));
ipcMain.handle("targets:update", (event, id, input) => updateTarget(id, input));
ipcMain.handle("targets:add-amount", (event, id, amount, note) =>
  addToTarget(id, amount, note),
);
ipcMain.handle("targets:transactions", (event, id) => listTransactions(id));
ipcMain.handle("targets:delete", (event, id) => deleteTarget(id));

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  closeDb();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
