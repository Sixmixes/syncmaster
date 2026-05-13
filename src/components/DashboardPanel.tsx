import React, { useEffect, useState } from 'react';
import { Database, FolderOpen, Play, Activity, Star, Music, Search, Hammer, Users, Radar } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardPanel: React.FC<{
  onNavigate: (module: string) => void;
}> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalVocals: 0,
    analyzed: 0,
  });

  useEffect(() => {
    // Quick fetch to get some stats from the DB
    if (window.api?.dbSearch) {
      window.api.dbSearch('').then((res: any) => {
        if (res && res.results) {
          const files = res.results;
          setStats({
            totalFiles: res.totalCount || files.length,
            totalVocals: files.filter((f: any) => f.has_vocals === 1 || /vocal|acapella/i.test(f.filename)).length,
            analyzed: files.filter((f: any) => !!(f.bpm || f.key)).length
          });
        }
      });
    }
  }, []);

  return (
    <div style={{ padding: '40px', color: '#fff', height: '100%', overflowY: 'auto' }} className="custom-scroll">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity className="text-gradient" size={32} />
          Empire Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '15px' }}>
          Your central command center for audio organization, intelligence, and creation.
        </p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, color: '#a855f7' }}>
              <Database size={100} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Total Vault Assets</h3>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>{stats.totalFiles.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} /> Live Index Active
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, color: '#38bdf8' }}>
              <Star size={100} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Deep DSP Analyzed</h3>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#38bdf8' }}>{stats.analyzed.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Files with parsed BPM/Key
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, color: '#ec4899' }}>
              <Music size={100} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Vocals & Acapellas</h3>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#ec4899' }}>{stats.totalVocals.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Acapellas ready for harvesting
            </div>
          </div>
        </div>

        {/* Quick Actions / Module Launchers */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#fff' }}>Module Launchpad</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          <div 
            onClick={() => onNavigate('organizer')}
            style={{ 
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0,0,0,0) 100%)', 
              border: '1px solid rgba(168, 85, 247, 0.3)', 
              borderRadius: '16px', 
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="nav-hover"
          >
            <FolderOpen size={32} color="#c084fc" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Organize & Tag</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Rename, structure, and tag your latest sample pack downloads with precision regex renaming and ID3 writing.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('vault')}
            style={{ 
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(0,0,0,0) 100%)', 
              border: '1px solid rgba(56, 189, 248, 0.3)', 
              borderRadius: '16px', 
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="nav-hover"
          >
            <Database size={32} color="#38bdf8" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Audio Vault</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Instantly search through thousands of samples. Run deep DSP analysis for BPM and root key discovery.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('forge')}
            style={{ 
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(0,0,0,0) 100%)', 
              border: '1px solid rgba(236, 72, 153, 0.3)', 
              borderRadius: '16px', 
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="nav-hover"
          >
            <Hammer size={32} color="#ec4899" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Content Forge</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Generate, arrange, and master fresh content assets. Your creative workshop for audio manipulation.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('nexus')}
            style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 100%)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              borderRadius: '16px', 
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="nav-hover"
          >
            <Users size={32} color="#10b981" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Network Nexus</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Manage collaborations, sync with team members, and distribute your finalized audio vaults seamlessly.
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
