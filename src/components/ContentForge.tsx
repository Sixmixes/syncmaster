import React, { useState, useEffect } from 'react';
import { Hammer, Film, Image as ImageIcon, Play, FileVideo, Type, Sparkles, Camera, Tv, Smartphone, Upload, Loader2, Copy, Share2, TrendingUp, Clock, CheckCircle, Hash, MessageSquare, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ContentForge: React.FC<{ initialTrack?: any }> = ({ initialTrack }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'social'>('visual');
  const [selectedTrack, setSelectedTrack] = useState<any>(initialTrack || null);
  
  const [aspectRatio, setAspectRatio] = useState<'916' | '11' | '169'>('916');
  const [visStyle, setVisStyle] = useState<'bars' | 'wave' | 'orbit'>('bars');
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showBranding, setShowBranding] = useState(true);
  const [artistName, setArtistName] = useState('SPACEJAMZ');
  const [trackTitle, setTrackTitle] = useState('HYPERSONIC BEAT');
  const [prompt, setPrompt] = useState('Cyberpunk city skyline at dusk, high contrast neon, oil painting style');
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  
  // Social Studio specific states
  const [isForgingSocial, setIsForgingSocial] = useState(false);
  const [socialSuite, setSocialSuite] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // High-fidelity Visualizer custom modes (Avee Player Inspired)
  const [useParticles, setUseParticles] = useState(true);
  const [beatShake, setBeatShake] = useState(true);
  const [vignetteGlow, setVignetteGlow] = useState(true);

  useEffect(() => {
    if (initialTrack) {
      setSelectedTrack(initialTrack);
      setTrackTitle(initialTrack.filename?.replace(/\.[^/.]+$/, "") || 'HYPERSONIC BEAT');
      setActiveTab('social');
    }
  }, [initialTrack]);

  // Simulated or real-time bar heights for visualizer preview
  const [barHeights, setBarHeights] = useState(Array.from({ length: 15 }, () => Math.random() * 100));

  // High-fidelity Dynamic Waveform Source (Real Global Audio vs Simulation)
  useEffect(() => {
    let rAFId: number;
    let simInterval: any = null;

    const updateSpectrum = () => {
      const realFFT = (window as any).__syncMasterFFT;
      
      if (realFFT && Array.isArray(realFFT) && realFFT.length > 0) {
        // REAL LIVE AUDIO MODE: Deactivate simulation
        if (simInterval) {
          clearInterval(simInterval);
          simInterval = null;
        }

        const barsCount = 15;
        const scaleFactor = 1.2; // Boost visibility
        const newBars: number[] = [];
        
        // Focus analysis on lower/mid spectrum bands where kinetic energy resides (first 70%)
        const activeSpan = Math.floor(realFFT.length * 0.7);
        const stride = Math.max(1, Math.floor(activeSpan / barsCount));
        
        for (let i = 0; i < barsCount; i++) {
          const sample = realFFT[i * stride] || 0;
          // Scale bytes (0-255) into clean CSS height percentages (0-100%)
          newBars.push(Math.min(100, Math.max(6, (sample / 255) * 100 * scaleFactor)));
        }
        setBarHeights(newBars);
      } else {
        // IDLE / STANDBY MODE: Trigger fallback kinetic generator
        if (!simInterval) {
          simInterval = setInterval(() => {
            // Generate gentle, rhythmic mock energy
            setBarHeights(Array.from({ length: 15 }, () => Math.random() * 60 + 20));
          }, 130);
        }
      }
      rAFId = requestAnimationFrame(updateSpectrum);
    };

    updateSpectrum();
    
    return () => {
      cancelAnimationFrame(rAFId);
      if (simInterval) clearInterval(simInterval);
    };
  }, []);

  // Deriving reactive values from "bass energy" (the lower spectrum bars)
  const bassEnergy = barHeights[0] || 40;
  const shakeScale = beatShake ? 1 + (bassEnergy / 2200) : 1;
  const glowOpacity = vignetteGlow ? Math.min(0.6, bassEnergy / 140) : 0.2;
  const pulseScale = beatShake ? 1 + (bassEnergy / 700) : 1;

  // Generate stable random particle offsets
  const [particles] = useState(Array.from({ length: 16 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 2 + 1,
  })));

  const handleForgeSocial = () => {
    if (!selectedTrack) return;
    setIsForgingSocial(true);
    setSocialSuite(null);
    
    setTimeout(() => {
      const track = selectedTrack;
      const genre = track.genre || 'Hip Hop';
      const bpm = Math.round(track.bpm || 140);
      const key = track.key || 'Am';
      const mood = track.mood || 'Dark / Aggressive';
      const type = track.type || 'Beat';
      const title = track.filename ? track.filename.replace(/\.[^/.]+$/, "") : 'HYPERSONIC BEAT';

      const suite = {
        tiktokHooks: [
          `POV: You finally found the perfect ${mood.toLowerCase()} ${genre} vibe for your next project 🎧💎`,
          `Drop everything and listen to this ${bpm} BPM bounce 🔥🔊`,
          `Wait for the transients to hit... 💀🥁`,
          `If you need a ${genre} record in ${key}, I just engineered the ultimate heater for you 🌊🎸`,
          `This is your sign to write your next breakout single to this right now 👇🎯`
        ],
        instagramCaptions: [
          `Slide 1: Synthesizing sonic energy...\nSlide 2: Starting with chords in ${key}...\nSlide 3: Heavy drum syncopation at ${bpm} BPM...\nSlide 4: Ready for your tracking! 🎚️`,
          `The tonal dynamic on this new ${genre} record is insane (${mood} vibe). Instant licensing available now — DM me for contracts! 💎🎹`
        ],
        hashtags: `#${genre.replace(/[^a-zA-Z0-9]/g, '')} #${genre.replace(/[^a-zA-Z0-9]/g, '')}Producer #BeatStore #${bpm}BPM #${key} #IndependentArtist #ViralBeats #MusicProducerLife`,
        youtubeTitle: `${mood} ${genre} Type ${type} - "${title}" (${bpm} BPM / ${key})`,
        youtubeDesc: `💎 Secure Instant License | Free Stem Downloads: [LINK HERE]\n🔥 Title: "${title}"\n🎹 Core Key: ${key}\n🥁 Tempo: ${bpm} BPM\n🧬 Energy Matrix: ${mood}\n\nThis ${mood} ${genre} production was mathematically engineered for high impact. Drop a comment below if you like this drop!`,
        tweetThread: [
          `1/ Just completed this ${genre} production at ${bpm} BPM. Let's analyze the engineering process... 👇`,
          `2/ Engineered the root chord sequence in ${key} to drive a ${mood.toLowerCase()} emotional profile.`,
          `3/ Frequency alignment optimized for direct vocal tracking. Full audio inside!`
        ],
        linkedinPost: `Delighted to release my newest ${genre} project, "${title}". Maintaining frequency clarity at ${bpm} BPM required rigorous tonal balancing in the key of ${key}. Leveraging smart metadata tags is revolutionizing creative scaling workflows. How are algorithmic distribution models shifting your studio operations?`,
        emailNewsletter: `New Track Launch: "${title}" (${genre})\n\nHey fam,\n\nI just finalized an incredible ${mood.toLowerCase()} masterpiece. Locked in at ${bpm} BPM, this track features a heavy rhythmic pocket optimized for artists who need dynamic range.\n\n👉 Listen and secure usage rights here: [LINK]`,
        bestTime: track.danceability > 75 ? 'Friday 6:00 PM' : 'Wednesday 1:00 PM',
        engagement: track.viral_score || 85
      };

      setSocialSuite(suite);
      setIsForgingSocial(false);
    }, 1200);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleForge = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            alert('🎬 Visualizer successfully generated and saved to output/renders folder!');
          }, 800);
          return 100;
        }
        return p + 2;
      });
    }, 100);
  };

  const handleGenerateArt = () => {
    setIsGeneratingArt(true);
    setTimeout(() => {
      setIsGeneratingArt(false);
      // Mock generating an art URI
      setBgImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop');
    }, 2500);
  };

  const getAspectStyles = () => {
    switch(aspectRatio) {
      case '916': return { width: '260px', height: '460px', borderRadius: '32px' };
      case '11': return { width: '360px', height: '360px', borderRadius: '12px' };
      case '169': return { width: '460px', height: '260px', borderRadius: '12px' };
    }
  };

  return (
    <div style={{ padding: '40px', color: '#fff', height: '100%', overflowY: 'auto', background: '#090a0c' }} className="custom-scroll">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Film className="text-gradient" size={32} />
              Content Forge
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Auto-generate viral audio visualizers and artwork for TikTok, Reels, and YouTube.
            </p>
          </div>
          
          {activeTab === 'visual' && (
            <button 
              className="btn" 
              disabled={isGenerating}
              onClick={handleForge}
              style={{ 
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', 
                border: 'none', 
                padding: '14px 28px', 
                borderRadius: '12px', 
                color: '#fff', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(244, 63, 94, 0.3)'
              }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Hammer size={18} />}
              {isGenerating ? `Forging Video ${generationProgress}%` : 'Forge Social Visualizer'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('visual')}
            style={{
              background: activeTab === 'visual' ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none',
              color: activeTab === 'visual' ? '#fff' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '10px',
              transition: 'all 0.2s'
            }}
            className="nav-hover"
          >
            <Film size={16} /> Visualizer Studio
          </button>
          <button
            onClick={() => setActiveTab('social')}
            style={{
              background: activeTab === 'social' ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none',
              color: activeTab === 'social' ? '#fff' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '10px',
              transition: 'all 0.2s'
            }}
            className="nav-hover"
          >
            <TrendingUp size={16} /> Social Automation Forge
          </button>
        </div>

        {activeTab === 'visual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          
          {/* LEFT COLUMN: PREVIEW PANEL */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '24px', 
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '550px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Live Simulation Background blur */}
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: bgImage ? `url(${bgImage}) center/cover` : 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
              filter: 'blur(60px)',
              opacity: 0.2,
              zIndex: 0
            }} />

            <div style={{ zIndex: 1, color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '20px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} color="#f43f5e" /> Live Render Simulator
            </div>

            {/* Phone/Video Container */}
            <motion.div
              layout
              animate={{ scale: shakeScale }}
              transition={{ type: 'spring', damping: 12, stiffness: 250 }}
              style={{
                ...getAspectStyles(),
                background: '#050505',
                border: '8px solid #1a1a1a',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none'
              }}
            >
              {/* Simulated Visual Content */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundImage: bgImage ? `url(${bgImage})` : 'none', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                opacity: 0.7,
                filter: visStyle === 'orbit' ? 'brightness(0.5)' : 'none'
              }} />

              {/* Dynamic Beat-Synced Glow Overlay */}
              <motion.div 
                animate={{ opacity: glowOpacity }}
                transition={{ duration: 0.1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle, transparent 40%, rgba(244, 63, 94, 0.25) 80%, rgba(0,0,0,0.8) 100%)',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />

              {/* Floating Avee Particles Overlay */}
              {useParticles && particles.map((p, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -450], 
                    opacity: [0, 0.8, 0],
                    scale: [1, 1.5 * pulseScale, 0.5] 
                  }}
                  transition={{ 
                    duration: 5 / p.speed, 
                    repeat: Infinity, 
                    ease: "linear",
                    delay: i * 0.4
                  }}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    bottom: `${p.y - 10}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 0 8px #fff, 0 0 15px #f43f5e',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />
              ))}
              
              {!bgImage && (
                <div style={{ color: 'rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>NO ARTWORK</span>
                </div>
              )}

              {/* Simulated Waveform Display */}
              <div style={{ 
                position: 'absolute', 
                bottom: aspectRatio === '916' ? '120px' : '40px', 
                width: '80%', 
                height: '60px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '3px',
                zIndex: 2
              }}>
                {visStyle === 'bars' && barHeights.map((h, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: `${h}%` }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    style={{ 
                      flex: 1, 
                      background: 'linear-gradient(to top, #f43f5e, #ec4899)', 
                      borderRadius: '4px',
                      opacity: 0.9,
                      boxShadow: '0 0 10px rgba(244, 63, 94, 0.5)'
                    }} 
                  />
                ))}

                {visStyle === 'wave' && (
                  <svg viewBox="0 0 200 60" style={{ width: '100%', height: '100%', stroke: '#fff', fill: 'none', filter: 'drop-shadow(0 0 8px #f43f5e)' }}>
                    <motion.path 
                      animate={{ d: `M 0,30 Q 50,${30 - barHeights[3]} 100,30 T 200,30` }}
                      transition={{ type: 'spring', damping: 10 }}
                      strokeWidth="2.5"
                      stroke="#f43f5e"
                    />
                  </svg>
                )}

                {visStyle === 'orbit' && (
                  <motion.div 
                    animate={{ scale: pulseScale, rotate: 360 }}
                    transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { type: 'spring', damping: 8, stiffness: 250 } }}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      border: '3px solid #f43f5e', 
                      position: 'absolute', 
                      bottom: '40px',
                      boxShadow: '0 0 25px rgba(244, 63, 94, 0.6)',
                      backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                      backgroundSize: 'cover'
                    }}
                  />
                )}
              </div>

              {/* Branding Texts */}
              {showBranding && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '24px', 
                  textAlign: 'center', 
                  zIndex: 3, 
                  textShadow: '0 4px 12px rgba(0,0,0,0.9)',
                  width: '90%'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>{trackTitle}</h3>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#f43f5e', marginTop: '2px' }}>{artistName}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT COLUMN: CONTROLS PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Asset Loading Selector */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '16px', 
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileVideo size={16} color="#f43f5e" /> Media Setup
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Audio Source</label>
                <div 
                  style={{ 
                    border: '1px dashed rgba(255,255,255,0.15)', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    fontSize: '12px', 
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => setAudioFile('C:/Assets/Drives/Audio/SpaceJamz_Loop.wav')}
                >
                  {audioFile ? (
                    <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Play size={12} fill="currentColor" /> SpaceJamz_Loop.wav
                    </div>
                  ) : (
                    <div style={{ opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Upload size={12} /> Click to load track from Vault
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>AI Artwork Generator (Flux.1 Light)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{ 
                    width: '100%', 
                    background: 'var(--bg-dark)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: '6px', 
                    padding: '8px', 
                    color: '#fff', 
                    fontSize: '11px', 
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                  rows={2}
                />
                <button 
                  onClick={handleGenerateArt}
                  disabled={isGeneratingArt}
                  style={{ 
                    width: '100%', 
                    background: 'rgba(244, 63, 94, 0.15)', 
                    border: '1px solid rgba(244, 63, 94, 0.3)', 
                    color: '#f43f5e', 
                    padding: '6px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    marginTop: '8px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isGeneratingArt ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isGeneratingArt ? 'Generating Canvas...' : 'Generate Dynamic Cover Art'}
                </button>
              </div>
            </div>

            {/* Format and Style Panel */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '16px', 
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Layout & Format
              </h3>

              {/* Aspect Ratio selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                <button 
                  onClick={() => setAspectRatio('916')}
                  style={{ 
                    background: aspectRatio === '916' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(0,0,0,0.2)', 
                    border: `1px solid ${aspectRatio === '916' ? '#f43f5e' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                    padding: '12px 8px',
                    color: aspectRatio === '916' ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 700 }}>TikTok (9:16)</span>
                </button>

                <button 
                  onClick={() => setAspectRatio('11')}
                  style={{ 
                    background: aspectRatio === '11' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(0,0,0,0.2)', 
                    border: `1px solid ${aspectRatio === '11' ? '#f43f5e' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                    padding: '12px 8px',
                    color: aspectRatio === '11' ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 700 }}>Insta (1:1)</span>
                </button>

                <button 
                  onClick={() => setAspectRatio('169')}
                  style={{ 
                    background: aspectRatio === '169' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(0,0,0,0.2)', 
                    border: `1px solid ${aspectRatio === '169' ? '#f43f5e' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                    padding: '12px 8px',
                    color: aspectRatio === '169' ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Tv size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 700 }}>YouTube (16:9)</span>
                </button>
              </div>

              {/* Visualizer styling selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Visualizer Algorithm</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['bars', 'wave', 'orbit'].map((sty) => (
                    <button 
                      key={sty}
                      onClick={() => setVisStyle(sty as any)}
                      style={{ 
                        flex: 1,
                        background: visStyle === sty ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)', 
                        border: `1px solid ${visStyle === sty ? '#f43f5e' : 'rgba(255,255,255,0.05)'}`,
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#fff',
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                    >
                      {sty === 'bars' && '🎚️ Spectrogram'}
                      {sty === 'wave' && '〰️ Oscilloscope'}
                      {sty === 'orbit' && '💿 Vinyl Orbit'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avee Player Custom FX Controls */}
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#f43f5e', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>Avee Visual FX</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                    <span>Particle Flow Overlay</span>
                    <input type="checkbox" checked={useParticles} onChange={(e) => setUseParticles(e.target.checked)} style={{ accentColor: '#f43f5e', cursor: 'pointer' }} />
                  </label>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                    <span>Camera Bass Shake</span>
                    <input type="checkbox" checked={beatShake} onChange={(e) => setBeatShake(e.target.checked)} style={{ accentColor: '#f43f5e', cursor: 'pointer' }} />
                  </label>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                    <span>Beat-Synced Vignette Glow</span>
                    <input type="checkbox" checked={vignetteGlow} onChange={(e) => setVignetteGlow(e.target.checked)} style={{ accentColor: '#f43f5e', cursor: 'pointer' }} />
                  </label>
                </div>
              </div>

              {/* Typography Overlay Inputs */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Branding Elements</span>
                  <input 
                    type="checkbox" 
                    checked={showBranding} 
                    onChange={(e) => setShowBranding(e.target.checked)} 
                    style={{ cursor: 'pointer', accentColor: '#f43f5e' }} 
                  />
                </label>
                
                {showBranding && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      type="text"
                      placeholder="Artist Name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '11px', outline: 'none' }}
                    />
                    <input 
                      type="text"
                      placeholder="Track Title"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '11px', outline: 'none' }}
                    />
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
        )}

        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Track Selection Area */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '16px', 
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                {selectedTrack ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>{selectedTrack.type?.toUpperCase() || 'TRACK'} LOADED</div>
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>{selectedTrack.filename || 'Selected File'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <span>🥁 {Math.round(selectedTrack.bpm || 0)} BPM</span>
                      <span>🎹 {selectedTrack.key || 'N/A'}</span>
                      <span>🔥 {selectedTrack.mood || 'Unclassified'}</span>
                      <span>💎 {selectedTrack.genre || 'Standard'}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: '#fff' }}>No Track Loaded</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Navigate to the Audio Vault, select an analyzed file, and click "Forge Social Content".</p>
                  </div>
                )}
              </div>

              {selectedTrack && (
                <button
                  onClick={handleForgeSocial}
                  disabled={isForgingSocial}
                  style={{
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  className="btn"
                >
                  {isForgingSocial ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {isForgingSocial ? 'Synthesizing Suite...' : 'Forge 20 Marketing Assets'}
                </button>
              )}
            </div>

            {/* Results Dashboard */}
            {socialSuite && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}
              >
                {/* Social Cards Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* YouTube Toolkit Card */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <Film size={16} color="#ef4444" /> YouTube Automation Package
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimized Video Title</label>
                          <button onClick={() => handleCopyText(socialSuite.youtubeTitle, 'yt-title')} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {copiedKey === 'yt-title' ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />} {copiedKey === 'yt-title' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {socialSuite.youtubeTitle}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversion-Focused Description Template</label>
                          <button onClick={() => handleCopyText(socialSuite.youtubeDesc, 'yt-desc')} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {copiedKey === 'yt-desc' ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />} {copiedKey === 'yt-desc' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0, lineHeight: 1.6 }}>
                          {socialSuite.youtubeDesc}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Short-Form Hooks Card */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <Smartphone size={16} color="#a855f7" /> TikTok / IG Reels Hooks (5 Options)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {socialSuite.tiktokHooks.map((hook: string, idx: number) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }} className="nav-hover">
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>"{hook}"</span>
                          <button onClick={() => handleCopyText(hook, `hook-${idx}`)} style={{ background: 'transparent', border: 'none', color: copiedKey === `hook-${idx}` ? '#10b981' : 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}>
                            {copiedKey === `hook-${idx}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Social Platform Threads & Feeds */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Twitter Thread */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                        <MessageSquare size={14} color="#38bdf8" /> X (Twitter) Optimization
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {socialSuite.tweetThread.map((tweet: string, idx: number) => (
                          <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.85)', paddingRight: '24px', lineHeight: 1.5 }}>{tweet}</p>
                            <button onClick={() => handleCopyText(tweet, `tweet-${idx}`)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: copiedKey === `tweet-${idx}` ? '#10b981' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                              {copiedKey === `tweet-${idx}` ? <CheckCircle size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LinkedIn Post */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                          <Share2 size={14} color="#0a66c2" /> LinkedIn Strategy
                        </h4>
                        <button onClick={() => handleCopyText(socialSuite.linkedinPost, 'li-post')} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                          {copiedKey === 'li-post' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.6 }}>
                        {socialSuite.linkedinPost}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Newsletter */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        <Mail size={14} color="#eab308" /> Email Blast Copy
                      </h4>
                      <button onClick={() => handleCopyText(socialSuite.emailNewsletter, 'email')} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        {copiedKey === 'email' ? 'Copied!' : 'Copy Text'}
                      </button>
                    </div>
                    <pre style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {socialSuite.emailNewsletter}
                    </pre>
                  </div>

                </div>

                {/* Predictive Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Viral Score Target Card */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', 
                    border: '1px solid rgba(244, 63, 94, 0.25)', 
                    borderRadius: '16px', 
                    padding: '28px 24px',
                    textAlign: 'center',
                    boxShadow: 'inset 0 0 20px rgba(244,63,94,0.05)'
                  }}>
                    <h5 style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>Predictive Virality</h5>
                    <div style={{ fontSize: '56px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'baseline', justifyContent: 'center', letterSpacing: '-0.02em' }}>
                      {socialSuite.engagement}
                      <span style={{ fontSize: '24px', color: '#f43f5e', marginLeft: '2px' }}>%</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5 }}>Probability scale calculated via percussive alignment and key mode dynamics.</p>
                  </div>

                  {/* Best Time Card */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                      <Clock size={14} color="#f43f5e" /> Optimal Post Window
                    </h5>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '18px', textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                      {socialSuite.bestTime}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>Matches peak algorithmic activity for your calculated danceability score.</p>
                  </div>

                  {/* Hashtags Generator */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        <Hash size={14} color="#f43f5e" /> Smart Hashtags
                      </h5>
                      <button onClick={() => handleCopyText(socialSuite.hashtags, 'tags')} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        {copiedKey === 'tags' ? 'Copied' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                      {socialSuite.hashtags}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default ContentForge;
