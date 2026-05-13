import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, AlertCircle, CheckCircle, RefreshCw, Play, Pause, Database, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioVaultSearch } from './AudioVaultSearch';

type ProcessedFile = {
  id: string;
  originalPath: string;
  originalName: string;
  status: 'processing' | 'staged' | 'done' | 'error' | 'review';
  metadata?: {
    bpm: number;
    key: string;
    genre: string;
    filename: string;
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    contributingArtist?: string;
    comment?: string;
    camelot?: string;
    albumArt?: string;
    trackType?: 'Beat' | 'Song' | 'Idea';
    duration?: number;
    mood?: string;
    style?: string;
  };
  error?: string;
  newName?: string;
  isAlternate?: boolean;
};

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

function clientGenerateFileName(title: string, genre: string, key: string, bpm: number, originalName: string, template?: string, globalArtist?: string, trackType?: string): string {
  const extMatch = originalName.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '.mp3';
  
  let cleanName = title
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
  
  const targetTemplate = template || '@SPACEJAMZ_{Genre}_-_{Title}_{Key}_{BPM}BPM';
  
  let newName = targetTemplate
    .replace(/{Title}/gi, cleanName || 'UNTITLED')
    .replace(/{Genre}/gi, formattedGenre || 'UNGENRED')
    .replace(/{Key}/gi, formattedKey || 'UNKNOWN')
    .replace(/{BPM}/gi, bpm ? bpm.toString() : '000')
    .replace(/{Artist}/gi, globalArtist || 'Unknown_Artist')
    .replace(/{Type}/gi, trackType || 'Track')
    .replace(/{Date}/gi, new Date().toISOString().split('T')[0]);
    
  // Cleanup any double spaces or bad underscores
  newName = newName.replace(/\s+/g, ' ').trim();
  
  return newName + ext;
}

export const FileOrganizer = ({ 
  initialFilePaths, 
  onInitialHandled,
  onPlayTrack,
  activeTrackId,
  isScanning = false,
  scanStatus = '',
  foundCount = 0,
  onStartScan = () => {}
}: { 
  initialFilePaths?: string[] | null, 
  onInitialHandled?: () => void,
  onPlayTrack?: (track: { filepath: string; filename: string; id: string | number }) => void,
  activeTrackId?: string | number | null,
  isScanning?: boolean,
  scanStatus?: string,
  foundCount?: number,
  onStartScan?: () => void
}) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'staged' | 'processed' | 'review'>('staged');
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSideVault, setShowSideVault] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '', artist: '', album: '', year: '', bpm: '', key: '', camelot: '', contributingArtist: '', comment: '', albumArt: '', mood: '', style: ''
  });
  const [globalMetadata, setGlobalMetadata] = useState(() => {
    const saved = localStorage.getItem('syncmaster_global_meta');
    if (saved) {
      try { return { artist: '', contributingArtist: '', comment: '', album: '', albumArt: '', mood: '', style: '', renameTemplate: '@SPACEJAMZ_{Genre}_-_{Title}_{Key}_{BPM}BPM', ...JSON.parse(saved) }; } catch (e) {}
    }
    return { artist: '', contributingArtist: '', comment: '', album: '', albumArt: '', mood: '', style: '', renameTemplate: '@SPACEJAMZ_{Genre}_-_{Title}_{Key}_{BPM}BPM' };
  });

  useEffect(() => {
    localStorage.setItem('syncmaster_global_meta', JSON.stringify(globalMetadata));
  }, [globalMetadata]);

  const handleImportPaths = useCallback(async (incomingPaths: string[]) => {
    if (!incomingPaths || incomingPaths.length === 0 || !window.api) return;

    const newFiles: ProcessedFile[] = incomingPaths.map(path => {
      const pathParts = path.split(/[\\\/]/);
      const fileName = pathParts[pathParts.length - 1];
      return {
        id: Math.random().toString(36).substring(7),
        originalPath: path,
        originalName: fileName,
        status: 'processing'
      };
    });

    // Add to stage immediately
    setFiles(prev => [...newFiles, ...prev]);
    setActiveTab('all');

    // Execute strictly sequential analysis waterfall
    for (const entry of newFiles) {
      try {
        const results = await window.api.analyzeFiles([entry.originalPath], globalMetadata);
        const result = results[0];
        setFiles(prev => prev.map(curr => {
          if (curr.id === entry.id) {
            if (result && result.success) {
              return { ...curr, status: 'staged', metadata: result.metadata, newName: result.newName || curr.originalName };
            } else {
              return { ...curr, status: 'error', error: result?.error || "Failed analysis" };
            }
          }
          return curr;
        }));
      } catch (err: any) {
        console.error("Bridge import analysis failure", entry.originalPath, err);
        setFiles(prev => prev.map(curr => curr.id === entry.id ? { ...curr, status: 'error', error: err.message } : curr));
      }
    }
  }, [globalMetadata]);

  const togglePlay = useCallback((file: ProcessedFile) => {
    if (onPlayTrack) {
      onPlayTrack({
        filepath: file.originalPath,
        filename: file.newName || file.originalName,
        id: file.id
      });
    }
  }, [onPlayTrack]);

  const handleDelete = useCallback(async (file: ProcessedFile) => {
    if (window.confirm(`Are you sure you want to completely delete ${file.originalName} from your disk?`)) {
      if (window.api) {
        const res = await window.api.deleteFile(file.originalPath);
        if (res.success) {
          setFiles(prev => prev.filter(f => f.id !== file.id));
        } else {
          alert("Failed to delete file: " + res.error);
        }
      } else {
        setFiles(prev => prev.filter(f => f.id !== file.id));
      }
    }
  }, []);

  const handleUnstage = useCallback((file: ProcessedFile) => {
    setFiles(prev => prev.filter(f => f.id !== file.id));
  }, []);

  const handleEditStart = useCallback((file: ProcessedFile) => {
    setEditingId(file.id);
    setEditFormData({
      title: file.metadata?.title || file.originalName.replace(/_\d+_[A-G].*$/g, '').replace(/\.[^/.]+$/, ''),
      artist: file.metadata?.artist || globalMetadata.artist || '',
      album: file.metadata?.album || globalMetadata.album || '',
      year: file.metadata?.year || '',
      bpm: file.metadata?.bpm?.toString() || '',
      key: file.metadata?.key || '',
      camelot: file.metadata?.camelot || '',
      contributingArtist: file.metadata?.contributingArtist || globalMetadata.contributingArtist || '',
      comment: file.metadata?.comment || globalMetadata.comment || '',
      albumArt: file.metadata?.albumArt || globalMetadata.albumArt || '',
      mood: file.metadata?.mood || globalMetadata.mood || '',
      style: file.metadata?.style || globalMetadata.style || ''
    });
  }, [globalMetadata]);

  const handleEditSave = useCallback(async (file: ProcessedFile) => {
    if (!editFormData.title.trim()) return;

    if (file.status === 'staged' || file.status === 'review') {
      setFiles(prev => prev.map(f => {
        if (f.id === file.id) {
          const meta = { ...f.metadata, ...editFormData } as any;
          const generatedName = clientGenerateFileName(meta.title || f.originalName, meta.genre, meta.key, meta.bpm, f.originalName, globalMetadata.renameTemplate, meta.artist || globalMetadata.artist, meta.trackType);
          return { ...f, metadata: meta, newName: generatedName };
        }
        return f;
      }));
      setEditingId(null);
      return;
    }

    if (window.api && window.api.updateMetadata) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f));
      const res = await window.api.updateMetadata(file.originalPath, editFormData);
      if (res.success) {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            return {
              ...f,
              status: 'done',
              originalPath: res.newPath || f.originalPath,
              metadata: { ...f.metadata, ...editFormData } as any,
              newName: res.newName
            };
          }
          return f;
        }));
        setEditingId(null);
      } else {
        alert("Failed to update metadata: " + res.error);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'done' } : f));
      }
    } else {
      setEditingId(null);
    }
  }, [editFormData]);

  const handleGenreChange = useCallback(async (file: ProcessedFile, newGenre: string) => {
    if (file.status === 'staged' || file.status === 'review') {
      setFiles(prev => prev.map(f => {
        if (f.id === file.id) {
          const meta = { ...f.metadata, genre: newGenre } as any;
          const generatedName = clientGenerateFileName(meta.title || f.originalName, meta.genre, meta.key, meta.bpm, f.originalName, globalMetadata.renameTemplate, meta.artist || globalMetadata.artist, meta.trackType);
          return { ...f, metadata: meta, newName: generatedName };
        }
        return f;
      }));
      return;
    }

    if (window.api) {
      const res = await window.api.changeGenre(file.originalPath, newGenre);
      if (res.success) {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            return {
              ...f,
              originalPath: res.newPath || f.originalPath,
              newName: res.newName || f.newName,
              metadata: f.metadata ? { ...f.metadata, genre: newGenre } : undefined
            };
          }
          return f;
        }));
      } else {
        alert("Failed to change genre: " + res.error);
      }
    } else {
      setFiles(prev => prev.map(f => {
        if (f.id === file.id) {
          return {
            ...f,
            metadata: f.metadata ? { ...f.metadata, genre: newGenre } : undefined
          };
        }
        return f;
      }));
    }
  }, []);

  const handleKeepAlternate = useCallback(async (file: ProcessedFile) => {
    if (window.api) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing', isAlternate: true } : f));
      try {
        const results = await window.api.analyzeFiles([file.originalPath], globalMetadata);
        const result = results[0];
        if (result && result.success) {
          setFiles(prev => prev.map(f => {
            if (f.id === file.id) {
              return {
                ...f,
                status: 'staged',
                metadata: result.metadata,
                newName: result.newName || f.originalName
              };
            }
            return f;
          }));
        } else {
          alert("Failed to process alternate: " + (result?.error || "Unknown error"));
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'review' } : f));
        }
      } catch (err) {
        console.error("Keep alternate failed", err);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'review' } : f));
      }
    }
  }, [globalMetadata]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // 1. Intercept application-internal track drops from Split Vault
    const internalData = e.dataTransfer.getData('application/x-syncmaster-tracks');
    if (internalData) {
      try {
        const draggedPaths = JSON.parse(internalData) as string[];
        if (draggedPaths && draggedPaths.length > 0) {
          handleImportPaths(draggedPaths);
          return;
        }
      } catch (err) {
        console.error("Failed to deserialize dropped internal paths:", err);
      }
    }

    // 2. Fallback to OS Native File system drops
    const filesList = e.nativeEvent.dataTransfer?.files || e.dataTransfer.files;
    const droppedFiles = Array.from(filesList)
      .filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.wav'));
      
    if (droppedFiles.length === 0) return;

    // Filter duplicates against current state
    const newFiles: ProcessedFile[] = droppedFiles.map(f => {
      // Simulate duplicate check
      const isDuplicate = files.some(existing => existing.originalName === f.name) || f.name.includes('(1)');
      const realPath = window.api ? window.api.resolveFilePath(f) : '';
      
      return {
        id: Math.random().toString(36).substring(7),
        originalPath: realPath,
        originalName: f.name,
        status: isDuplicate ? 'review' : 'processing',
      };
    });

    setFiles(prev => [...newFiles, ...prev]);

    // Send processing files to Electron main process sequentially for true step-by-step UI loading
    const toProcess = newFiles.filter(f => f.status === 'processing');
    if (toProcess.length > 0 && window.api) {
      // Fire an IIFE async wrapper to manage loop
      (async () => {
        for (const f of toProcess) {
          try {
            const results = await window.api.analyzeFiles([f.originalPath], globalMetadata);
            const result = results[0];
            
            setFiles(prev => prev.map(curr => {
              if (curr.id === f.id) {
                if (result && result.success) {
                  return { ...curr, status: 'staged', metadata: result.metadata, newName: result.newName || curr.originalName };
                } else {
                  return { ...curr, status: 'error', error: result?.error || "Failed analysis" };
                }
              }
              return curr;
            }));
          } catch (err: any) {
            console.error("Processing failed for file", f.originalPath, err);
            setFiles(prev => prev.map(curr => curr.id === f.id ? { ...curr, status: 'error', error: err.message } : curr));
          }
        }
      })();
    } else if (toProcess.length > 0) {
      // Mock processing if running in browser
      setTimeout(() => {
        setFiles(prev => prev.map(f => {
          if (toProcess.some(p => p.id === f.id)) {
            const mockMeta = { bpm: 120, key: 'Cm', genre: 'Hip Hop', filename: f.originalName };
            const baseName = f.originalName.replace(/\.[^/.]+$/, "");
            return { 
              ...f, 
              status: 'staged', 
              metadata: mockMeta,
              newName: `${baseName}_120_Cm_Hip Hop.mp3`
            };
          }
          return f;
        }));
      }, 2000);
    }
  }, [files, handleImportPaths]);

  // Process incoming paths sent from the global App context injection
  useEffect(() => {
    if (initialFilePaths && initialFilePaths.length > 0) {
      handleImportPaths(initialFilePaths);
      onInitialHandled && onInitialHandled(); // Release shell state lock
    }
  }, [initialFilePaths, handleImportPaths, onInitialHandled]);

  const inputStyle = {
    background: 'var(--bg-dark)', 
    border: '1px solid var(--accent-primary)', 
    borderRadius: '4px', 
    padding: '4px 8px', 
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    flex: '1'
  };

  const handleCommitStaged = useCallback(async () => {
    const stagedFiles = files.filter(f => f.status === 'staged');
    if (stagedFiles.length === 0 || !window.api) return;

    // Send to backend
    const toCommit = stagedFiles.map(f => ({
      file: f.originalPath,
      metadata: f.metadata,
      newName: f.newName || f.originalName,
      isAlternate: f.isAlternate
    }));

    try {
      const results = await window.api.commitFiles(toCommit);
      
      setFiles(prev => prev.map(f => {
        const result = results.find(r => r.file === f.originalPath);
        if (result && result.success) {
          return { ...f, status: 'done', originalPath: result.newPath || f.originalPath, newName: result.newName };
        } else if (result) {
          return { ...f, status: 'error', error: result.error };
        }
        return f;
      }));
    } catch (err) {
      console.error("Commit failed", err);
    }
  }, [files]);

  const handleAutoName = useCallback(() => {
    setFiles(prev => {
      const counts: Record<string, number> = {};
      return prev.map(f => {
        if (f.status === 'staged') {
          const genre = f.metadata?.genre || 'Unknown';
          const title = f.metadata?.title || f.originalName;
          
          const isGeneric = !title || title.toLowerCase().includes('beat') || title.toLowerCase().includes('untitled') || title.toLowerCase().match(/^audio track/i) || title.match(/\(\d+\)/);
          
          if (isGeneric) {
            if (!counts[genre]) counts[genre] = 1;
            const newTitle = `Beat #${counts[genre].toString().padStart(2, '0')}`;
            counts[genre]++;
            return { ...f, metadata: { ...f.metadata, title: newTitle } as ProcessedFile['metadata'] };
          }
        }
        return f;
      });
    });
  }, []);

  const filteredFiles = files.filter(f => {
    if (activeTab === 'staged') return f.status === 'staged';
    if (activeTab === 'processed') return f.status === 'done';
    if (activeTab === 'review') return f.status === 'review' || f.status === 'error';
    return true;
  });

  const playNextTrack = useCallback(() => {
    if (!activeTrackId) return;
    const idx = filteredFiles.findIndex(f => f.id === activeTrackId);
    if (idx >= 0 && idx < filteredFiles.length - 1) {
      setTimeout(() => togglePlay(filteredFiles[idx + 1]), 100);
    }
  }, [activeTrackId, filteredFiles, togglePlay]);

  const playPrevTrack = useCallback(() => {
    if (!activeTrackId) return;
    const idx = filteredFiles.findIndex(f => f.id === activeTrackId);
    if (idx > 0) {
      setTimeout(() => togglePlay(filteredFiles[idx - 1]), 100);
    }
  }, [activeTrackId, filteredFiles, togglePlay]);

  return (
    <div className="app-container" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Titlebar handled outside this component or here */}
      <div className="sidebar">
        <div style={{ padding: '24px' }}>
          <h1 className="header-title text-gradient">SyncMaster</h1>
          <p className="header-subtitle">Audio Meta Tagging Engine</p>
          
          <div className="tabs" style={{ marginBottom: '8px' }}>
            <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</div>
            <div className={`tab ${activeTab === 'staged' ? 'active' : ''}`} onClick={() => setActiveTab('staged')}>Staged</div>
            <div className={`tab ${activeTab === 'processed' ? 'active' : ''}`} onClick={() => setActiveTab('processed')}>Processed</div>
            <div className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>Review</div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              className="btn"
              style={{ 
                flex: 1, 
                padding: '8px', 
                fontSize: '11px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                background: showSideVault ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                border: showSideVault ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                color: showSideVault ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => setShowSideVault(!showSideVault)}
            >
              <Columns size={12} />
              {showSideVault ? 'Close Vault' : 'Split Vault'}
            </button>

            <button 
              className="btn" 
              style={{ 
                flex: 1, 
                padding: '8px', 
                fontSize: '11px', 
                color: 'var(--text-secondary)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the workspace? This will not delete your files from disk.')) {
                  setFiles([]);
                }
              }}
            >
              Clear Workspace
            </button>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '10px', fontSize: '12px', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={handleCommitStaged}
            disabled={files.filter(f => f.status === 'staged').length === 0}
          >
            <CheckCircle size={14} /> Commit All Staged
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '8px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={handleAutoName}
            disabled={files.filter(f => f.status === 'staged').length === 0}
          >
            <RefreshCw size={14} /> Auto-Name Staged Beats
          </button>

          {/* Batch Default Metadata Form */}
          <div style={{ marginTop: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--accent-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Batch Default Tags</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Artist</label>
                <input 
                  type="text" 
                  placeholder="e.g. BeatsByProducer" 
                  value={globalMetadata.artist} 
                  onChange={(e) => setGlobalMetadata({ ...globalMetadata, artist: e.target.value })} 
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Contributing Artist</label>
                <input 
                  type="text" 
                  placeholder="e.g. Co-Producer" 
                  value={globalMetadata.contributingArtist} 
                  onChange={(e) => setGlobalMetadata({ ...globalMetadata, contributingArtist: e.target.value })} 
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Album</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sixkills Beats" 
                  value={globalMetadata.album} 
                  onChange={(e) => setGlobalMetadata({ ...globalMetadata, album: e.target.value })} 
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Mood</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dark, Chill" 
                    value={globalMetadata.mood} 
                    onChange={(e) => setGlobalMetadata({ ...globalMetadata, mood: e.target.value })} 
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Style</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Texas, Underground" 
                    value={globalMetadata.style} 
                    onChange={(e) => setGlobalMetadata({ ...globalMetadata, style: e.target.value })} 
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Rename Template</label>
                <input 
                  type="text" 
                  placeholder="{Type} - {Artist} - {Title}" 
                  value={globalMetadata.renameTemplate} 
                  onChange={(e) => setGlobalMetadata({ ...globalMetadata, renameTemplate: e.target.value })} 
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--accent-primary)', borderRadius: '4px', padding: '6px 8px', color: 'var(--accent-primary)', fontSize: '11px', outline: 'none', fontFamily: 'monospace' }} 
                />
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  Use: {'{Title}, {Genre}, {Key}, {BPM}, {Artist}, {Type}'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Album Art</label>
                <div 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file && window.api) {
                        const path = window.api.resolveFilePath(file);
                        setGlobalMetadata({ ...globalMetadata, albumArt: path });
                      }
                    };
                    input.click();
                  }}
                  style={{ 
                    border: '1px dashed var(--border-color)', 
                    borderRadius: '4px', 
                    padding: '12px', 
                    textAlign: 'center', 
                    cursor: 'pointer', 
                    background: 'var(--bg-dark)', 
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  {globalMetadata.albumArt ? (
                    <>
                      <img 
                        src={`media://${globalMetadata.albumArt}`} 
                        alt="Preview" 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} 
                      />
                      <span style={{ position: 'relative', zIndex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>Change Art</span>
                    </>
                  ) : (
                    <>
                      <span>Click to Select</span>
                      <span style={{ fontSize: '9px', opacity: 0.6 }}>(JPG, PNG)</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Comments</label>
                <textarea 
                  placeholder="e.g. BPM / Key Tagged by SyncMaster" 
                  value={globalMetadata.comment} 
                  onChange={(e) => setGlobalMetadata({ ...globalMetadata, comment: e.target.value })} 
                  rows={2}
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', resize: 'none' }} 
                />
              </div>
            </div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Stats</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
              <span>Total Files:</span>
              <span style={{ fontWeight: 600 }}>{files.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--success)' }}>
              <span>Processed:</span>
              <span style={{ fontWeight: 600 }}>{files.filter(f => f.status === 'done').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--warning)', marginTop: '4px' }}>
              <span>Needs Review:</span>
              <span style={{ fontWeight: 600 }}>{files.filter(f => f.status === 'review').length}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <motion.div 
          className={`dropzone ${isDragging ? 'active' : ''}`}
          animate={{ scale: isDragging ? 1.02 : 1 }}
        >
          <UploadCloud size={48} className="dropzone-icon" />
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Drop your audio files here</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Supports .mp3 and .wav formats</p>
        </motion.div>

        <div className="file-list" style={{ paddingBottom: activeTrackId ? '100px' : '0' }}>
          <AnimatePresence>
            {filteredFiles.map((file) => (
              <motion.div 
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="file-item"
              >
                <button 
                  onClick={() => togglePlay(file)}
                  className="file-icon"
                  style={{
                    background: activeTrackId === file.id ? 'var(--accent-primary-dim)' : 'rgba(255, 255, 255, 0.05)',
                    color: activeTrackId === file.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  title={activeTrackId === file.id ? "Pause" : "Play Preview"}
                >
                  {file.metadata?.albumArt ? (
                    <img 
                      src={`media://${file.metadata.albumArt}`} 
                      alt="Art" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                    />
                  ) : globalMetadata.albumArt ? (
                    <img 
                      src={`media://${globalMetadata.albumArt}`} 
                      alt="Art" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
                    />
                  ) : null}
                  <div style={{ position: 'relative', zIndex: 1, background: 'rgba(15,17,21,0.5)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeTrackId === file.id ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '1px' }} />}
                  </div>
                </button>
                <div className="file-details">
                  {editingId === file.id ? (
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', width: '100%' }}>
                      <div 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const f = e.target.files?.[0];
                            if (f && window.api) {
                              const path = window.api.resolveFilePath(f);
                              setEditFormData({ ...editFormData, albumArt: path });
                            }
                          };
                          input.click();
                        }}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          border: '1px dashed var(--border-color)', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          background: 'var(--bg-dark)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'var(--text-secondary)',
                          position: 'relative',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                        title="Click to change artwork"
                      >
                        {editFormData.albumArt ? (
                          <img src={`media://${editFormData.albumArt}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>Set Art</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input type="text" placeholder="Title" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} style={inputStyle} autoFocus />
                          <input type="text" placeholder="Artist" value={editFormData.artist} onChange={(e) => setEditFormData({...editFormData, artist: e.target.value})} style={inputStyle} />
                          <input type="text" placeholder="Contributing Artist" value={editFormData.contributingArtist} onChange={(e) => setEditFormData({...editFormData, contributingArtist: e.target.value})} style={inputStyle} />
                          <input type="text" placeholder="Album" value={editFormData.album} onChange={(e) => setEditFormData({...editFormData, album: e.target.value})} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input type="text" placeholder="Year" value={editFormData.year} onChange={(e) => setEditFormData({...editFormData, year: e.target.value})} style={{...inputStyle, width: '60px'}} />
                          <input type="text" placeholder="BPM" value={editFormData.bpm} onChange={(e) => setEditFormData({...editFormData, bpm: e.target.value})} style={{...inputStyle, width: '60px'}} />
                          <input type="text" placeholder="Key" value={editFormData.key} onChange={(e) => setEditFormData({...editFormData, key: e.target.value})} style={{...inputStyle, width: '60px'}} />
                          <input type="text" placeholder="Mood" value={editFormData.mood} onChange={(e) => setEditFormData({...editFormData, mood: e.target.value})} style={{...inputStyle, width: '100px'}} />
                          <input type="text" placeholder="Style" value={editFormData.style} onChange={(e) => setEditFormData({...editFormData, style: e.target.value})} style={{...inputStyle, width: '100px'}} />
                          <input type="text" placeholder="Comments" value={editFormData.comment} onChange={(e) => setEditFormData({...editFormData, comment: e.target.value})} style={{...inputStyle, flex: '1', minWidth: '150px'}} />
                          <button className="btn" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleEditSave(file)}>Save Tags</button>
                          <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="file-name">{file.newName || file.originalName}</div>
                  )}
                  <div className="file-meta">
                    {file.metadata ? (
                      <>
                        <span className="meta-badge bpm">BPM: {file.metadata.bpm}</span>
                        <span className="meta-badge key">
                          Key: {file.metadata.key} {file.metadata.camelot ? `(${file.metadata.camelot})` : ''}
                        </span>
                        {/instrumental|inst\b|beat\b|dub\b/i.test(file.newName || file.originalName) ? (
                          <span className="meta-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>Instrumental</span>
                        ) : (
                          <span className="meta-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>With Vocals</span>
                        )}
                        <select 
                          value={file.metadata.genre}
                          onChange={(e) => handleGenreChange(file, e.target.value)}
                          className="meta-badge genre-select"
                          style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {['Trap', 'Melodic Trap', 'Boom Bap', 'RnB', 'Lo-Fi Hip Hop', 'RnB / Soul', 'Afrobeats', 'House / Dance', 'Drum & Bass'].map(g => (
                            <option key={g} value={g} style={{ background: '#1e1e24', color: '#f3f4f6' }}>{g}</option>
                          ))}
                        </select>
                        <select 
                          value={file.metadata.trackType || 'Beat'}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            if (file.status === 'staged') {
                              setFiles(prev => prev.map(f => f.id === file.id ? { ...f, metadata: { ...f.metadata, trackType: newType } as any } : f));
                            }
                          }}
                          className="meta-badge type-select"
                          style={{
                            background: file.metadata.trackType === 'Idea' ? 'rgba(234, 179, 8, 0.15)' : file.metadata.trackType === 'Song' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: file.metadata.trackType === 'Idea' ? '#facc15' : file.metadata.trackType === 'Song' ? '#f472b6' : '#60a5fa',
                            border: `1px solid ${file.metadata.trackType === 'Idea' ? 'rgba(234, 179, 8, 0.3)' : file.metadata.trackType === 'Song' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {['Beat', 'Song', 'Idea'].map(t => (
                            <option key={t} value={t} style={{ background: '#1e1e24', color: '#f3f4f6' }}>{t}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <span>{file.originalPath}</span>
                    )}
                  </div>
                </div>
                <div className="status-indicator" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {file.status === 'processing' && <><RefreshCw size={16} className="animate-spin" /> Processing...</>}
                  {file.status === 'done' && <><CheckCircle size={16} /> Ready</>}
                  {file.status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={file.error}>
                      <AlertCircle size={16} /> Failed
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.error}
                      </span>
                    </div>
                  )}
                  {file.status === 'review' && <span style={{ color: 'var(--warning)' }}>Review</span>}
                  
                  {file.status !== 'processing' && editingId !== file.id && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {file.status === 'review' && (
                        <button 
                          className="btn" 
                          style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--accent-primary)', color: 'white', border: 'none' }} 
                          onClick={() => handleKeepAlternate(file)}
                        >
                          Keep as Alt
                        </button>
                      )}
                      {file.status === 'staged' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleUnstage(file)}>Unstage</button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleEditStart(file)}>Edit Data</button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--danger)' }} onClick={() => handleDelete(file)}>Trash Disk File</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {filteredFiles.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                No files to display in this view.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showSideVault && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 440, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{ 
              flexShrink: 0, 
              borderLeft: '1px solid var(--border-color)', 
              background: '#090a0c',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{ width: '440px', height: '100%', overflow: 'hidden' }}>
              <AudioVaultSearch 
                compact={true}
                onSendToOrganizer={handleImportPaths} 
                onPlayTrack={onPlayTrack}
                activeTrackId={activeTrackId || undefined}
                isScanning={isScanning}
                scanStatus={scanStatus}
                foundCount={foundCount}
                onStartScan={onStartScan}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      

    </div>
  );
}

export default FileOrganizer;
