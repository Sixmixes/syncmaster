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
      setAudioFile(initialTrack.filepath);
      setTrackTitle(initialTrack.filename?.replace(/\.[^/.]+$/, "") || 'HYPERSONIC BEAT');
      setActiveTab('social');
    }
  }, [initialTrack]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // ==================== DYNAMIC SEQUENCER & TAP TEMPO STATE ====================
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tapTriggers, setTapTriggers] = useState<{ id: number; time: number; type: 'flash' | 'glitch' | 'shake' | 'invert' }[]>([]);
  const [selectedFXType, setSelectedFXType] = useState<'flash' | 'glitch' | 'shake' | 'invert'>('flash');
  const [activeBeatPulse, setActiveBeatPulse] = useState(false);

  const renderTimeRef = React.useRef(0);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const totalDuration = 15; 

  // Manage preview source destruction on view tear-down
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Global playhead synchronization pipeline
  useEffect(() => {
    let rAF: number;
    const updateTime = () => {
      if (previewAudioRef.current && !previewAudioRef.current.paused) {
        const t = previewAudioRef.current.currentTime;
        renderTimeRef.current = t;
        setCurrentTime(t);
        if (t >= totalDuration) {
          previewAudioRef.current.currentTime = 0;
        }
      }
      rAF = requestAnimationFrame(updateTime);
    };
    rAF = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rAF);
  }, []);

  const addFXTrigger = (time: number) => {
    // Cap values at 15.00 seconds
    const safeTime = Math.max(0, Math.min(totalDuration, time));
    setTapTriggers(prev => [
      ...prev,
      { id: Date.now() + Math.random(), time: safeTime, type: selectedFXType }
    ].sort((a,b) => a.time - b.time));
    
    setActiveBeatPulse(true);
    setTimeout(() => setActiveBeatPulse(false), 80);
  };

  // Keypress proxy handler for DAW-like Spacebar trigger recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'Space' && isPlayingPreview) {
        e.preventDefault();
        const time = previewAudioRef.current?.currentTime || 0;
        addFXTrigger(time);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingPreview, selectedFXType]);

  const togglePreviewPlay = () => {
    if (!audioFile) {
      alert("Please select and load an audio source first!");
      return;
    }

    if (isPlayingPreview) {
      previewAudioRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioRef.current) {
        const url = audioFile.startsWith('media://') ? audioFile : `media://${audioFile}`;
        previewAudioRef.current = new Audio(url);
        previewAudioRef.current.loop = true;
      }
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleTapRecord = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPlayingPreview) return;
    const time = previewAudioRef.current?.currentTime || 0;
    addFXTrigger(time);
  };

  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * totalDuration;
    
    renderTimeRef.current = newTime;
    setCurrentTime(newTime);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = newTime;
    }
  };

  const bpmVal = Math.round(selectedTrack?.bpm || 120);
  const beatStep = 60 / bpmVal;
  
  const handleQuantize = () => {
    setTapTriggers(prev => prev.map(t => {
      const snapped = Math.round(t.time / beatStep) * beatStep;
      return { ...t, time: Math.max(0, Math.min(totalDuration, snapped)) };
    }));
  };

  // Calculate linear hash intervals for beat rulers
  const beatTicks: number[] = [];
  for (let i = 0; i * beatStep <= totalDuration; i++) {
    beatTicks.push(i * beatStep);
  }

  const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null);

  // Pre-compile background asset bitmap buffer for native Canvas 2D Context operations
  useEffect(() => {
    if (bgImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImage;
      img.onload = () => setBgImageObj(img);
    } else {
      setBgImageObj(null);
    }
  }, [bgImage]);

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

  // Real-time High-Fidelity HTML5 Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Maintain continuous floating particle pool for natural dynamic kinetic flow
    const canvasParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      size: Math.random() * 5 + 2,
      speed: Math.random() * 3 + 1,
      opacity: Math.random()
    }));

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // ================ LAYER 1: GLOBAL FX BOUNDING CONTEXT ================
      ctx.save();
      ctx.filter = 'none';

      const cTime = renderTimeRef.current;
      const fxWindow = 0.18; // Active decay width
      const activeTrigger = tapTriggers.find(t => cTime >= t.time && cTime < t.time + fxWindow);
      let linearDecay = 0;

      if (activeTrigger) {
        linearDecay = 1 - ((cTime - activeTrigger.time) / fxWindow);
        if (activeTrigger.type === 'invert') {
          ctx.filter = `invert(${linearDecay * 0.85}) hue-rotate(${linearDecay * 180}deg)`;
        } else if (activeTrigger.type === 'glitch') {
          const glitchAmt = 20 * linearDecay * (Math.random() - 0.5);
          ctx.translate(glitchAmt, 0);
        } else if (activeTrigger.type === 'shake') {
          const heavyShake = 32 * linearDecay * (Math.random() - 0.5);
          ctx.translate(heavyShake, heavyShake);
        }
      }

      const currentBass = barHeights[0] || 30;
      // Native Canvas Beat Shaker Offset
      const shakeOffset = beatShake ? (currentBass / 25) * (Math.random() - 0.5) : 0;
      
      // ================ LAYER 2: ELEMENT TRANSFORM BOUNDING CONTEXT ================
      ctx.save();
      ctx.translate(shakeOffset, shakeOffset);

      // A. Background Coverage
      if (bgImageObj) {
        const imgRatio = bgImageObj.width / bgImageObj.height;
        const canvasRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imgRatio > canvasRatio) {
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        }
        
        ctx.globalAlpha = visStyle === 'orbit' ? 0.4 : 0.7;
        ctx.drawImage(bgImageObj, offsetX, offsetY, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
      } else {
        // Fluid Cyberpunk radial mesh
        const gradient = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, width);
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(1, '#050505');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // B. Beat-Synced Glow Overlay
      if (vignetteGlow) {
        const glowGrad = ctx.createRadialGradient(width/2, height/2, width * 0.3, width/2, height/2, width * 0.9);
        glowGrad.addColorStop(0, 'transparent');
        glowGrad.addColorStop(1, `rgba(244, 63, 94, ${Math.min(0.4, currentBass / 180)})`);
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // C. Floating Avee Particles
      if (useParticles) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f43f5e';
        
        canvasParticles.forEach((p) => {
          p.y -= p.speed * (1 + currentBass / 200);
          if (p.y < -20) {
            p.y = height + Math.random() * 50;
            p.x = Math.random() * width;
          }
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + currentBass / 800), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.8})`;
          ctx.fill();
        });
        ctx.shadowBlur = 0; 
      }

      // D. Waveform Visualizer Engine
      const visY = aspectRatio === '916' ? height * 0.75 : height * 0.8;
      
      if (visStyle === 'bars') {
        const barCount = barHeights.length;
        const totalPadding = 10 * (barCount - 1);
        const barW = (width * 0.8 - totalPadding) / barCount;
        const startX = (width - (barW * barCount + totalPadding)) / 2;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
        
        barHeights.forEach((val, i) => {
          const curH = (val / 100) * (height * 0.18);
          const x = startX + i * (barW + 10);
          
          const grad = ctx.createLinearGradient(x, visY, x, visY - curH);
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(1, '#ec4899');
          ctx.fillStyle = grad;
          
          ctx.beginPath();
          ctx.roundRect(x, visY - curH, barW, Math.max(10, curH), 6);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      } else if (visStyle === 'wave') {
        ctx.beginPath();
        ctx.moveTo(0, visY);
        const step = width / barHeights.length;
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#f43f5e';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#f43f5e';
        
        for(let i = 0; i < barHeights.length; i++) {
          const x = i * step;
          const val = (barHeights[i] || 0) / 100 * 120;
          const y = visY + (i % 2 === 0 ? -val : val);
          ctx.quadraticCurveTo(x, y, x + step, visY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visStyle === 'orbit') {
        const pulse = 1 + (currentBass / 1200);
        const orbitRadius = (aspectRatio === '916' ? 180 : 140) * pulse;
        
        ctx.save();
        ctx.translate(width/2, visY - 40);
        
        // Spinning vinyl rate
        const angle = (Date.now() / 2500) % (Math.PI * 2);
        ctx.rotate(angle);
        
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, orbitRadius, 0, Math.PI*2);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#f43f5e';
        ctx.stroke();
        
        ctx.clip();
        if (bgImageObj) {
          ctx.drawImage(bgImageObj, -orbitRadius, -orbitRadius, orbitRadius*2, orbitRadius*2);
        } else {
          ctx.fillStyle = '#1a1a1a';
          ctx.fill();
        }
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // E. High-Resolution Branding Typography
      if (showBranding) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
        ctx.fillText(trackTitle.toUpperCase(), width/2, height * 0.9);
        
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillText(artistName.toUpperCase(), width/2, height * 0.94);
        ctx.shadowBlur = 0;
      }

      ctx.restore(); // Closes Layer 2 (Element Transforms)
      ctx.restore(); // Closes Layer 1 (Global FX Bounding)

      // ================ POST-PROCESS LAYER OVERLAYS ================
      // Strobe flash drawn in absolute base coordinates so filter inversions don't colorize it!
      if (activeTrigger && activeTrigger.type === 'flash') {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * linearDecay})`;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [bgImageObj, barHeights, visStyle, useParticles, beatShake, vignetteGlow, showBranding, trackTitle, artistName, aspectRatio, tapTriggers]);

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

  const getCanvasDims = () => {
    switch(aspectRatio) {
      case '916': return { width: 720, height: 1280 };
      case '11': return { width: 1080, height: 1080 };
      case '169': return { width: 1280, height: 720 };
    }
  };

  const handleForge = async () => {
    if (!audioFile) {
      alert("Please select a track to synthesize first!");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // 1. Capture real-time Canvas back-buffer context at standard 30 FPS
      const stream = (canvas as any).captureStream(30);
      const chunks: Blob[] = [];

      // 2. Instantiate web-native MediaRecorder pipeline (VP9 high compression)
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      mediaRecorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) chunks.push(evt.data);
      };

      // 3. Spawn synchronized system audio tag
      const audioUrl = audioFile.startsWith('media://') ? audioFile : `media://${audioFile}`;
      const audioPlayer = new Audio(audioUrl);
      
      const recordDuration = 15; // Perfect 15 second short-form capture window
      let ticks = 0;
      const tickInterval = setInterval(() => {
        ticks++;
        const pct = Math.min(98, Math.round((ticks / recordDuration) * 100));
        setGenerationProgress(pct);
      }, 1000);

      mediaRecorder.onstop = async () => {
        clearInterval(tickInterval);
        setGenerationProgress(99);

        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        const arrayBuffer = await finalBlob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        
        // Sequentially build binary stream avoiding large chunk stack overflow
        let binary = '';
        const len = uint8.byteLength;
        for (let i = 0; i < len; i += 2048) {
            const end = Math.min(i + 2048, len);
            binary += String.fromCharCode.apply(null, uint8.subarray(i, end) as any);
        }
        const base64Str = window.btoa(binary);

        // Send downstream to custom native multi-processor backend (FFmpeg)
        if (window.api && (window.api as any).muxVideoAudio) {
          const result = await (window.api as any).muxVideoAudio({
             videoBase64: base64Str,
             audioPath: audioFile
          });

          setIsGenerating(false);
          if (result && result.success) {
            alert(`🔥 Social Visualizer Forge Complete!\nSaved directly to your standard system downloads folder:\n${result.outputPath}`);
          } else {
             alert(`Encoding Matrix Error: ${result?.error || "Unknown failure"}`);
          }
        } else {
          setIsGenerating(false);
          alert("Electron Desktop API not detected. Saved fallback WebM stream.");
        }
      };

      let syncInterval: any = null;
      mediaRecorder.onstart = () => {
        syncInterval = setInterval(() => {
          renderTimeRef.current = audioPlayer.currentTime;
        }, 16);
      };

      audioPlayer.play();
      mediaRecorder.start();

      setTimeout(() => {
        if (syncInterval) clearInterval(syncInterval);
        mediaRecorder.stop();
        audioPlayer.pause();
        renderTimeRef.current = 0; // Reset clock
      }, recordDuration * 1000);

    } catch (err: any) {
      setIsGenerating(false);
      alert(`Encoding stream failed: ${err.message}`);
    }
  };

  const handleGenerateArt = () => {
    if (!prompt.trim()) return;
    setIsGeneratingArt(true);
    
    const cleanTokens = prompt.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).slice(0, 3).join(',');
    const nonce = Math.floor(Math.random() * 10000);
    const generatorUrl = `https://loremflickr.com/800/800/${encodeURIComponent(cleanTokens)}?lock=${nonce}`;
    
    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.src = generatorUrl;
    testImg.onload = () => {
      setBgImage(generatorUrl);
      setIsGeneratingArt(false);
    };
    testImg.onerror = () => {
      setIsGeneratingArt(false);
      alert("Canvas artwork fetching timeout. Please refine keywords.");
    };
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
          <>
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

            {/* High-Resolution Active Canvas Back-Buffer Container */}
            <motion.div
              layout
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
              <canvas 
                ref={canvasRef}
                width={getCanvasDims().width}
                height={getCanvasDims().height}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

              {!bgImage && (
                <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
                  <ImageIcon size={28} />
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>NO CANVAS ART</span>
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
                  onClick={() => {
                    if (selectedTrack) {
                      setAudioFile(selectedTrack.filepath);
                    } else {
                      alert("Please load an analyzed beat into Content Forge via the Audio Vault details panel first!");
                    }
                  }}
                >
                  {audioFile ? (
                    <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Play size={12} fill="currentColor" /> {audioFile.split(/[\\/]/).pop()}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Upload size={12} /> Click to auto-load path from Forge track
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

        {/* ==================== DYNAMIC BEAT SEQUENCER & FX DECK (OPTIONAL) ==================== */}
        <div style={{ 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px',
          padding: '24px',
          marginTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={18} color="#f43f5e" /> Visual Beat Sequencer <span style={{ fontSize: '10px', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>Optional Add-On</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Tap sequences live while previewing, then quantize triggers to overlay automated flushes, glitch transitions, and bass shakes perfectly synced with track BPM!</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                Tempo: <span style={{ color: '#fff' }}>{bpmVal} BPM</span>
              </div>
              
              <button 
                onClick={handleQuantize}
                disabled={tapTriggers.length === 0}
                style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', cursor: tapTriggers.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                🪄 Snap to Grid
              </button>

              <button 
                onClick={() => setTapTriggers([])}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🗑️ Clear FX Markers
              </button>
            </div>
          </div>

          {/* Sequencer Controls HUD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: '16px', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <button
              onClick={togglePreviewPlay}
              style={{
                background: isPlayingPreview ? 'rgba(244, 63, 94, 0.2)' : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                border: isPlayingPreview ? '1px solid #f43f5e' : 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '130px',
                justifyContent: 'center'
              }}
            >
              {isPlayingPreview ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
              {isPlayingPreview ? 'Stop Preview' : 'Load Preview'}
            </button>

            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
              {(['flash', 'glitch', 'shake', 'invert'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => setSelectedFXType(type)}
                  style={{
                    background: selectedFXType === type ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    color: selectedFXType === type ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {type === 'flash' && '⚡ Flash'}
                  {type === 'glitch' && '👾 Glitch'}
                  {type === 'shake' && '🫨 Shake'}
                  {type === 'invert' && '🌈 Invert'}
                </button>
              ))}
            </div>

            <button
              onMouseDown={handleTapRecord}
              disabled={!isPlayingPreview}
              style={{
                background: activeBeatPulse ? '#f43f5e' : (isPlayingPreview ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255,255,255,0.02)'),
                border: `1px solid ${isPlayingPreview ? '#f43f5e' : 'rgba(255,255,255,0.05)'}`,
                color: isPlayingPreview ? (activeBeatPulse ? '#fff' : '#f43f5e') : 'rgba(255,255,255,0.2)',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '0.05em',
                cursor: isPlayingPreview ? 'pointer' : 'not-allowed',
                transition: 'all 0.05s ease',
                width: '100%',
                textAlign: 'center',
                boxShadow: activeBeatPulse ? '0 0 25px rgba(244,63,94,0.5)' : 'none'
              }}
            >
              {isPlayingPreview ? 'PRESS SPACEBAR TO TAP BEAT HITS' : 'LOAD PREVIEW TO START TAPPING'}
            </button>
          </div>

          {/* Digital Piano Roll Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div 
              onClick={handleTimelineScrub}
              style={{
                height: '70px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'crosshair'
              }}
            >
              {/* Tempo Grid Marks */}
              {beatTicks.map((tick, i) => (
                <div 
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(tick / totalDuration) * 100}%`,
                    top: 0,
                    width: '1px',
                    height: i % 4 === 0 ? '100%' : '35%',
                    background: i % 4 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Plotted Event Sequences */}
              {tapTriggers.map(t => {
                const leftPos = (t.time / totalDuration) * 100;
                const color = t.type === 'flash' ? '#fff' : t.type === 'glitch' ? '#06b6d4' : t.type === 'shake' ? '#f97316' : '#d946ef';
                return (
                  <div 
                    key={t.id}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setTapTriggers(prev => prev.filter(prevT => prevT.id !== t.id));
                    }}
                    title={`Double-click to delete ${t.type}`}
                    style={{
                      position: 'absolute',
                      left: `${leftPos}%`,
                      top: '10%',
                      height: '80%',
                      width: '6px',
                      marginLeft: '-3px',
                      borderRadius: '3px',
                      background: color,
                      boxShadow: `0 0 10px ${color}`,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                  />
                );
              })}

              {/* Kinetic Playhead */}
              <div 
                style={{
                  position: 'absolute',
                  left: `${(currentTime / totalDuration) * 100}%`,
                  top: 0,
                  width: '2px',
                  height: '100%',
                  background: '#f43f5e',
                  boxShadow: '0 0 12px #f43f5e',
                  pointerEvents: 'none'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', padding: '0 6px', fontWeight: 700 }}>
              <span>0.0s</span>
              <span>3.75s</span>
              <span>7.50s (Mid-Point)</span>
              <span>11.25s</span>
              <span>15.0s (Loop Out)</span>
            </div>
          </div>

        </div>
        </>
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
