import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Minus, Square, X } from 'lucide-react';

function Titlebar() {
  return (
    <div className="titlebar">
      <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>SYNCMASTER</div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => window.api?.minimize()}>
          <Minus size={14} />
        </button>
        <button className="titlebar-btn" onClick={() => window.api?.maximize()}>
          <Square size={12} />
        </button>
        <button className="titlebar-btn close" onClick={() => window.api?.close()}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Titlebar />
    <App />
  </React.StrictMode>,
)
