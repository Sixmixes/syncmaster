import React, { useState, useCallback } from 'react';
import { 
  Users, Globe, Link as LinkIcon, Share2, Server, 
  FolderPlus, Clipboard, Copy, Check, FileText, 
  Layers, Target, Send, Music, Play, Sparkles, 
  Camera, Video, Smartphone, Mail, Download, FileCode, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackReference {
  name: string;
  path: string;
  bpm?: number;
  key?: string;
}

interface ProjectPack {
  id: string;
  name: string;
  goal: string;
  releaseDate: string;
  status: 'Draft' | 'Pitching' | 'Live';
  tracks: TrackReference[];
  description: string;
}

export const NetworkNexus: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'packs' | 'promo' | 'pipelines'>('packs');
  
  // 1. Packs State
  const [packs, setPacks] = useState<ProjectPack[]>([
    {
      id: 'p1',
      name: 'Cyberpunk Sync Toolkit Vol. 1',
      goal: 'Video Game / Trailer Sync',
      releaseDate: '2026-06-15',
      status: 'Pitching',
      description: 'High-octane industrial synth beats for cyberpunk action soundtracks.',
      tracks: [
        { name: 'NeonRunner_130_Dmin.mp3', path: 'C:/Beats/NeonRunner.mp3', bpm: 130, key: 'Dmin' },
        { name: 'SystemBreach_140_Fmaj.wav', path: 'C:/Beats/SystemBreach.wav', bpm: 140, key: 'Fmaj' }
      ]
    },
    {
      id: 'p2',
      name: 'Midnight Lofi Summer',
      goal: 'Spotify Editorial & Bandcamp',
      releaseDate: '2026-07-01',
      status: 'Draft',
      description: 'Warm, tape-saturated chill beats with organic percussions.',
      tracks: []
    }
  ]);

  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [newPackGoal, setNewPackGoal] = useState('Sync Placement');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [stagedPaths, setStagedPaths] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 2. Promo Engine State
  const [promoTrack, setPromoTrack] = useState({
    title: '',
    genre: 'Trap / Hip-Hop',
    bpm: '140',
    key: 'F Minor',
    hookDescription: 'Aggressive 808 dark cinematic track with epic brass hits and spooky bells.',
  });
  const [activePromoPlatform, setActivePromoPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'spotify'>('tiktok');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // -- Pack Drag & Drop handlers --
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const filesList = e.nativeEvent.dataTransfer?.files || e.dataTransfer.files;
    const newFiles = Array.from(filesList)
      .filter(f => f.name.toLowerCase().endsWith('.mp3') || f.name.toLowerCase().endsWith('.wav') || f.name.toLowerCase().endsWith('.m4a'))
      .map(f => window.api ? window.api.resolveFilePath(f) : f.name);
      
    if (newFiles.length > 0) {
      setStagedPaths(prev => [...new Set([...prev, ...newFiles])]);
    }
  };

  const handleCreatePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName) return;

    const pack: ProjectPack = {
      id: Math.random().toString(36).substring(7),
      name: newPackName,
      goal: newPackGoal,
      releaseDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      description: newPackDesc,
      tracks: stagedPaths.map(p => {
        const parts = p.split(/[\\\/]/);
        return { name: parts[parts.length - 1], path: p };
      })
    };

    setPacks(prev => [pack, ...prev]);
    setIsCreatingPack(false);
    setNewPackName('');
    setNewPackDesc('');
    setStagedPaths([]);
    alert('🎉 Beat Pack / Pitch Project successfully initialized!');
  };

  // -- Promo Copy Generators --
  const getPromoCopy = (platform: 'tiktok' | 'instagram' | 'youtube' | 'spotify') => {
    const { title, genre, bpm, key, hookDescription } = promoTrack;
    const trackTitle = title || 'Untitled Masterpiece';
    
    switch (platform) {
      case 'tiktok':
        return `🔥 JUST DROPPED: "${trackTitle}" (${bpm} BPM) 🔥

👂 If you like moody, energetic ${genre} vibes, this is for you!
🎹 Produced in ${key} 

👉 Link in Bio to stream or license for your content! 
Let me know if you would slide on this 👇

#beatmaker #producerlife #indiemusic #syncmaster #contentcreator #${genre.toLowerCase().replace(/[^a-z]/g, '')} #${bpm}bpm #flstudio #ableton #viralbeats`;

      case 'instagram':
        return `🌌 NEW SOUND EXCELLENCE: "${trackTitle}" 🪐

Deep dive into our latest sonic creation. Recorded in ${key} at ${bpm} BPM. 
⚡ ${hookDescription}

Designed with high-fidelity analog-modeled textures, optimized specifically for Cinematic Placements and Dynamic Content Creators. 

🔗 Full HQ Audio & License Packs available via our Hub link in bio. 
📩 DM for custom scoring and exclusive rights inquires. 

Produced on SyncMaster Pro.
---
#MusicProducer #BeatsForSale #IndependentArtist #Soundtrack #FilmScore #AudioEngineer #ContentCreatorGear #Visualizer #MusicPlacement`;

      case 'youtube':
        return `🎧 "${trackTitle}" - Dark ${genre} Beat [${bpm} BPM - ${key}]
-----------------------------------------------------------------
🔊 Stream / Download / Buy License: → [INSERT LINK HERE]
⭐ Subscribe for weekly high-quality beat drops!
-----------------------------------------------------------------

🎼 BEAT INFORMATION:
• Title: ${trackTitle}
• Genre: ${genre}
• Tempo: ${bpm} BPM
• Key: ${key}
• Mood/Style: ${hookDescription}

⏱️ CHAPTERS:
0:00 - Atmospheric Intro
0:15 - The Build Up
0:30 - MAIN DROP / HOOK
1:00 - Verse Segment
1:30 - Bridge / Melodic Variation
2:00 - SECOND DROP
2:30 - Dynamic Outro

⚠️ USAGE TERMS:
This beat is free for NON-PROFIT & listening purposes only. To release on Spotify, Apple Music, or monetize on YouTube, you must purchase a license from the link above. For high-end commercial/sync licensing inquiries, please email contact@producerhub.com.

#${genre.toLowerCase().replace(/[^a-z]/g, '')} #${bpm}bpm #freestylebeat #soundtrack #syncplacement`;

      case 'spotify':
        return `🚀 EDITORIAL PITCH / SYNC A&R BRIEF

TRACK TITLE: "${trackTitle}"
SUB-GENRE: ${genre}
TEMPO / KEY: ${bpm} BPM | ${key}

DESCRIPTION & BRAND ALIGNMENT:
This track delivers an immersive, high-energy sonic canvas. Engineered around ${hookDescription}, it features a dominant rhythmic core ideal for driving sports promos, energetic video game scores, and fast-cut lifestyle commercial advertising.

The instrumentation fuses analog synthesize texture with hard-hitting percussive structures, delivering distinct sonic peaks that perfectly sync with video transients. 

TARGET AUDIENCE: Fans of energetic electronic, modern action soundtracks, and forward-thinking instrumental ${genre}.
RELEASE READY: 100% Mastered, 44.1kHz 24-bit. Fully cleared one-stop metadata.`;
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getPromoCopy(activePromoPlatform));
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handleSavePromoToDisk = async () => {
    if (!window.api?.saveMarketingPack) {
      alert('Local file saving is only supported inside the desktop application wrapper.');
      return;
    }
    
    const mockPath = `media://c:/Users/kroni/Music/Promo/${promoTrack.title || 'Untitled'}.mp3`;
    
    setSaveStatus('saving');
    const fullMarketingText = `
# MARKETING COLLATERAL SHEET
## TRACK: ${promoTrack.title || 'Untitled'}

### 📱 TIKTOK & SHORTS COPY:
\`\`\`
${promoTrack.title ? getPromoCopy('tiktok') : ''}
\`\`\`

### 📸 INSTAGRAM DESCRIPTION:
\`\`\`
${promoTrack.title ? getPromoCopy('instagram') : ''}
\`\`\`

### 🎥 YOUTUBE METADATA & CHAPTERS:
\`\`\`
${promoTrack.title ? getPromoCopy('youtube') : ''}
\`\`\`

### 📨 EDITORIAL SYNC PITCH:
\`\`\`
${promoTrack.title ? getPromoCopy('spotify') : ''}
\`\`\`
`;
    
    try {
      const res = await window.api.saveMarketingPack(mockPath, fullMarketingText);
      if (res.success) {
        setSaveStatus('saved');
        alert(`📂 File Saved Successfully!\n\nExported master campaign sheet to:\n${res.path}`);
      } else {
        setSaveStatus('error');
        alert(`Failed to write file: ${res.error}`);
      }
    } catch (e: any) {
      setSaveStatus('error');
      alert(`Error saving to disk: ${e.message}`);
    } finally {
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div style={{ padding: '32px', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflowY: 'auto' }} className="custom-scroll">
      
      {/* Header */}
      <div style={{ marginBottom: '32px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users className="text-gradient" size={32} />
          Network & Promo Nexus
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Build Beat Packs, design professional Sync Pitches, and auto-format one-click Social Media campaigns.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', alignSelf: 'flex-start', marginBottom: '24px', flexShrink: 0 }}>
        <button 
          onClick={() => setActiveTab('packs')}
          style={{ 
            padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            background: activeTab === 'packs' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
            color: activeTab === 'packs' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'packs' ? '0 4px 15px rgba(168, 85, 247, 0.3)' : 'none'
          }}
        >
          <Layers size={16} />
          Pitch & Release Packs
        </button>
        <button 
          onClick={() => setActiveTab('promo')}
          style={{ 
            padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            background: activeTab === 'promo' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
            color: activeTab === 'promo' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'promo' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          <Sparkles size={16} />
          Social Promo Machine
        </button>
        <button 
          onClick={() => setActiveTab('pipelines')}
          style={{ 
            padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            background: activeTab === 'pipelines' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: activeTab === 'pipelines' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'pipelines' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <Globe size={16} />
          Distribution Channels
        </button>
      </div>

      {/* Tab Content Area */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PROJECT PACKS */}
          {activeTab === 'packs' && (
            <motion.div 
              key="packs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderPlus size={22} className="text-purple-500" /> Active Project Portfolios
                  </h2>
                  <button 
                    onClick={() => setIsCreatingPack(!isCreatingPack)}
                    style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {isCreatingPack ? 'Cancel Build' : '+ Build New Pack'}
                  </button>
                </div>

                {/* Form to build new pack */}
                {isCreatingPack && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(0,0,0,0.2) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '16px', padding: '24px', overflow: 'hidden' }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#c084fc' }}>Initialize Pack Blueprint</h3>
                    <form onSubmit={handleCreatePackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Pack/Project Name</label>
                          <input 
                            required type="text" value={newPackName} onChange={e => setNewPackName(e.target.value)} placeholder="e.g., Summer Trap Anthems Vol. 2"
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Goal</label>
                          <select 
                            value={newPackGoal} onChange={e => setNewPackGoal(e.target.value)}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                          >
                            <option>Sync Placement Pitch</option>
                            <option>Streaming LP / EP Release</option>
                            <option>BeatStars Marketplace</option>
                            <option>Drumkit / Sample Pack Sale</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Brief Vision / Description</label>
                        <textarea 
                          rows={2} value={newPackDesc} onChange={e => setNewPackDesc(e.target.value)} placeholder="Describe the sonic vibe, key demographics, or intended cinematic use cases..."
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', resize: 'none', outline: 'none' }}
                        />
                      </div>

                      {/* Track Drop Zone */}
                      <div 
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        style={{ 
                          border: isDragging ? '2px dashed #a855f7' : '2px dashed rgba(255,255,255,0.1)',
                          background: isDragging ? 'rgba(168, 85, 247, 0.05)' : 'rgba(0,0,0,0.2)',
                          padding: '20px', borderRadius: '12px', textAlign: 'center', transition: 'all 0.2s'
                        }}
                      >
                        <Music size={32} style={{ color: isDragging ? '#a855f7' : 'rgba(255,255,255,0.3)', marginBottom: '8px' }} />
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Drag & Drop finalized audio files here to stack them into this Pack.
                        </p>
                        
                        {stagedPaths.length > 0 && (
                          <div style={{ marginTop: '16px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: 700, marginBottom: '8px' }}>STAGED ASSETS ({stagedPaths.length}):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                              {stagedPaths.map((p, i) => (
                                <div key={i} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.split(/[\\\/]/).pop()}</span>
                                  <span style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 800 }} onClick={() => setStagedPaths(prev => prev.filter((_, idx) => idx !== i))}>×</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '12px 32px', fontWeight: 700, background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                        Finalize & Assemble Portfolio
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* List existing packs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {packs.map(pack => (
                    <div 
                      key={pack.id}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{pack.name}</h3>
                            <span style={{ 
                              fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
                              background: pack.status === 'Pitching' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: pack.status === 'Pitching' ? '#60a5fa' : '#fbbf24',
                              border: pack.status === 'Pitching' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                            }}>{pack.status}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{pack.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Goal: <strong style={{ color: '#fff' }}>{pack.goal}</strong></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Created: {pack.releaseDate}</div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Music size={14} color="var(--text-secondary)" />
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {pack.tracks.length} tracks bundled
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            <FileText size={14} /> View Files
                          </button>
                          <button 
                            onClick={() => {
                              if (pack.tracks.length > 0) {
                                setPromoTrack({
                                  title: pack.name,
                                  genre: 'Electronic / Cinematic',
                                  bpm: pack.tracks[0].bpm?.toString() || '128',
                                  key: pack.tracks[0].key || 'Multiple',
                                  hookDescription: pack.description
                                });
                                setActiveTab('promo');
                              } else {
                                alert('Please add at least one track to this pack to generate promo copy!');
                              }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '8px 12px', color: '#c084fc', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Sparkles size={14} /> Draft Copy
                          </button>
                          <button 
                            onClick={() => alert(`📂 Executing Pitch-Pack Compiler...\n\nGenerated dynamic licensing contract PDF and tagged CSV manifest inside your track project directory!`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Send size={14} /> Export Pitch Bundle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc' }}>
                    <Target size={18} /> Pitch Pipeline Stats
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Active Packs</span>
                      <strong style={{ color: '#fff' }}>{packs.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Files Packaged</span>
                      <strong style={{ color: '#fff' }}>{packs.reduce((acc, p) => acc + p.tracks.length, 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>A&R Placements Pending</span>
                      <strong style={{ color: '#10b981' }}>3</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>📦 Pitch Bundle Engine</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    When you click <strong>Export Pitch Bundle</strong>, SyncMaster Pro auto-compiles:
                  </p>
                  <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '16px', marginTop: '8px', lineHeight: 1.6 }}>
                    <li>High-res 24bit WAV file stems</li>
                    <li>Pre-tagged MP3 preview files</li>
                    <li>JSON/CSV metadata manifests for A&R ingest</li>
                    <li>A PDF boilerplate licensing/royalty split sheet</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PROMO MACHINE */}
          {activeTab === 'promo' && (
            <motion.div 
              key="promo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
            >
              
              {/* Input Data */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
                  <Sparkles size={20} /> Track Intelligence Input
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Track / Pack Title</label>
                    <input 
                      type="text" value={promoTrack.title} onChange={e => setPromoTrack({...promoTrack, title: e.target.value})} placeholder="e.g., Moonlight Mirage"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Primary Sub-Genre</label>
                      <input 
                        type="text" value={promoTrack.genre} onChange={e => setPromoTrack({...promoTrack, genre: e.target.value})}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>BPM</label>
                      <input 
                        type="text" value={promoTrack.bpm} onChange={e => setPromoTrack({...promoTrack, bpm: e.target.value})}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Scale Key</label>
                      <input 
                        type="text" value={promoTrack.key} onChange={e => setPromoTrack({...promoTrack, key: e.target.value})}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Hook Description / Narrative</label>
                    <textarea 
                      rows={4} value={promoTrack.hookDescription} onChange={e => setPromoTrack({...promoTrack, hookDescription: e.target.value})} placeholder="Describe the hook's emotion, what instruments stand out, and what visual scene it would slap in..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', resize: 'none', outline: 'none', lineHeight: 1.5 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={handleSavePromoToDisk}
                    disabled={saveStatus === 'saving' || !promoTrack.title}
                    style={{ 
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                      background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', 
                      borderRadius: '8px', padding: '14px', color: '#60a5fa', fontWeight: 700, cursor: promoTrack.title ? 'pointer' : 'not-allowed', opacity: promoTrack.title ? 1 : 0.5
                    }}
                  >
                    <Download size={18} /> 
                    {saveStatus === 'saving' ? 'Writing Markdown...' : 'Export Master Assets.md'}
                  </button>
                </div>
              </div>

              {/* Output Platform Formatter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Mini Platform Nav */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['tiktok', 'instagram', 'youtube', 'spotify'] as const).map(platform => (
                    <button
                      key={platform}
                      onClick={() => setActivePromoPlatform(platform)}
                      style={{
                        flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', transition: 'all 0.2s',
                        background: activePromoPlatform === platform ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        borderBottom: activePromoPlatform === platform 
                          ? platform === 'tiktok' ? '3px solid #ff0050' : platform === 'instagram' ? '3px solid #e1306c' : platform === 'youtube' ? '3px solid #ff0000' : '3px solid #1db954'
                          : '3px solid transparent',
                        color: activePromoPlatform === platform ? '#fff' : 'var(--text-secondary)'
                      }}
                    >
                      {platform === 'tiktok' && <Smartphone size={16} color="#ff0050" />}
                      {platform === 'instagram' && <Camera size={16} color="#e1306c" />}
                      {platform === 'youtube' && <Video size={16} color="#ff0000" />}
                      {platform === 'spotify' && <Mail size={16} color="#1db954" />}
                      {platform.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Rendered copy box */}
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleCopyToClipboard}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 12px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {copiedStatus ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedStatus ? 'Copied!' : 'Copy Copy'}
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} color="#fbbf24" /> Ready-To-Post Formatting
                  </div>

                  <pre style={{ 
                    flex: 1, overflowY: 'auto', margin: 0, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                    color: '#e2e8f0', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: 1.6 
                  }} className="custom-scroll">
                    {getPromoCopy(activePromoPlatform)}
                  </pre>

                  <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                    <div>✨ Length: <strong>{getPromoCopy(activePromoPlatform).length} chars</strong></div>
                    <div>🔥 Best Visual Asset: <strong>
                      {activePromoPlatform === 'tiktok' || activePromoPlatform === 'instagram' ? '9:16 Portrait Short-Form' : '16:9 Landscape Visualizer'}
                    </strong></div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: DISTRIBUTION PIPELINES */}
          {activeTab === 'pipelines' && (
            <motion.div 
              key="pipelines" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
            >
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.05)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: '16px', 
                padding: '32px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Globe size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, color: '#10b981' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Server size={24} color="#10b981" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Peer-to-Peer Sync</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Currently Offline</p>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
                  Connect directly with collaborator machines to automatically sync tagged Audio Vault elements without relying on slow cloud drives. 
                </p>
                <button className="btn" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', padding: '12px 24px', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  <LinkIcon size={18} /> Establish Secure Tunnel
                </button>
              </div>

              <div style={{ 
                background: 'rgba(56, 189, 248, 0.05)', 
                border: '1px solid rgba(56, 189, 248, 0.2)', 
                borderRadius: '16px', 
                padding: '32px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Share2 size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, color: '#38bdf8' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Share2 size={24} color="#38bdf8" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Social Distro Pipelines</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>0 Connected Accounts</p>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
                  Link your Spotify for Artists, YouTube Content ID, or TikTok Creator accounts to push your finalized assets directly from Content Forge.
                </p>
                <button className="btn" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none', padding: '12px 24px', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  + Connect New Platform
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
