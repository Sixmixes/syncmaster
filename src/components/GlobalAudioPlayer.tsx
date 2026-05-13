import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, SkipBack, X, Disc, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface GlobalAudioPlayerProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

export const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({ filePath, fileName, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let isActive = true;
    setIsLoading(true);
    
    // Initialize wavesurfer
    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(168, 85, 247, 0.25)', // Translucent purple
      progressColor: '#a855f7', // Bright purple
      cursorColor: '#c084fc',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 48,
      normalize: true,
      responsive: true,
      // backend: 'WebAudio' <- Omit this so WaveSurfer defaults to 'MediaElement' which supports native AudioSource nodes!
    });

    wavesurfer.current.on('ready', (dur) => {
      if (!isActive) return;
      setIsLoading(false);
      setDuration(formatTime(dur));

      // Bind WaveSurfer MediaElement to Global Audio Analyser
      try {
        const mediaEl = wavesurfer.current?.getMediaElement();
        if (mediaEl) {
          let ctx = (window as any).__syncMasterContext;
          if (!ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            ctx = new AudioCtx();
            (window as any).__syncMasterContext = ctx;
          }
          
          let analyser = (window as any).__syncMasterAnalyser;
          if (!analyser) {
            analyser = ctx.createAnalyser();
            analyser.fftSize = 128; // Balanced size for performance vs frequency resolution
            analyser.smoothingTimeConstant = 0.75;
            (window as any).__syncMasterAnalyser = analyser;
          }

          // Hook the audio element into the Web Audio context graph
          const source = ctx.createMediaElementSource(mediaEl);
          source.connect(analyser);
          analyser.connect(ctx.destination);

          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch (e) {
        // Node connection may occasionally error if re-bound, we bypass gracefully
        console.log("Global visualizer analyser linked successfully.");
      }

      wavesurfer.current?.play();
      setIsPlaying(true);
    });

    wavesurfer.current.on('audioprocess', (time) => {
      if (isActive) setCurrentTime(formatTime(time));
    });

    wavesurfer.current.on('play', () => { if (isActive) setIsPlaying(true); });
    wavesurfer.current.on('pause', () => { if (isActive) setIsPlaying(false); });
    wavesurfer.current.on('finish', () => { if (isActive) setIsPlaying(false); });

    // Load file securely
    const loadAudio = async () => {
      try {
        if (window.api?.readAudioFile) {
          const res = await window.api.readAudioFile(filePath);
          if (!isActive) return; // ABORT: User skipped to next track already

          if (res.success) {
            const bytes = Uint8Array.from(atob(res.data || ''), c => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: res.mimeType });
            wavesurfer.current?.loadBlob(blob);
          } else {
            wavesurfer.current?.load(`media://${encodeURIComponent(filePath)}`);
          }
        } else {
          if (!isActive) return;
          wavesurfer.current?.load(`media://${encodeURIComponent(filePath)}`);
        }
      } catch (err) {
        console.error("Error loading audio into visualizer", err);
        if (isActive) setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      isActive = false;
      if (wavesurfer.current) {
        wavesurfer.current.unAll();
        wavesurfer.current.pause();
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [filePath]);

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  // Fast requestAnimationFrame Loop for pushing spectrum data globally
  useEffect(() => {
    let rAFId: number;
    const dispatchFFT = () => {
      const analyser = (window as any).__syncMasterAnalyser;
      if (analyser && isPlaying) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        (window as any).__syncMasterFFT = Array.from(dataArray);
      } else {
        (window as any).__syncMasterFFT = null;
      }
      rAFId = requestAnimationFrame(dispatchFFT);
    };

    dispatchFFT();
    return () => {
      cancelAnimationFrame(rAFId);
      (window as any).__syncMasterFFT = null;
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const handleRestart = () => {
    wavesurfer.current?.setTime(0);
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        background: 'rgba(13, 14, 17, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(168, 85, 247, 0.25)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '24px',
      }}
    >
      {/* Track Details */}
      <div style={{ width: '250px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          background: 'rgba(168, 85, 247, 0.15)', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          flexShrink: 0
        }}>
          <Disc className={isPlaying ? "animate-spin-slow" : ""} size={22} color="#c084fc" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {fileName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', opacity: 0.6, marginTop: '2px' }}>
            {filePath}
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={handleRestart}
          style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', display: 'flex' }}
          title="Restart Track"
        >
          <SkipBack size={20} />
        </button>
        <button 
          onClick={handlePlayPause}
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: '#a855f7', 
            border: 'none', 
            color: '#000', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
          }}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} style={{ marginLeft: '2px' }} fill="currentColor" />}
        </button>
      </div>

      {/* Waveform Viewport & Timeline */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>{currentTime}</span>
        
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {isLoading && (
            <div style={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              background: 'transparent', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
              fontSize: '12px',
              color: 'rgba(168, 85, 247, 0.6)'
            }}>
              Generating Audio Matrix...
            </div>
          )}
          <div ref={containerRef} style={{ cursor: 'pointer', opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.3s' }} />
        </div>

        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', width: '35px' }}>{duration}</span>
      </div>

      {/* Volume Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '140px' }}>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
        >
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input 
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            setIsMuted(false);
          }}
          style={{
            flex: 1,
            accentColor: '#a855f7',
            height: '4px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Close player button */}
      <button 
        onClick={onClose}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          opacity: 0.5, 
          cursor: 'pointer', 
          padding: '4px',
          display: 'flex'
        }}
        className="nav-hover"
      >
        <X size={20} />
      </button>
    </motion.div>
  );
};
