import { contextBridge, ipcRenderer } from "electron";
import type { targetInput, targetsAPI } from "./types";

const targets: targetsAPI = {
  list: () => ipcRenderer.invoke("targets:list"),
  create: (input: targetInput) => ipcRenderer.invoke("targets:create", input),
  update: (id: number, input: targetInput) =>
    ipcRenderer.invoke("targets:update", id, input),
  addAmount: (id: number, amount: number) =>
    ipcRenderer.invoke("targets:add-amount", id, amount),
  remove: (id: number) => ipcRenderer.invoke("targets:delete", id),
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Target CRUD operations (SQLite)
  targets,

  // Platform info
  platform: process.platform,
});
