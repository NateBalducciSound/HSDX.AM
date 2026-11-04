import { useRef, useEffect, useState } from 'react';

export default function MiniPlayer({ track, onClear }) {
  const audioRef  = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // New track — auto-play
  useEffect(() => {
    if (!track) return;
    setProgress(0);
    setPlaying(false);
    const a = audioRef.current;
    if (!a) return;
    a.src = track.file;
    a.load();
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [track]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  };

  if (!track) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 14,
      right: 24,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 2,
      padding: '6px 10px',
      minWidth: 220,
      maxWidth: 300,
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration) setProgress(a.currentTime / a.duration);
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />

      {/* Cover art */}
      {track.coverArt && (
        <img src={track.coverArt} alt={track.title}
          style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 1, flexShrink: 0, border: '1px solid var(--border)' }} />
      )}

      {/* Info + progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
          {track.label ?? track.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="audio-progress-bar" style={{ flex: 1 }} onClick={seek}>
            <div className="audio-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span style={{ fontFamily: 'var(--font)', fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>
            {fmt(progress * duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <button className="play-btn" onClick={toggle} style={{ flexShrink: 0 }}>
        {playing
          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>
          : <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <button onClick={onClear} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1, padding: '0 2px',
      }} title="Close">×</button>
    </div>
  );
}
