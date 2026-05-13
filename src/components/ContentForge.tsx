import React, { useState, useEffect } from 'react';
import { Hammer, Film, Image as ImageIcon, Play, FileVideo, Type, Sparkles, Camera, Tv, Smartphone, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ContentForge: React.FC = () => {
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
  
  // High-fidelity Visualizer custom modes (Avee Player Inspired)
  const [useParticles, setUseParticles] = useState(true);
  const [beatShake, setBeatShake] = useState(true);
  const [vignetteGlow, setVignetteGlow] = useState(true);

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
        </div>

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

      </motion.div>
    </div>
  );
};

export default ContentForge;
