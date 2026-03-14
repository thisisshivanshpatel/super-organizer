import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File system operations
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("write-file", filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke("read-dir", dirPath),
  exists: (filePath: string) => ipcRenderer.invoke("file-exists", filePath),

  // Dialog operations
  openFile: () => ipcRenderer.invoke("open-file-dialog"),
  saveFile: (content: string) =>
    ipcRenderer.invoke("save-file-dialog", content),

  // Platform info
  platform: process.platform,
});
