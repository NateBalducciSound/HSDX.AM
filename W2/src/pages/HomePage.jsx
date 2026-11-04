
// ── SVG Icons ────────────────────────────────────────────────────────────────

function IconHouse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="17" />
    </svg>
  );
}

function IconEnvelope() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function IconGamepad() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="11" rx="5" />
      <path d="M7 11v4M5 13h4" />
      <circle cx="16" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="13" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="13" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V6l12-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" strokeWidth="2" />
    </svg>
  );
}

// ── Nav circle (glass pill button) ───────────────────────────────────────────

function NavCircle({ icon, label, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      className={`nav-circle${active ? ' active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={label}
      title={label}
    >
      {icon}
      {hov && <span className="nav-circle-tip">{label}</span>}
    </button>
  );
}

// ── Grid tile ─────────────────────────────────────────────────────────────────

function GridTile({ icon, label, sub, colorClass, onClick, href }) {
  const El = href ? 'a' : 'button';
  const props = href
    ? { href, ...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {}) }
    : { type: 'button', onClick };

  return (
    <El className={`grid-tile ${colorClass}`} {...props}>
      <span className="tile-icon">{icon}</span>
      <span className="tile-label">{label}</span>
      {sub && <span className="tile-sub">{sub}</span>}
    </El>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────
// Props:
//   onNavigate(page) — page: 'games' | 'music' | 'visual' | 'info' | 'contact'

export default function HomePage({ onNavigate, activeSection }) {
  return (
    <>
      {/* ── Top bar ── */}
      <header className="topbar">
        <div className="topbar-left" />
        <div className="topbar-right">
          <span className="site-wordmark">Hes<span className="wordmark-dot">.</span>dx</span>
        </div>
      </header>

      {/* ── Center grid ── */}
      <main className="center-grid">
      </main>
    </>
  );
}
