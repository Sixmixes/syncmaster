import React, { useState, useEffect } from 'react';
import { Settings, Database, AppWindow, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsPanel: React.FC = () => {
    const [startupModule, setStartupModule] = useState('organizer');
    const [isClearing, setIsClearing] = useState(false);
    const [clearStatus, setClearStatus] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('startupModule') || 'organizer';
        setStartupModule(saved);
    }, []);

    const handleSaveStartup = (val: string) => {
        setStartupModule(val);
        localStorage.setItem('startupModule', val);
    };

    const handleClearDb = async () => {
        if (!window.api?.clearDatabaseCache) return;
        if (!confirm('Are you sure you want to completely clear your cached audio search index? This cannot be undone.')) return;

        setIsClearing(true);
        setClearStatus('Wiping SQLite data pools...');

        try {
            const result = await window.api.clearDatabaseCache();
            if (result.success) {
                setClearStatus('Database wiped clean successfully!');
                setTimeout(() => setClearStatus(''), 3000);
            } else {
                setClearStatus(`Error clearing: ${result.error}`);
            }
        } catch (err: any) {
            setClearStatus(`System Failure: ${err.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', color: 'var(--accent-primary)' }}>
                    <Settings size={28} />
                </div>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>System Preferences</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure default launch views and maintain local data systems.</p>
                </div>
            </div>

            {/* Module View Section */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#c084fc' }}>
                    <AppWindow size={20} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Startup Config</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Choose which core module SyncMaster Pro opens immediately upon launch.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                        { id: 'organizer', label: 'Organize & Tag', desc: 'Staging pipeline' },
                        { id: 'vault', label: 'Audio Vault', desc: 'Search & Harvest' },
                        { id: 'dashboard', label: 'Dashboard', desc: 'General Overview' }
                    ].map(opt => {
                        const isSelected = startupModule === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => handleSaveStartup(opt.id)}
                                style={{
                                    background: isSelected ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0,0,0,0.2)',
                                    border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-secondary)', fontSize: '14px' }}>{opt.label}</span>
                                    {isSelected && <CheckCircle2 size={16} color="#c084fc" />}
                                </div>
                                <div style={{ fontSize: '12px', color: isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{opt.desc}</div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Database Utility Section */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '24px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#fb923c' }}>
                    <Database size={20} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Data Index Maintenance</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Reset your SQLite index structure. Clearing the cache will remove all indexed file records, freeing system disk footprints.</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(251, 146, 60, 0.05)', border: '1px solid rgba(251, 146, 60, 0.2)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                    <AlertTriangle size={20} style={{ color: '#fb923c', flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', color: '#fb923c', lineHeight: 1.4 }}>
                        <strong>Action is Irreversible:</strong> Clearing will require running a new drive/directory crawl inside the Audio Vault to re-discover files.
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={handleClearDb}
                        disabled={isClearing}
                        className="btn"
                        style={{
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)',
                            opacity: isClearing ? 0.6 : 1
                        }}
                    >
                        {isClearing ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                        Clear & Reset Index Cache
                    </button>

                    {clearStatus && (
                        <div style={{ fontSize: '13px', color: '#fb923c', fontWeight: 600 }}>
                            {clearStatus}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
