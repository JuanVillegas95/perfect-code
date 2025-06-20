const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke("open-directory-dialog"),

  openFile: (): Promise<string | null> =>
    ipcRenderer.invoke("open-file-dialog"),

  tryProblem: (folderPath: string, template: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("try-problem", folderPath, template),

  readFile: (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> =>
    ipcRenderer.invoke("read-file", filePath),
});