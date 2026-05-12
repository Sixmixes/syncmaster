export {};

declare global {
  interface Window {
    api: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      analyzeFiles: (files: any[], globalMeta?: any) => Promise<any[]>;
      commitFiles: (filesToCommit: any[]) => Promise<any[]>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      renameAndProcess: (filePath: string, newName: string) => Promise<{ success: boolean; newPath?: string; metadata?: any; newName?: string; error?: string }>;
      changeGenre: (filePath: string, newGenre: string) => Promise<{ success: boolean; newPath?: string; newName?: string; error?: string }>;
      readAudioFile: (filePath: string) => Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }>;
      updateMetadata: (filePath: string, data: any) => Promise<{ success: boolean; newPath?: string; newName?: string; error?: string }>;
      resolveFilePath: (file: any) => string;
    };
  }
}
