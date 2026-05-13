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
  dbSearch: (query: string, genre?: string) => ipcRenderer.invoke('db-search', query, genre),
  scanAllDrives: (target?: string) => ipcRenderer.invoke('scan-all-drives', target),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  findAcapellas: () => ipcRenderer.invoke('find-acapellas'),
  clearDatabaseCache: () => ipcRenderer.invoke('clear-db'),
  analyzeVaultFile: (fileId: number, filePath: string) => ipcRenderer.invoke('analyze-vault-file', fileId, filePath),
  harvestAcapellas: (files: any[], targetDir: string, options: any) => ipcRenderer.invoke('harvest-acapellas', files, targetDir, options),
  onScanProgress: (callback: any) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('scan-progress', subscription);
    return () => ipcRenderer.removeListener('scan-progress', subscription);
  }
};
