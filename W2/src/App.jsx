import { useState } from 'react';
import './index.css';
import NavButtons from './NavButtons';
import Obelisks from './Obelisks';
import GamesPage from './GamesPage';
import VisualPage from './VisualPage';

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f0ede8', overflow: 'hidden' }}>

      {/* Home screen */}
      <div style={{
        position: 'fixed', inset: 0,
        opacity: selected === null ? 1 : 0,
        pointerEvents: selected === null ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}>
        <Obelisks onSelect={setSelected} hideLabels={selected !== null} />
      </div>

      {/* Section pages */}
      {selected === 0 && <GamesPage />}
      {selected === 2 && <VisualPage />}
      {selected !== null && selected !== 0 && selected !== 2 && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#f0ede8',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5a7a68',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
          }}>
            coming soon
          </div>
        </div>
      )}

      <NavButtons onHome={() => setSelected(null)} activeSection={null} />
      {selected === null && (
        <img
          src="/HesDx.png"
          alt="Hes.dx"
          style={{
            position: 'fixed',
            top: 15,
            left: '50%',
            transform: 'translateX(-50%)',
            height: 40,
            zIndex: 200,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
