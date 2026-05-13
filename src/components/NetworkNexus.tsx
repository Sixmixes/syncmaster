import React from 'react';
import { Users, Globe, Link as LinkIcon, Share2, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export const NetworkNexus: React.FC = () => {
  return (
    <div style={{ padding: '40px', color: '#fff', height: '100%', overflowY: 'auto' }} className="custom-scroll">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users className="text-gradient" size={32} />
          Network Nexus
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '15px' }}>
          Decentralized collaboration matrix. Sync vaults and manage external distributor channels.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
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
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Distribution Pipelines</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>0 Active Channels</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              Configure automated pipelines to push your finalized content to DSPs, YouTube, or private client delivery links.
            </p>
            <button className="btn" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none', padding: '12px 24px', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              + Add New Channel
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
};
