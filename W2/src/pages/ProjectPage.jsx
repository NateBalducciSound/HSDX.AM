import { GAMES, MUSIC, VISUAL } from '../data';

// ─────────────────────────────────────────────────────────────────────────────
// GAMES — sparse text list
// ─────────────────────────────────────────────────────────────────────────────
function GameItem({ project }) {
  return (
    <div className="proj-item">
      <div className="proj-row">
        <span className="proj-year-big">{project.year}</span>
        <span className="proj-name">{project.title}</span>
        {project.genre && <span className="proj-meta">{project.genre}</span>}
      </div>
      {project.desc && <p className="proj-desc">{project.desc}</p>}
      <div className="proj-links">
        {project.videos?.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noreferrer" className="proj-link">↗ watch</a>
        ))}
        {project.link && (
          <a href={project.link}
            target={project.link.startsWith('http') ? '_blank' : undefined}
            rel={project.link.startsWith('http') ? 'noreferrer' : undefined}
            className="proj-link">↗ view project</a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSIC — album art + tracklist, feeds global player
// ─────────────────────────────────────────────────────────────────────────────
function MusicItem({ project, onPlay }) {
  const hasCover  = !!project.coverArt;
  const hasAudio  = project.audioFiles?.length > 0;

  return (
    <div className="music-item">
      {/* Cover art */}
      <div className="music-cover">
        {hasCover
          ? <img src={project.coverArt} alt={project.title} />
          : <div className="music-cover-empty" />
        }
      </div>

      {/* Info */}
      <div className="music-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <span className="proj-name" style={{ fontSize: 24 }}>{project.title}</span>
          <span className="proj-meta">{project.year}{project.genre ? ` — ${project.genre}` : ''}</span>
        </div>
        {project.desc && <p className="proj-desc" style={{ marginTop: 0, marginBottom: 10 }}>{project.desc}</p>}

        {hasAudio && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {project.audioFiles.map((track, i) => (
              <button key={i} className="music-track-btn"
                onClick={() => onPlay({ ...track, title: project.title, coverArt: project.coverArt })}>
                <span className="music-track-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="music-track-label">{track.label}</span>
                <span className="music-track-play">▶</span>
              </button>
            ))}
          </div>
        )}

        <div className="proj-links" style={{ marginTop: 10 }}>
          {project.videos?.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="proj-link">↗ watch</a>
          ))}
          {project.link && (
            <a href={project.link} target="_blank" rel="noreferrer" className="proj-link">↗ stream</a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL — collage / masonry
// ─────────────────────────────────────────────────────────────────────────────
function VisualItem({ project }) {
  const hasImages = project.images?.length > 0;

  return (
    <div className="visual-item">
      {hasImages ? (
        project.images.map((src, i) => (
          <img key={i} src={src} alt={project.title} className="visual-img" />
        ))
      ) : (
        <div className="visual-placeholder">
          <span className="visual-placeholder-title">{project.title}</span>
          {project.type && <span className="visual-placeholder-type">{project.type}</span>}
        </div>
      )}
      {/* Hover caption */}
      <div className="visual-caption">
        <span>{project.title}</span>
        {project.type && <span className="proj-meta" style={{ marginLeft: 'auto' }}>{project.type}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectPage — routes to correct layout
// ─────────────────────────────────────────────────────────────────────────────
const TITLES = { games: 'GAMES', music: 'MUSIC', visual: 'VISUAL' };

export default function ProjectPage({ category, onBack, onPlay }) {
  const DATA  = category === 'games' ? GAMES : category === 'music' ? MUSIC : VISUAL;
  const title = TITLES[category];

  return (
    <>
      <header className="page-topbar">
        <div className="topbar-left" />
        <span className="page-title">{title}</span>
        <span className="site-wordmark">Hes<span className="wordmark-dot">.</span>dx</span>
      </header>

      <div className="page-scroll">
        {DATA.length === 0 ? (
          <p className="proj-empty">— nothing here yet —</p>
        ) : category === 'games' ? (
          <div className="proj-list">
            {DATA.map(p => <GameItem key={p.id} project={p} />)}
          </div>
        ) : category === 'music' ? (
          <div className="music-list">
            {DATA.map(p => <MusicItem key={p.id} project={p} onPlay={onPlay} />)}
          </div>
        ) : (
          <div className="visual-collage">
            {DATA.map(p => <VisualItem key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
