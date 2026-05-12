import { ipcRenderer, webUtils } from 'electron';

(window as any).api = {
  minimize: () => ipcRenderer.invoke('minimize-app'),
  maximize: () => ipcRenderer.invoke('maximize-app'),
  close: () => ipcRenderer.invoke('close-app'),
  analyzeFiles: (files: any[], globalMeta?: any) => ipcRenderer.invoke('analyze-files', files, globalMeta),
  commitFiles: (filesToCommit: any[]) => ipcRenderer.invoke('commit-files', filesToCommit),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  renameAndProcess: (filePath: string, newName: string) => ipcRenderer.invoke('rename-and-process', filePath, newName),
  changeGenre: (filePath: string, newGenre: string) => ipcRenderer.invoke('change-genre', filePath, newGenre),
  resolveFilePath: (file: any) => webUtils.getPathForFile(file),
  readAudioFile: (filePath: string) => ipcRenderer.invoke('read-audio-file', filePath),
  updateMetadata: (filePath: string, data: any) => ipcRenderer.invoke('update-metadata', filePath, data),
};
