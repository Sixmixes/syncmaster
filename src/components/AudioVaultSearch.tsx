import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Database, Disc, Play, Pause, Loader2, Zap, FolderOpen, FileSymlink, FolderSearch, CheckSquare, Square, Trash2, Mic, ShieldCheck, Sparkles, AlertTriangle, Folder, Check, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioResult {
    id: number;
    filepath: string;
    filename: string;
    extension: string;
    filesize: number;
    genre?: string;
    bpm?: number;
    key?: string;
    has_vocals?: number;
}

export const AudioVaultSearch: React.FC<{ 
    onSendToOrganizer?: (filePaths: string[]) => void;
    onPlayTrack?: (track: { filepath: string; filename: string; id: string | number }) => void;
    activeTrackId?: string | number;
    isScanning: boolean;
    scanStatus: string;
    foundCount: number;
    onStartScan: () => void;
    compact?: boolean;
}> = ({ onSendToOrganizer, onPlayTrack, activeTrackId, isScanning, scanStatus, foundCount, onStartScan, compact = false }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AudioResult[]>([]);
    
    // Selection States
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

    // Multi-Module Phase 3 Inspector Tracking
    const [selectedFile, setSelectedFile] = useState<AudioResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [quickFilter, setQuickFilter] = useState<'all' | 'wav' | 'mp3' | 'analyzed' | 'vocals'>('all');

    // Acapella Harvester Integration
    const [showHarvester, setShowHarvester] = useState(false);
    const [harvestTarget, setHarvestTarget] = useState('');
    const [discoveredAcapellas, setDiscoveredAcapellas] = useState<AudioResult[]>([]);
    const [isHarvesting, setIsHarvesting] = useState(false);
    const [harvestMode, setHarvestMode] = useState<'copy' | 'move'>('copy');
    const [harvestGroupByGenre, setHarvestGroupByGenre] = useState(true);
    const [harvestProgress, setHarvestProgress] = useState({ current: 0, total: 0, statusText: '', done: false });

    const [totalMatches, setTotalMatches] = useState(0);

    const performSearch = useCallback(async (q: string) => {
        if (!window.api?.dbSearch) return;
        const response = await window.api.dbSearch(q);
        if (response && Array.isArray(response.results)) {
            setResults(response.results);
            setTotalMatches(response.totalCount || 0);
            // Retain selection only for existing items, or clear
            setSelectedIds(new Set());
            setLastClickedIndex(null);
        }
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            performSearch(query);
        }, 300);
        return () => clearTimeout(debounce);
    }, [query, performSearch]);

    // When scan completes in background, instantly populate new entries
    useEffect(() => {
        if (!isScanning) {
            performSearch(query);
        }
    }, [isScanning, performSearch, query]);

    const filteredResults = results.filter(file => {
        if (quickFilter === 'wav') return file.extension.toLowerCase().includes('wav');
        if (quickFilter === 'mp3') return file.extension.toLowerCase().includes('mp3');
        if (quickFilter === 'analyzed') return !!(file.bpm || file.key);
        if (quickFilter === 'vocals') return file.has_vocals === 1 || /vocal|acapella/i.test(file.filename);
        return true;
    });

    const handleAnalyzeFile = async () => {
        if (!selectedFile || !window.api?.analyzeVaultFile) return;
        setIsAnalyzing(true);
        try {
            const result = await window.api.analyzeVaultFile(selectedFile.id, selectedFile.filepath);
            if (result.success) {
                const updated = { 
                    ...selectedFile, 
                    bpm: result.data.bpm, 
                    key: result.data.key, 
                    genre: result.data.genre, 
                    has_vocals: result.data.has_vocals ? 1 : 0 
                };
                setSelectedFile(updated);
                setResults(prev => prev.map(item => item.id === selectedFile.id ? updated : item));
            } else {
                alert(`Analysis error: ${result.error}`);
            }
        } catch (e: any) {
            alert(`Analytical Pipeline Failure: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStartScan = () => {
        // Trigger global background worker dispatched from App container
        onStartScan();
    };

    // Ctrl/Shift Keyboard Selection Engine
    const handleRowClick = (e: React.MouseEvent, file: AudioResult, index: number) => {
        // Prevent trigger if they click the Play button or individual button
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        const newSelection = new Set(selectedIds);

        if (e.shiftKey && lastClickedIndex !== null) {
            // Shift multi-select range calculation
            const start = Math.min(lastClickedIndex, index);
            const end = Math.max(lastClickedIndex, index);
            
            // Clear previous selection if not holding ctrl
            if (!e.ctrlKey && !e.metaKey) {
                newSelection.clear();
            }

            for (let i = start; i <= end; i++) {
                newSelection.add(results[i].id);
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Ctrl individual toggle
            if (newSelection.has(file.id)) {
                newSelection.delete(file.id);
            } else {
                newSelection.add(file.id);
            }
            setLastClickedIndex(index);
        } else {
            // Standard single click (wipes previous unless already selected)
            newSelection.clear();
            newSelection.add(file.id);
            setLastClickedIndex(index);
        }

        setSelectedIds(newSelection);
        
        // Bind selection for inspector view
        if (newSelection.has(file.id)) {
            setSelectedFile(file);
        } else if (newSelection.size > 0) {
            // Find another selected object to display
            const nextId = Array.from(newSelection)[newSelection.size - 1];
            const nextFile = results.find(r => r.id === nextId);
            if (nextFile) setSelectedFile(nextFile);
        } else {
            setSelectedFile(null);
        }
    };

    const handleTogglePlay = (file: AudioResult) => {
        if (onPlayTrack) {
            onPlayTrack({
                filepath: file.filepath,
                filename: file.filename,
                id: file.id
            });
        }
    };

    const handleSendSelected = () => {
        if (!onSendToOrganizer || selectedIds.size === 0) return;
        
        const selectedPaths = results
            .filter(r => selectedIds.has(r.id))
            .map(r => r.filepath);
            
        onSendToOrganizer(selectedPaths);
        // Clear selection upon success
        setSelectedIds(new Set());
    };

    const handleOpenHarvester = async () => {
        if (!window.api?.findAcapellas) return;
        setShowHarvester(true);
        setIsHarvesting(false);
        setHarvestProgress({ current: 0, total: 0, statusText: 'Searching indexing layer...', done: false });
        
        try {
            const acapellas = await window.api.findAcapellas();
            if (Array.isArray(acapellas)) {
                setDiscoveredAcapellas(acapellas);
            }
            setHarvestProgress(p => ({ ...p, statusText: '' }));
        } catch (err) {
            console.error("Failed to discover acapellas:", err);
        }
    };

    const handleSelectHarvestTarget = async () => {
        if (!window.api?.selectDirectory) return;
        const folder = await window.api.selectDirectory();
        if (folder) {
            setHarvestTarget(folder);
        }
    };

    const executeHarvest = async () => {
        if (!harvestTarget || discoveredAcapellas.length === 0 || !window.api?.harvestAcapellas) return;
        
        setIsHarvesting(true);
        setHarvestProgress({ 
            current: 0, 
            total: discoveredAcapellas.length, 
            statusText: `Staging transfer of ${discoveredAcapellas.length} tracks...`, 
            done: false 
        });

        try {
            // Call backend processor to handle multi-device copying and exclusions safely
            const result = await window.api.harvestAcapellas(discoveredAcapellas, harvestTarget, {
                mode: harvestMode,
                groupByGenre: harvestGroupByGenre
            });

            if (result.success) {
                setHarvestProgress({
                    current: discoveredAcapellas.length,
                    total: discoveredAcapellas.length,
                    statusText: `Successfully harvested ${result.results.filter((r: any) => r.success).length} Acapellas to destination!`,
                    done: true
                });
            } else {
                setHarvestProgress(p => ({ ...p, statusText: `Error: ${result.error}` }));
            }
        } catch (err: any) {
            setHarvestProgress(p => ({ ...p, statusText: `System Failure: ${err.message}` }));
        } finally {
            setIsHarvesting(false);
        }
    };

    return (
        <div style={{ padding: compact ? '12px' : '24px', height: '100%', display: 'flex', flexDirection: 'column', background: compact ? 'rgba(0, 0, 0, 0.2)' : 'var(--bg-main)', userSelect: 'none' }}>
            {compact ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database className="text-gradient" size={18} />
                        <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', color: '#fff' }}>SIDE VAULT</span>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleSendSelected}
                            className="btn btn-primary"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '6px 10px',
                                fontSize: '11px',
                                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                                border: 'none',
                            }}
                        >
                            <FileSymlink size={12} />
                            <span>Load ({selectedIds.size})</span>
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Database className="text-gradient" size={28} /> Audio Vault
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Everything-style explorer. Hold Shift/Ctrl to select multiple tracks to batch load.</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedIds.size > 0 && (
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={handleSendSelected}
                                className="btn btn-primary"
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    padding: '12px 20px',
                                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
                                }}
                            >
                                <FileSymlink size={18} />
                                <span style={{ fontWeight: 700 }}>Load {selectedIds.size} Tracks to Organizer</span>
                            </motion.button>
                        )}
                        
                        <button 
                            onClick={handleOpenHarvester}
                            disabled={isScanning}
                            className="btn btn-secondary"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                padding: '12px 20px',
                                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(190, 24, 93, 0.1) 100%)',
                                border: '1px solid rgba(236, 72, 153, 0.4)',
                                boxShadow: '0 0 15px rgba(236, 72, 153, 0.15)',
                                color: '#f472b6'
                            }}
                        >
                            <Mic size={18} />
                            <span style={{ fontWeight: 600 }}>Harvest Acapellas</span>
                        </button>

                        <button 
                            onClick={handleStartScan} 
                            disabled={isScanning}
                            className="btn btn-secondary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px' }}
                        >
                            {isScanning ? <Loader2 className="animate-spin" size={18} /> : <FolderSearch size={18} />}
                            <span style={{ fontWeight: 600 }}>{isScanning ? 'Indexing System...' : 'Target & Index Folder'}</span>
                        </button>
                    </div>
                </div>
            )}

            {isScanning && !compact && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                        padding: '20px', 
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(88, 28, 135, 0.1) 100%)', 
                        border: '1px solid rgba(168, 85, 247, 0.3)', 
                        borderRadius: '10px', 
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#c084fc' }} className="animate-spin"></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em', color: '#fff' }}>LIVE DATA CRAWLER ACTIVE</div>
                        <div style={{ fontSize: '13px', color: '#c084fc', fontWeight: 500, marginTop: '2px' }}>{scanStatus}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '6px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                        {foundCount}
                    </div>
                </motion.div>
            )}

            {isScanning && compact && (
                <div style={{ fontSize: '11px', color: '#c084fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={12} className="animate-spin" /> Indexing in Background ({foundCount} files found)
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: compact ? '12px' : '24px', flexShrink: 0 }}>
                <Search style={{ position: 'absolute', left: compact ? '12px' : '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={compact ? 16 : 20} />
                <input 
                    type="text" 
                    placeholder={compact ? "Search Vault..." : "Instant Search (Filename, Artist, Genre, Extension like .wav)..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: compact ? '8px' : '12px',
                        padding: compact ? '10px 12px 10px 36px' : '16px 16px 16px 52px',
                        color: '#fff',
                        fontSize: compact ? '13px' : '16px',
                        fontWeight: 500,
                        outline: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                />
            </div>

            {/* Quick Filter Capsule Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexShrink: 0, overflowX: 'auto', paddingBottom: '4px' }} className="custom-scroll-hide">
                {[
                    { id: 'all', label: 'All Files', count: results.length },
                    { id: 'wav', label: '.WAV', count: results.filter(r => r.extension.toLowerCase().includes('wav')).length },
                    { id: 'mp3', label: '.MP3', count: results.filter(r => r.extension.toLowerCase().includes('mp3')).length },
                    { id: 'analyzed', label: '⚡ Smart Analyzed', count: results.filter(r => !!(r.bpm || r.key)).length },
                    { id: 'vocals', label: '🎙️ Vocals Detected', count: results.filter(r => r.has_vocals === 1 || /vocal|acapella/i.test(r.filename)).length },
                ].map(filter => (
                    filter.count > 0 || filter.id === 'all' ? (
                        <button
                            key={filter.id}
                            onClick={() => setQuickFilter(filter.id as any)}
                            style={{
                                background: quickFilter === filter.id ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${quickFilter === filter.id ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                                color: quickFilter === filter.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                padding: '8px 16px',
                                borderRadius: '30px',
                                fontSize: '12px',
                                fontWeight: quickFilter === filter.id ? 700 : 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                            className="nav-hover"
                        >
                            {filter.label}
                            <span style={{ 
                                fontSize: '10px', 
                                background: quickFilter === filter.id ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.06)', 
                                color: quickFilter === filter.id ? '#fff' : 'var(--text-secondary)',
                                padding: '2px 8px', 
                                borderRadius: '12px',
                                fontWeight: 700
                            }}>{filter.count}</span>
                        </button>
                    ) : null
                ))}
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '20px' }}>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column' }} className="custom-scroll">
                    {filteredResults.length === 0 ? (
                        <div style={{ 
                            padding: '80px 40px', 
                            textAlign: 'center', 
                            color: 'var(--text-secondary)', 
                            background: 'rgba(255,255,255,0.01)', 
                            borderRadius: '12px', 
                            border: '1px dashed rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px'
                        }}>
                            <Disc size={48} style={{ opacity: 0.2 }} />
                            <div>
                                <p style={{ fontSize: '16px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
                                    {query || quickFilter !== 'all' ? 'No matching results found.' : 'Your Audio Vault is currently empty.'}
                                </p>
                                <p style={{ fontSize: '13px' }}>
                                    {query || quickFilter !== 'all' ? 'Try adjusting your search keyword or active filters.' : 'Click "Target & Index Folder" above to populate the database.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {filteredResults.map((file, idx) => {
                                const isSelected = selectedIds.has(file.id);
                                return (
                                    <div 
                                        key={file.id} 
                                        onClick={(e) => handleRowClick(e, file, idx)}
                                        style={{ 
                                            padding: compact ? '8px 12px' : '12px 16px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: compact ? '10px' : '16px', 
                                            background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)', 
                                            border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.04)'}`,
                                            borderRadius: '8px',
                                            transition: 'all 0.15s ease',
                                            cursor: 'pointer'
                                        }}
                                        className="nav-hover"
                                    >
                                        {/* Select Checkbox Status */}
                                        <div style={{ color: isSelected ? '#c084fc' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', opacity: isSelected ? 1 : 0.4 }}>
                                            {isSelected ? <CheckSquare size={compact ? 15 : 18} /> : <Square size={compact ? 15 : 18} />}
                                        </div>

                                        {/* Play Button */}
                                        <button 
                                            onClick={() => handleTogglePlay(file)}
                                            style={{ 
                                                background: activeTrackId === file.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                                color: activeTrackId === file.id ? '#000' : '#fff',
                                                width: compact ? '28px' : '36px', 
                                                height: compact ? '28px' : '36px', 
                                                borderRadius: '50%', 
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                flexShrink: 0
                                            }}
                                        >
                                            {activeTrackId === file.id ? <Pause size={compact ? 12 : 16} fill="currentColor" /> : <Play size={compact ? 12 : 16} style={{ marginLeft: '2px' }} fill="currentColor" />}
                                        </button>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: compact ? '12px' : '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {file.filename}
                                            </div>
                                            {compact ? (
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                                    {file.bpm && <span style={{ color: 'var(--accent-primary)', fontSize: '10px', fontWeight: 800 }}>{Math.round(file.bpm)}</span>}
                                                    {file.key && <span style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 800 }}>{file.key}</span>}
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '9px', opacity: 0.5 }}>{file.extension.toUpperCase()}</span>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {file.filepath}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '4px' : '8px', flexShrink: 0 }}>
                                            {!compact && (
                                                <>
                                                    {file.bpm && (
                                                        <span className="meta-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '11px' }}>{Math.round(file.bpm)} BPM</span>
                                                    )}
                                                    {file.key && (
                                                        <span className="meta-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontWeight: 800, fontSize: '11px' }}>{file.key}</span>
                                                    )}
                                                    <span className="meta-badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '11px' }}>{file.extension.toUpperCase()}</span>
                                                    <span className="meta-badge" style={{ opacity: 0.6, fontSize: '11px' }}>{(file.filesize / (1024 * 1024)).toFixed(1)} MB</span>
                                                </>
                                            )}
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSendToOrganizer && onSendToOrganizer([file.filepath]);
                                                }}
                                                className="btn btn-secondary"
                                                title="Load track to Staging"
                                                style={{ 
                                                    padding: compact ? '6px' : '6px 10px', 
                                                    fontSize: '11px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderColor: 'rgba(255,255,255,0.1)',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                <FileSymlink size={13} />
                                                {!compact && " Load"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Phase 3 Slide-Out Inspector */}
                <AnimatePresence mode="wait">
                    {selectedFile && !compact && (
                        <motion.div
                            initial={{ x: 60, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 60, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            style={{
                                width: '350px',
                                background: 'rgba(15, 16, 21, 0.75)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflowY: 'auto',
                                height: '100%',
                                flexShrink: 0,
                                padding: '24px',
                                gap: '20px'
                            }}
                            className="custom-scroll"
                        >
                            {/* Inspector Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={15} /> Metadata Inspector
                                </h3>
                                <button 
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setSelectedIds(new Set());
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: '4px' }}
                                    className="nav-hover"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Animated Vinyl Record Art Deck */}
                            <div style={{ 
                                width: '100%', 
                                aspectRatio: '1.6',
                                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(15, 16, 21, 0.9) 100%)', 
                                border: '1px solid rgba(168, 85, 247, 0.25)', 
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                flexShrink: 0,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                            }}>
                                <div 
                                    style={{ 
                                        width: '120px', 
                                        height: '120px', 
                                        borderRadius: '50%', 
                                        background: 'repeating-radial-gradient(circle, #111 0px, #111 2px, #1e1e1e 4px, #2c2c2c 6px)', 
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                                        transformOrigin: 'center'
                                    }}
                                    className={activeTrackId === selectedFile.id ? "animate-spin-slow" : ""}
                                >
                                    {/* Vinyl Label Core */}
                                    <div style={{ 
                                        width: '42px', 
                                        height: '42px', 
                                        borderRadius: '50%', 
                                        background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        border: '3px solid #111',
                                        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)'
                                    }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111' }} />
                                    </div>
                                </div>
                                <Disc size={24} style={{ position: 'absolute', bottom: '12px', right: '12px', color: 'rgba(168, 85, 247, 0.4)' }} />
                            </div>

                            {/* Header Info Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.4, wordBreak: 'break-all' }}>
                                    {selectedFile.filename}
                                </div>
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: 'var(--text-secondary)', 
                                    wordBreak: 'break-all', 
                                    background: 'rgba(0,0,0,0.3)', 
                                    padding: '10px', 
                                    borderRadius: '8px', 
                                    fontFamily: 'monospace', 
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    userSelect: 'text',
                                    maxHeight: '80px',
                                    overflowY: 'auto'
                                }} className="custom-scroll">
                                    {selectedFile.filepath}
                                </div>
                            </div>

                            {/* Analytical Matrix Display */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={12} /> DSP AI Assessment
                                </div>

                                {selectedFile.bpm || selectedFile.key ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div style={{ 
                                                background: 'rgba(168, 85, 247, 0.1)', 
                                                border: '1px solid rgba(168, 85, 247, 0.25)', 
                                                padding: '14px 10px', 
                                                borderRadius: '12px', 
                                                textAlign: 'center',
                                                boxShadow: 'inset 0 0 10px rgba(168,85,247,0.05)'
                                            }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>TEMPO ESTIMATE</div>
                                                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
                                                    {Math.round(selectedFile.bpm || 0)} <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 600 }}>BPM</span>
                                                </div>
                                            </div>
                                            <div style={{ 
                                                background: 'rgba(56, 189, 248, 0.1)', 
                                                border: '1px solid rgba(56, 189, 248, 0.25)', 
                                                padding: '14px 10px', 
                                                borderRadius: '12px', 
                                                textAlign: 'center',
                                                boxShadow: 'inset 0 0 10px rgba(56,189,248,0.05)'
                                            }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>TONAL KEY</div>
                                                <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em' }}>
                                                    {selectedFile.key || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Detected Subgenre</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedFile.genre || 'Unclassified'}</span>
                                            </div>

                                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Spectral Variance</span>
                                                {selectedFile.has_vocals === 1 ? (
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Mic size={13} /> Vocals Identified
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        Instrumental
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleAnalyzeFile}
                                            disabled={isAnalyzing}
                                            style={{ 
                                                marginTop: '6px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '8px', 
                                                padding: '12px', 
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.08)', 
                                                borderRadius: '10px', 
                                                color: 'var(--text-secondary)', 
                                                fontSize: '12px', 
                                                fontWeight: 600, 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            className="nav-hover"
                                        >
                                            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={13} />}
                                            {isAnalyzing ? 'Analyzing...' : 'Re-Scan Signal Matrix'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)', 
                                        border: '1px dashed rgba(255,255,255,0.12)', 
                                        borderRadius: '12px', 
                                        padding: '24px 20px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        gap: '16px', 
                                        textAlign: 'center' 
                                    }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
                                            Run deep spectral/harmonic DSP tracking to parse accurate BPM, root Key, and subgenre.
                                        </div>
                                        <button 
                                            onClick={handleAnalyzeFile}
                                            disabled={isAnalyzing}
                                            style={{ 
                                                width: '100%',
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '10px', 
                                                padding: '14px', 
                                                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
                                                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.35)',
                                                border: 'none', 
                                                borderRadius: '10px', 
                                                color: '#fff', 
                                                fontSize: '13px', 
                                                fontWeight: 800, 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            className="nav-hover"
                                        >
                                            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
                                            {isAnalyzing ? 'Running Neural Matrix...' : 'Analyze Signal Data'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Final Actions Footer Block */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '12px', flexShrink: 0 }}>
                                <button 
                                    onClick={() => {
                                        handleTogglePlay(selectedFile);
                                    }}
                                    style={{ 
                                        width: '100%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px', 
                                        padding: '12px', 
                                        background: activeTrackId === selectedFile.id ? 'rgba(168, 85, 247, 0.1)' : 'transparent', 
                                        border: `1px solid ${activeTrackId === selectedFile.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`, 
                                        borderRadius: '10px', 
                                        color: activeTrackId === selectedFile.id ? 'var(--accent-primary)' : '#fff', 
                                        fontSize: '13px', 
                                        fontWeight: 700, 
                                        cursor: 'pointer' 
                                    }}
                                    className="nav-hover"
                                >
                                    {activeTrackId === selectedFile.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                    {activeTrackId === selectedFile.id ? 'Audition Running...' : 'Audition Playback'}
                                </button>
                                <button 
                                    onClick={() => onSendToOrganizer && onSendToOrganizer([selectedFile.filepath])}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                    className="nav-hover"
                                >
                                    <FileSymlink size={14} /> Load into Organizer
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sleek Everything-style Status Bar Footer */}
            <div style={{ 
                marginTop: '16px', 
                paddingTop: '12px', 
                borderTop: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                color: 'var(--text-secondary)', 
                fontSize: '12px',
                fontWeight: 500,
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={14} style={{ opacity: 0.6 }} />
                    <span>{filteredResults.length.toLocaleString()}{filteredResults.length !== totalMatches ? ` of ${totalMatches.toLocaleString()}` : ''} object{filteredResults.length !== 1 ? 's' : ''}</span>
                    {selectedIds.size > 0 && (
                        <>
                            <span style={{ opacity: 0.3 }}>|</span>
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedIds.size} selected</span>
                        </>
                    )}
                </div>
                <div style={{ opacity: 0.6 }}>
                    {totalMatches > 500 ? `Display limited to first 500 matches` : `Live File System Index`}
                </div>
            </div>

            <AnimatePresence>
                {showHarvester && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000,
                            padding: '24px'
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            style={{
                                width: '100%',
                                maxWidth: '550px',
                                background: 'linear-gradient(145deg, #161920 0%, #0e1015 100%)',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(236, 72, 153, 0.1)',
                                borderRadius: '16px',
                                padding: '28px',
                                position: 'relative',
                                color: '#fff'
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#f472b6' }}>
                                        <Sparkles size={20} /> Smart Acapella Harvester
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Sweeps local drives and gathers isolated vocal stems.</p>
                                </div>
                                <button 
                                    onClick={() => setShowHarvester(false)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Discovery Status */}
                            <div style={{ 
                                padding: '16px', 
                                background: 'rgba(236, 72, 153, 0.05)', 
                                border: '1px solid rgba(236, 72, 153, 0.15)', 
                                borderRadius: '8px', 
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px'
                            }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6', flexShrink: 0 }}>
                                    <Mic size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#f472b6', fontWeight: 700, letterSpacing: '0.05em' }}>INDEXED VOCALS DETECTED</div>
                                    <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
                                        {discoveredAcapellas.length} Tracks Found
                                    </div>
                                </div>
                            </div>

                            {/* Safeguard Notice */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                padding: '10px 14px', 
                                background: 'rgba(16, 185, 129, 0.08)', 
                                border: '1px solid rgba(16, 185, 129, 0.2)', 
                                borderRadius: '8px', 
                                fontSize: '12px', 
                                color: '#34d399',
                                marginBottom: '24px' 
                            }}>
                                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                                <div>
                                    <strong>Studio One Protections Active:</strong> Audio inside DAW project paths is strictly locked to prevent sequence broken-link errors.
                                </div>
                            </div>

                            {!harvestProgress.done ? (
                                <>
                                    {/* Target Directory Config */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>HARVEST DESTINATION FOLDER</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={harvestTarget} 
                                                placeholder="Click Browse to select target path..." 
                                                style={{
                                                    flex: 1,
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '6px',
                                                    padding: '10px 12px',
                                                    color: '#fff',
                                                    fontSize: '13px'
                                                }}
                                            />
                                            <button 
                                                onClick={handleSelectHarvestTarget}
                                                className="btn btn-secondary"
                                                style={{ fontSize: '12px', padding: '0 16px' }}
                                            >
                                                Browse...
                                            </button>
                                        </div>
                                    </div>

                                    {/* Extra configs */}
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TRANSFER MODE</label>
                                            <select 
                                                value={harvestMode} 
                                                onChange={(e: any) => setHarvestMode(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    background: 'var(--bg-dark)', 
                                                    border: '1px solid rgba(255,255,255,0.1)', 
                                                    color: '#fff', 
                                                    padding: '10px', 
                                                    borderRadius: '6px',
                                                    fontSize: '13px' 
                                                }}
                                            >
                                                <option value="copy">Safely Copy (Keep Originals)</option>
                                                <option value="move">Safe Move (Clean drive & relocate)</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                                            <label style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '10px', 
                                                cursor: 'pointer', 
                                                padding: '10px 12px', 
                                                background: 'rgba(255,255,255,0.02)', 
                                                border: '1px solid rgba(255,255,255,0.05)', 
                                                borderRadius: '6px',
                                                width: '100%'
                                            }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={harvestGroupByGenre} 
                                                    onChange={() => setHarvestGroupByGenre(!harvestGroupByGenre)}
                                                    style={{ accentColor: '#f472b6', width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '12px', fontWeight: 500 }}>Automatically group by Genre folder</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Run Process */}
                                    <button 
                                        onClick={executeHarvest}
                                        disabled={isHarvesting || !harvestTarget || discoveredAcapellas.length === 0}
                                        className="btn"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '10px',
                                            opacity: (!harvestTarget || discoveredAcapellas.length === 0 || isHarvesting) ? 0.5 : 1
                                        }}
                                    >
                                        {isHarvesting ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
                                        {isHarvesting ? 'RUNNING DEEP HARVEST CRAWL...' : 'EXECUTE SMART HARVEST PROCESS'}
                                    </button>
                                    
                                    {harvestProgress.statusText && (
                                        <div style={{ fontSize: '12px', color: '#f472b6', textAlign: 'center', marginTop: '12px', fontWeight: 600 }}>
                                            {harvestProgress.statusText}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                        <Check size={32} />
                                    </div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Harvest Cycle Completed!</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px auto 24px auto', maxWidth: '350px' }}>
                                        {harvestProgress.statusText}
                                    </p>
                                    <button 
                                        onClick={() => setShowHarvester(false)}
                                        className="btn btn-secondary"
                                        style={{ margin: '0 auto', padding: '10px 24px' }}
                                    >
                                        Return to Vault
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
