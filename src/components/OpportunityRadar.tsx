import React from 'react';
import { Radar, Target, TrendingUp, Briefcase, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export const OpportunityRadar: React.FC = () => {
  return (
    <div style={{ padding: '40px', color: '#fff', height: '100%', overflowY: 'auto' }} className="custom-scroll">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radar className="text-gradient" size={32} />
          Opportunity Radar
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '15px' }}>
          Real-time sync licensing briefs and placement intelligence tracking.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="#a855f7" /> Active Briefs
              </h2>
              <button style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Refresh Feed
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: 'Dark Cinematic Trailer', tags: ['Orchestral', 'Dark', '120BPM'], budget: '$5k - $15k', deadline: '2 Days' },
                { title: 'High-Energy Sports Promo', tags: ['Hip-Hop', 'Brass', 'Energetic'], budget: '$2k - $5k', deadline: '5 Days' },
                { title: 'Indie Game Soundtrack', tags: ['Synthwave', 'Ambient', 'Retro'], budget: '$10k+', deadline: '1 Week' }
              ].map((brief, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{brief.title}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {brief.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>{brief.budget}</div>
                    <div style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Bell size={12} /> {brief.deadline}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(0,0,0,0) 100%)', 
              border: '1px solid rgba(245, 158, 11, 0.2)', 
              borderRadius: '16px', 
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                <TrendingUp size={18} /> Market Trends
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                AI Analysis indicates a 40% increase in requests for <strong>"Organic Lo-Fi"</strong> over the past 30 days. Consider generating assets in this style via Content Forge.
              </div>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '16px', 
              padding: '24px',
              flex: 1
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#38bdf8" /> My Placements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No active placements tracked.
              </div>
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
};
