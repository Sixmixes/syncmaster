import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import NodeID3 from 'node-id3';
import { fileURLToPath, pathToFileURL } from 'url';
import ffmpegStatic from 'ffmpeg-static';
import { initDatabase, getDbPath, searchAudio, findAcapellas, clearDatabase, updateAudioMetadata, addIgnoredPath, getIgnoredPaths } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function writeToLog(errorMsg: string) {
  try {
    const logPath = path.join(app.getAppPath(), 'error.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${errorMsg}\n`);
  } catch (err) {
    console.error("Failed to write to log file", err);
  }
}

// MUST be called before app.ready - registers media as a privileged streaming scheme
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, standard: true, stream: true, bypassCSP: true, supportFetchAPI: true } }
]);


let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  // Test if it's running in dev mode
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Boot local SQL database cache
  await initDatabase().catch(console.error);

  protocol.handle('media', (request) => {
    try {
      const filePath = decodeURIComponent(request.url.slice('media://'.length));
      const normalizedPath = path.normalize(filePath);
      const ext = path.extname(normalizedPath).toLowerCase();
      const mimeType = ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
      const data = fs.readFileSync(normalizedPath);
      return new Response(data, {
        headers: { 
          'content-type': mimeType,
          'content-length': String(data.length),
          'accept-ranges': 'bytes'
        }
      });
    } catch (err: any) {
      return new Response('File not found: ' + err.message, { status: 404 });
    }
  });

  // Fallback IPC handler: renderer can request audio as base64 if protocol fails
  ipcMain.handle('read-audio-file', async (event, filePath: string) => {
    try {
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
      return { success: true, data: data.toString('base64'), mimeType };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for UI
ipcMain.handle('minimize-app', () => {
  mainWindow?.minimize();
});

ipcMain.handle('maximize-app', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('close-app', () => {
  mainWindow?.close();
});

ipcMain.handle('mux-video-audio', async (event, data: { videoBase64: string, audioPath: string }) => {
  try {
    const videoBuffer = Buffer.from(data.videoBase64, 'base64');
    const tempVideoPath = path.join(os.tmpdir(), `syncmaster_forge_${Date.now()}.webm`);
    fs.writeFileSync(tempVideoPath, videoBuffer);
    
    const downloadsPath = app.getPath('downloads');
    const audioExt = path.extname(data.audioPath);
    const audioName = path.basename(data.audioPath, audioExt);
    
    // Save to standard downloads directory as mp4
    const outputFilename = `${audioName}_Visualizer_${Date.now()}.mp4`;
    const finalOutputPath = path.join(downloadsPath, outputFilename);

    return new Promise((resolve) => {
      const ffmpegPath = ffmpegStatic || 'ffmpeg';
      
      // Re-encode raw WebM stream to H.264 with constant rate factor 22 for highly optimized compression ratio
      const args = [
        '-y',
        '-i', tempVideoPath,
        '-i', data.audioPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest', 
        finalOutputPath
      ];

      const ffmpegProcess = spawn(ffmpegPath, args);
      let errorData = '';

      ffmpegProcess.stderr.on('data', (chunk) => {
        errorData += chunk.toString();
      });

      ffmpegProcess.on('close', (code) => {
        // Clean up temporary raw webm footage
        try { fs.unlinkSync(tempVideoPath); } catch(e) {}
        
        if (code === 0) {
          resolve({ success: true, outputPath: finalOutputPath });
        } else {
          console.error("FFMPEG ENCODE FAIL:", errorData);
          resolve({ success: false, error: `FFmpeg encoding error: ${errorData}` });
        }
      });
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// === SYNCMASTER V2 NEW IPC HANDLERS ===
ipcMain.handle('db-search', async (event, query: string, genre?: string) => {
  try {
    return await searchAudio(query, genre);
  } catch (err: any) {
    return { error: err.message };
  }
});

ipcMain.handle('find-acapellas', async () => {
  try {
    return await findAcapellas();
  } catch (err: any) {
    return { error: err.message };
  }
});

ipcMain.handle('clear-db', async () => {
  try {
    await clearDatabase();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('exclude-path', async (event, pathPattern: string) => {
  try {
    await addIgnoredPath(pathPattern);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-ignored-paths', async () => {
  try {
    const paths = await getIgnoredPaths();
    return { success: true, paths };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('harvest-acapellas', async (event, files: any[], targetDir: string, options: { mode: 'copy' | 'move', groupByGenre: boolean }) => {
  const results = [];
  
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (err: any) {
      return { success: false, error: `Could not create target directory: ${err.message}` };
    }
  }

  for (const file of files) {
    try {
      if (!fs.existsSync(file.filepath)) {
        results.push({ filepath: file.filepath, success: false, error: 'File not found on disk' });
        continue;
      }

      // Strictly block Studio One project folders in addition to the DB query filter
      if (file.filepath.toLowerCase().includes('studio one') || file.filepath.toLowerCase().includes('studioone')) {
        results.push({ filepath: file.filepath, success: false, error: 'Ignored DAW project system exclusion' });
        continue;
      }

      let destParent = targetDir;
      if (options.groupByGenre) {
        const genreFolder = file.genre ? formatGenre(file.genre) : 'UNCATEGORIZED';
        destParent = path.join(targetDir, genreFolder);
        if (!fs.existsSync(destParent)) {
          fs.mkdirSync(destParent, { recursive: true });
        }
      }

      const ext = path.extname(file.filepath);
      const baseName = path.basename(file.filepath, ext);
      let targetName = path.basename(file.filepath);
      let destPath = path.join(destParent, targetName);
      
      // Collision avoidance matrix
      let counter = 2;
      while (fs.existsSync(destPath)) {
        targetName = `${baseName}_V${counter}${ext}`;
        destPath = path.join(destParent, targetName);
        counter++;
      }

      if (options.mode === 'move') {
        // Use our cross-device safe move operator
        moveFileSafe(file.filepath, destPath);
      } else {
        fs.copyFileSync(file.filepath, destPath);
      }

      results.push({ filepath: file.filepath, success: true, destination: destPath });
    } catch (err: any) {
      results.push({ filepath: file.filepath, success: false, error: err.message });
    }
  }

  return { success: true, results };
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('scan-all-drives', async (event, targetPath?: string) => {
  return new Promise((resolve) => {
    const driveToScan = targetPath || 'C:\\';
    const dbPath = getDbPath();
    
    const isDev = !app.isPackaged;
    const baseDir = isDev ? app.getAppPath() : process.resourcesPath;
    const scannerScript = path.join(baseDir, 'python-engine', 'full_drive_scanner.py');
    
    const pyProcess = spawn('python', [scannerScript, driveToScan, dbPath]);
    
    pyProcess.stdout.on('data', (data) => {
      const raw = data.toString();
      try {
        // Forward real-time parsing updates to Frontend window
        const parsed = JSON.parse(raw);
        mainWindow?.webContents.send('scan-progress', parsed);
      } catch (e) {
        // Handle multiple buffered lines
        raw.split('\n').filter(Boolean).forEach(line => {
           try { mainWindow?.webContents.send('scan-progress', JSON.parse(line)); } catch(err){}
        });
      }
    });

    pyProcess.stderr.on('data', (data) => {
      console.error(`SCANNER ERR: ${data.toString()}`);
    });

    pyProcess.on('close', (code) => {
      resolve({ success: code === 0 });
    });
  });
});

function resolveActualPath(filePath: string): string {
  if (fs.existsSync(filePath)) return filePath;
  
  const baseDir = 'G:\\My Drive\\Music';
  const baseName = path.basename(filePath);
  
  const searchDirs = [
    path.join(baseDir, 'Sixkills Beats'),
    path.join(baseDir, 'Sixkills Songs')
  ];
  
  function findFileRecursive(dir: string, fileName: string): string | null {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, fileName);
        if (found) return found;
      } else if (entry.isFile()) {
        if (entry.name.toLowerCase() === fileName.toLowerCase()) {
          return fullPath;
        }
        
        const coreName = fileName.replace(/^@\w+_/i, '').replace(/_[A-G].*$/i, '').toLowerCase();
        const entryCore = entry.name.replace(/^@\w+_/i, '').replace(/_[A-G].*$/i, '').toLowerCase();
        if (coreName && entryCore && entryCore.includes(coreName)) {
          return fullPath;
        }
      }
    }
    return null;
  }
  
  for (const dir of searchDirs) {
    const found = findFileRecursive(dir, baseName);
    if (found) return found;
  }
  
  return filePath;
}

function getOrganizedPath(filePath: string, genre: string, hasVocals?: boolean, trackType?: string): string {
  // Save directly to Google Drive as requested
  const baseDir = 'G:\\My Drive\\Music';
  
  let masterFolder = 'Sixkills Songs';
  if (trackType) {
    if (trackType === 'Idea') masterFolder = 'Sixkills Ideas';
    else if (trackType === 'Beat') masterFolder = 'Sixkills Beats';
    else masterFolder = 'Sixkills Songs';
  } else if (hasVocals !== undefined) {
    masterFolder = hasVocals ? 'Sixkills Songs' : 'Sixkills Beats';
  } else {
    const baseName = path.basename(filePath).toLowerCase();
    const isInstrumental = /instrumental|inst\b|beat\b|dub\b/i.test(baseName);
    masterFolder = isInstrumental ? 'Sixkills Beats' : 'Sixkills Songs';
  }
  
  // Separate into MP3 / WAV folders
  let extFolder = path.extname(filePath).replace('.', '').toUpperCase();
  if (!extFolder) extFolder = 'UNKNOWN';

  return path.join(baseDir, masterFolder, extFolder, genre);
}

function formatKey(key: string): string {
  if (!key) return 'Amin';
  const cleanKey = key.trim();
  if (cleanKey.endsWith('m')) {
    return cleanKey.slice(0, -1) + 'min';
  }
  if (cleanKey.endsWith('Maj')) return cleanKey;
  if (cleanKey.endsWith('Min')) return cleanKey.slice(0, -3) + 'min';
  return cleanKey + 'Maj';
}

function formatGenre(genre: string): string {
  const genreMap: Record<string, string> = {
    'Melodic Trap': 'TRAP_MELODIC',
    'Trap': 'TRAP',
    'Boom Bap': 'BOOMBAP',
    'RnB': 'RNB',
    'Lo-Fi Hip Hop': 'CHILLHOP',
    'RnB / Soul': 'AFRO-RNB',
    'Afrobeats': 'AFRO-RNB',
    'House / Dance': 'HOUSE_DANCE',
    'Drum & Bass': 'DRUM_BASS',
    'Hip Hop': 'HIPHOP'
  };
  
  if (genreMap[genre]) return genreMap[genre];
  return genre.toUpperCase().replace(/\s+/g, '_').replace(/[\/\s&]+/g, '_');
}

function generateFileName(baseName: string, genre: string, key: string, bpm: number, ext: string): string {
  let cleanName = baseName
    .replace(/^@\w+_/g, '') 
    .replace(/_-\s*/g, '')
    .replace(/_\d+_[A-G].*$/g, '')
    .replace(/_\d+_\d+[AB].*$/g, '')
    .replace(/_[A-G](min|Maj)_\d+BPM$/i, '')
    .trim();
    
  cleanName = cleanName.replace(/_[A-G][^_\s]+_\d+BPM$/i, '').trim();

  const formattedName = cleanName.toUpperCase().replace(/\s+/g, '_');
  const formattedGenre = formatGenre(genre);
  const formattedKey = formatKey(key);
  
  return `@SPACEJAMZ_${formattedGenre}_-_${formattedName}_${formattedKey}_${bpm}BPM${ext}`;
}

function moveFileSafe(src: string, dest: string) {
  try {
    fs.renameSync(src, dest);
  } catch (err: any) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
}

// Audio File Processing Handler
ipcMain.handle('analyze-files', async (event, files: string[], globalMeta?: any) => {
  const results = [];
  for (const file of files) {
    try {
      const metadata = await getAudioMetadata(file);
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      
      let trackType = 'Beat';
      if (metadata.duration && metadata.duration < 90) {
        trackType = 'Idea';
      } else if (metadata.has_vocals) {
        trackType = 'Song';
      }
      
      const finalMetadata = {
        ...metadata,
        trackType,
        artist: globalMeta?.artist || '',
        album: globalMeta?.album || '',
        contributingArtist: globalMeta?.contributingArtist || '',
        comment: globalMeta?.comment || ''
      };
      
      let newName = generateFileName(baseName, metadata.genre, metadata.key, metadata.bpm, ext);
      results.push({ file, success: true, metadata: finalMetadata, newName });
    } catch (err: any) {
      writeToLog(`analyze-files failed: ${err.message}`);
      results.push({ file, success: false, error: err.message });
    }
  }
  return results;
});

ipcMain.handle('commit-files', async (event, filesToCommit: { file: string, metadata: any, newName: string, isAlternate?: boolean }[]) => {
  const results = [];
  for (const item of filesToCommit) {
    try {
      const { file, metadata, isAlternate } = item;
      const actualPath = resolveActualPath(file);
      const ext = path.extname(actualPath);
      
      const baseName = metadata.title || path.basename(actualPath, ext).replace(/_\d+_[A-G].*$/g, '').replace(/^@\w+_/i, '');
      let newName = generateFileName(baseName, metadata.genre, metadata.key, metadata.bpm, ext);
      
      const organizedDir = getOrganizedPath(actualPath, metadata.genre, metadata.has_vocals, metadata.trackType);
      if (!fs.existsSync(organizedDir)) {
        fs.mkdirSync(organizedDir, { recursive: true });
      }

      let newPath = path.join(organizedDir, newName);

      if (isAlternate) {
        let counter = 2;
        const nameWithoutExt = newName.slice(0, -ext.length);
        while (fs.existsSync(newPath)) {
          newName = `${nameWithoutExt}_V${counter}${ext}`;
          newPath = path.join(organizedDir, newName);
          counter++;
        }
      }

      const keyToUse = metadata.camelot || metadata.key;

      if (ext.toLowerCase() === '.mp3') {
        const baseTitle = newName.replace(/\.[^/.]+$/, "").replace(/_\d+_[A-G].*$/g, '').replace(/^@\w+_/i, '');
        const tags: any = {
          title: metadata.title || baseTitle,
          bpm: metadata.bpm.toString(),
          initialKey: keyToUse,
          genre: metadata.genre
        };
        if (metadata.artist) tags.artist = metadata.artist;
        if (metadata.album) tags.album = metadata.album;
        if (metadata.contributingArtist) tags.performerInfo = metadata.contributingArtist;
        if (metadata.comment) tags.comment = { language: "eng", text: metadata.comment };
        if (metadata.albumArt && fs.existsSync(metadata.albumArt)) {
          const extImg = path.extname(metadata.albumArt).toLowerCase();
          const mime = extImg === '.png' ? 'image/png' : 'image/jpeg';
          tags.image = {
            mime: mime,
            type: { id: 3, name: 'front cover' },
            description: 'Cover',
            imageBuffer: fs.readFileSync(metadata.albumArt)
          };
        }
        NodeID3.update(tags, actualPath);
      }

      moveFileSafe(actualPath, newPath);
      results.push({ file: actualPath, newPath, newName, success: true, metadata });
    } catch (err: any) {
      writeToLog(`commit-files failed: ${err.message}`);
      results.push({ file: item.file, success: false, error: err.message });
    }
  }
  return results;
});

ipcMain.handle('delete-file', async (event, filePath: string) => {
  try {
    const actualPath = resolveActualPath(filePath);
    if (fs.existsSync(actualPath)) {
      fs.unlinkSync(actualPath);
    }
    return { success: true };
  } catch (err: any) {
    writeToLog(`delete-file failed for ${filePath}: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('rename-and-process', async (event, filePath: string, newName: string) => {
  try {
    const ext = path.extname(filePath);
    let finalName = newName;
    if (!finalName.toLowerCase().endsWith(ext.toLowerCase())) {
      finalName += ext;
    }
    
    // Analyze first
    const metadata = await getAudioMetadata(filePath);
    const baseDir = path.dirname(filePath);
    const organizedDir = path.join(baseDir, 'Organized', metadata.genre);
    
    if (!fs.existsSync(organizedDir)) {
      fs.mkdirSync(organizedDir, { recursive: true });
    }
    
    const newPath = path.join(organizedDir, finalName);
    
    if (ext.toLowerCase() === '.mp3') {
      const baseTitle = finalName.replace(/\.[^/.]+$/, "").replace(/_\d+_[A-G].*$/g, '');
      const tags = {
        title: baseTitle,
        bpm: metadata.bpm.toString(),
        initialKey: metadata.key,
        genre: metadata.genre
      };
      NodeID3.update(tags, filePath);
    }
    
    fs.renameSync(filePath, newPath);
    return { success: true, newPath, metadata, newName: finalName };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('change-genre', async (event, filePath: string, newGenre: string) => {
  try {
    const actualPath = resolveActualPath(filePath);
    const ext = path.extname(actualPath);
    const metadata = await getAudioMetadata(actualPath);
    
    const baseName = path.basename(actualPath, ext);
    const finalName = generateFileName(baseName, newGenre, metadata.key, metadata.bpm, ext);
    
    const organizedDir = getOrganizedPath(actualPath, newGenre, metadata.has_vocals);
    if (!fs.existsSync(organizedDir)) {
      fs.mkdirSync(organizedDir, { recursive: true });
    }
    
    const newPath = path.join(organizedDir, finalName);
    
    if (ext.toLowerCase() === '.mp3') {
      const tags = {
        genre: newGenre
      };
      NodeID3.update(tags, actualPath);
    }
    
    moveFileSafe(actualPath, newPath);
    return { success: true, newPath, newName: finalName };
  } catch (err: any) {
    writeToLog(`change-genre failed for ${filePath}: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update-metadata', async (event, filePath: string, data: any) => {
  try {
    const actualPath = resolveActualPath(filePath);
    const ext = path.extname(actualPath);
    const currentName = path.basename(actualPath);
    
    // We update the ID3 tags
    const keyToUse = data.camelot || data.key;
    if (ext.toLowerCase() === '.mp3') {
      const tags: any = {
        title: data.title,
        artist: data.artist,
        album: data.album,
        year: data.year,
        bpm: data.bpm,
        initialKey: keyToUse
      };
      if (data.contributingArtist) tags.performerInfo = data.contributingArtist;
      if (data.comment) tags.comment = { language: "eng", text: data.comment };
      if (data.albumArt && fs.existsSync(data.albumArt)) {
        const extImg = path.extname(data.albumArt).toLowerCase();
        const mime = extImg === '.png' ? 'image/png' : 'image/jpeg';
        tags.image = {
          mime: mime,
          type: { id: 3, name: 'front cover' },
          description: 'Cover',
          imageBuffer: fs.readFileSync(data.albumArt)
        };
      }
      // Keep existing tags and update with new ones
      NodeID3.update(tags, actualPath);
    }
    
    const parentDirName = path.basename(path.dirname(actualPath));
    const genre = parentDirName !== 'Organized' ? parentDirName : 'Hip Hop';
    
    const finalName = generateFileName(data.title, genre, keyToUse, data.bpm, ext);
    const newPath = path.join(path.dirname(actualPath), finalName);
    
    if (actualPath !== newPath) {
      moveFileSafe(actualPath, newPath);
    }
    
    return { success: true, newPath, newName: finalName };
  } catch (err: any) {
    writeToLog(`update-metadata failed for ${filePath}: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('analyze-vault-file', async (event, fileId: number, filePath: string) => {
  try {
    const data = await getAudioMetadata(filePath);
    await updateAudioMetadata(fileId, {
      bpm: data.bpm,
      key: data.key,
      genre: data.genre,
      has_vocals: data.has_vocals,
      mood: data.mood,
      energy: data.energy,
      danceability: data.danceability,
      viral_score: data.viral_score,
      type: data.type
    });
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('save-marketing-pack', async (event, filePath: string, content: string) => {
  try {
    const resolved = resolveActualPath(decodeURIComponent(filePath.replace('media://', '')));
    const dir = path.dirname(resolved);
    const base = path.basename(resolved, path.extname(resolved));
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const outPath = path.join(dir, `${base}_SocialAssets.md`);
    fs.writeFileSync(outPath, content, 'utf8');
    return { success: true, path: outPath };
  } catch (err: any) {
    writeToLog(`save-marketing-pack failed: ${err.message}`);
    return { success: false, error: err.message };
  }
});

function getAudioMetadata(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // We will call a python script to handle heavy lifting
    // Handle both dev environment and production packages paths
    const isDev = !app.isPackaged;
    const baseDir = isDev ? app.getAppPath() : process.resourcesPath;
    const pythonScript = path.join(baseDir, 'python-engine', 'analyzer.py');
    const ffmpegDir = ffmpegStatic ? path.dirname(ffmpegStatic) : '';
    const pythonProcess = spawn('python', [pythonScript, filePath], {
      env: {
        ...process.env,
        PATH: `${ffmpegDir}${path.delimiter}${process.env.PATH || ''}`
      }
    });
    
    let resultData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = `Python process exited with code ${code}: ${errorData}`;
        try {
          fs.writeFileSync(path.join(app.getAppPath(), 'error.log'), errorMsg);
        } catch (e) {}
        reject(new Error(errorMsg));
      } else {
        try {
          resolve(JSON.parse(resultData));
        } catch (e) {
          reject(new Error(`Failed to parse python output: ${resultData}`));
        }
      }
    });
  });
}
