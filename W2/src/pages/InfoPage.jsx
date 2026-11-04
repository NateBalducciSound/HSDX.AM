import { INFO } from '../data';

const SKILLS = [
  'Unity', 'C#', 'ChucK', 'Audio Programming',
  'Blender', 'Three.js', 'React', 'WebGL',
  'Ableton Live', 'Game Design', 'Sound Design', 'Classical Percussion',
];

export default function InfoPage({ onBack }) {
  const hasPhotos = INFO.photos && INFO.photos.length > 0;

  return (
    <>
      <header className="page-topbar">
        <div className="topbar-left" />
        <span className="page-title">INFO</span>
        <span className="site-wordmark">Hes<span className="wordmark-dot">.</span>dx</span>
      </header>

      <div className="page-scroll">
        <div className="info-grid">

          {/* ── Left: photos ── */}
          <div>
            {hasPhotos ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {INFO.photos.map((src, i) => (
                  <img key={i} src={src} alt={`${INFO.name} photo ${i + 1}`}
                    style={{ width: '100%', borderRadius: 2, objectFit: 'cover', display: 'block', border: '1px solid var(--border)' }} />
                ))}
              </div>
            ) : (
              <div className="photo-placeholder panel">
                <p style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                  Add photos to <code>/public/photos/</code> and list paths in <code>src/data.js</code> under <code>INFO.photos</code>.
                </p>
              </div>
            )}
          </div>

          {/* ── Right: bio ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.08em', color: 'var(--text)', marginBottom: 6 }}>
                {INFO.name}
              </h1>
              <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--mint)', letterSpacing: '0.06em' }}>{INFO.handle}</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{INFO.location}</p>
            </div>

            <div className="panel" style={{ padding: '16px 18px' }}>
              <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>{INFO.bio}</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8, marginTop: 10 }}>{INFO.bioExtended}</p>
            </div>

            <div>
              <p style={{ fontFamily: 'var(--font)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                Skills &amp; Tools
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {SKILLS.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {INFO.itch  && <a href={INFO.itch} target="_blank" rel="noreferrer" className="btn aqua">itch.io ↗</a>}
              {INFO.email && <a href={`mailto:${INFO.email}`} className="btn">email</a>}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
