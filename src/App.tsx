import React, { useState } from 'react';
import { 
  LayoutGrid, Database, Hammer, Users, 
  BarChart, Radar, Music, Settings, Menu
} from 'lucide-react';
import { FileOrganizer } from './components/FileOrganizer';
import { AudioVaultSearch } from './components/AudioVaultSearch';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { SettingsPanel } from './components/SettingsPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { ContentForge } from './components/ContentForge';
import { NetworkNexus } from './components/NetworkNexus';
import { OpportunityRadar } from './components/OpportunityRadar';
import './App.css'; // Ensure to leverage global definitions

type ActiveModule = 'organizer' | 'vault' | 'forge' | 'nexus' | 'empire' | 'radar' | 'dashboard' | 'settings';

interface PlayableTrack {
  filepath: string;
  filename: string;
  id: string | number;
}



function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    return (localStorage.getItem('startupModule') || 'organizer') as ActiveModule;
  });
  const [pendingLoadPaths, setPendingLoadPaths] = useState<string[] | null>(null);
  const [activeTrack, setActiveTrack] = useState<PlayableTrack | null>(null);
  const [forgeTrack, setForgeTrack] = useState<any>(null);

  // Promoted Global Scanner State for Background Operation
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [foundCount, setFoundCount] = useState(0);

  const handleStartScan = async () => {
    if (!window.api?.scanAllDrives || !window.api?.selectDirectory) return;
    
    const targetDir = await window.api.selectDirectory();
    if (!targetDir) return;

    setIsScanning(true);
    setScanStatus(`Preparing index of ${targetDir}...`);
    setFoundCount(0);

    const unsubscribe = window.api.onScanProgress((data: any) => {
      if (data.status === 'progress') {
        setFoundCount(data.count);
        setScanStatus(`Indexing: ${data.count} files found...`);
      } else if (data.status === 'complete') {
        setScanStatus(`Scan completed! Successfully indexed ${data.found} items.`);
        setTimeout(() => setIsScanning(false), 2000);
      }
    });

    await window.api.scanAllDrives(targetDir);
    if (typeof unsubscribe === 'function') unsubscribe();
  };

  const handlePlayTrack = (track: PlayableTrack) => {
    if (activeTrack && activeTrack.id === track.id) {
      // Let the player handle toggle, or if they clicked the same track again, we could pause?
      // Actually, let's just reset it to trigger re-load or let user close it.
      setActiveTrack(null);
      setTimeout(() => setActiveTrack(track), 50);
    } else {
      setActiveTrack(track);
    }
  };

  const handleSendToOrganizer = (filePaths: string[]) => {
    setPendingLoadPaths(filePaths);
    setActiveModule('organizer');
  };

  const handleOrganizerConsumed = () => {
    setPendingLoadPaths(null);
  };

  const handleSendToForge = (track: any) => {
    setForgeTrack(track);
    setActiveModule('forge');
  };

  const handleSendToNexus = () => {
    setActiveModule('nexus');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'organizer', icon: Music, label: 'Organize & Tag' },
    { id: 'vault', icon: Database, label: 'Audio Vault' },
    { id: 'forge', icon: Hammer, label: 'Content Forge' },
    { id: 'nexus', icon: Users, label: 'Promo & Pitch Nexus' },
    { id: 'radar', icon: Radar, label: 'Opportunity Radar' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'organizer': return (
        <FileOrganizer 
          initialFilePaths={pendingLoadPaths} 
          onInitialHandled={handleOrganizerConsumed} 
          onPlayTrack={handlePlayTrack}
          activeTrackId={activeTrack?.id}
          isScanning={isScanning}
          scanStatus={scanStatus}
          foundCount={foundCount}
          onStartScan={handleStartScan}
        />
      );
      case 'vault': return (
        <AudioVaultSearch 
          onSendToOrganizer={handleSendToOrganizer} 
          onSendToForge={handleSendToForge}
          onPlayTrack={handlePlayTrack}
          activeTrackId={activeTrack?.id}
          isScanning={isScanning}
          scanStatus={scanStatus}
          foundCount={foundCount}
          onStartScan={handleStartScan}
        />
      );
      case 'forge': return <ContentForge initialTrack={forgeTrack} />;
      case 'nexus': return <NetworkNexus />;
      case 'radar': return <OpportunityRadar />;
      case 'dashboard': return <DashboardPanel onNavigate={(module: any) => setActiveModule(module)} />;
      case 'settings': return <SettingsPanel />;
      default: return <FileOrganizer onPlayTrack={handlePlayTrack} activeTrackId={activeTrack?.id} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-main)', overflow: 'hidden', position: 'relative' }}>
      {/* Global Main Sidebar */}
      <div style={{ 
        width: '260px', 
        background: '#0d0e11', 
        borderRight: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '20px 0',
        paddingBottom: activeTrack ? '110px' : '20px', // Avoid overlapping with media bar
        transition: 'padding 0.3s ease'
      }}>
        <div style={{ padding: '0 24px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
          <h1 className="text-gradient" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            SYNCMASTER <span style={{ color: '#fff', opacity: 0.6, fontSize: '12px' }}>PRO V2</span>
          </h1>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
          {navItems.map(item => {
            const isActive = activeModule === item.id;
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveModule(item.id as ActiveModule)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: 'none',
                  background: isActive ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                className={!isActive ? 'nav-hover' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'vault' && isScanning && (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', 
                      color: '#fff', 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      padding: '2px 6px', 
                      borderRadius: '20px',
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div 
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} 
                        className="animate-pulse" 
                      />
                      <span>{foundCount > 1000 ? `${(foundCount / 1000).toFixed(1)}k` : foundCount}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => setActiveModule('settings')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: activeModule === 'settings' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
              color: activeModule === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: 'none',
              fontSize: '14px',
              fontWeight: activeModule === 'settings' ? 600 : 500,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            className={activeModule !== 'settings' ? 'nav-hover' : ''}
          >
            <Settings size={18} strokeWidth={activeModule === 'settings' ? 2.5 : 2} /> Settings
          </button>
        </div>
      </div>

      {/* Dynamic Main Content Viewport */}
      <main style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        paddingBottom: activeTrack ? '90px' : '0', // Avoid overlapping with media bar
        transition: 'padding 0.3s ease'
      }}>
        {renderContent()}
      </main>

      {/* Render persistent visualizer drawer if active */}
      {activeTrack && (
        <GlobalAudioPlayer 
          key={activeTrack.id}
          filePath={activeTrack.filepath} 
          fileName={activeTrack.filename} 
          onClose={() => setActiveTrack(null)} 
          onSendToOrganizer={handleSendToOrganizer}
          onSendToForge={() => handleSendToForge(activeTrack)}
          onSendToNexus={handleSendToNexus}
        />
      )}
    </div>
  );
}

export default App;
