// ─── Info page ────────────────────────────────────────────────────────────────
// Edit INFO below to update your bio, image, and contact links.
// ──────────────────────────────────────────────────────────────────────────────

const INFO = {
  image: '/NathanCoolPicture.jpg',   // swap for any photo in public/
    description: ['Hes (a.k.a. Nathan Balducci) is a game designer, audio designer, and software programmer. Grounded in his background as a percussionist and music producer, Hes combines game engines, custom C++, and system logic to design interactive mechanics, tech art, and dynamic audio. His work draws heavy aesthetic inspiration from Y2K gaming and hardware-limited media, while his electronic and industrial soundscapes reflect the tactile, responsive feel of his game systems.',
                  'Hes is currently pursuing his BFA in Creative Computing at CalArts, with a specialization in Game Design and Music Technology. During his time at CalArts, he has honed his craft under industry mentors Nicholas Butera, Mike Mulshine, and Ajay Kapur. He also refounded the CalArts GameMakers club, leading collaborative interactive projects presented at the annual CalArts Music Technology Exposition.',
                  'Hes serves as the Lead Game Designer and Creative Producer at the CalArts D.R.E.A.M.S. Initiative, collaborating with high-level stakeholders to direct Location-Based Entertainment (LBE) and AR experiences. Across his project portfolio, he acted as game designer on The Hallway of Dreams, completed Unity software engineering contract work on Healthy Zoo, and provided system programming for the CalArts Machine Orchestra. He aspires to enter the video game industry as a game designer, backed by a strong multidisciplinary foundation in software engineering and technical audio.'],
  links: [
    // { label: 'Email', url: 'mailto:you@email.com' },
    // { label: 'LinkedIn', url: 'https://linkedin.com/in/...' },
    // { label: 'GitHub', url: 'https://github.com/...' },
  ],
};

const S = {
  page: {
    position: 'fixed',
    inset: 0,
    background: '#f0ede8',
    overflowY: 'auto',
    fontFamily: "'Space Mono', monospace",
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 4% 80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  hesdx: {
    height: 60,
    imageRendering: 'auto',
    marginBottom: 28,
  },
  infoLabel: {
    height: 36,
    imageRendering: 'auto',
    marginBottom: 48,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #d0ccc6',
    width: '100%',
    marginBottom: 40,
  },
  contentRow: {
    display: 'flex',
    gap: 36,
    alignItems: 'flex-start',
    width: '100%',
  },
  photo: {
    flexShrink: 0,
    width: 'clamp(140px, 38%, 260px)',
    borderRadius: 4,
    border: '1px solid #d0ccc6',
    display: 'block',
    imageRendering: 'auto',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  desc: {
    fontSize: 'clamp(0.6rem, 2vw, 0.78rem)',
    color: '#333',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  links: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px',
    borderRadius: 999,
    border: '1.5px solid #333',
    background: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    color: '#111',
    textDecoration: 'none',
    letterSpacing: '0.06em',
    alignSelf: 'flex-start',
  },
};

export default function InfoPage() {
  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* HesDx — biggest at top */}
        <img src="/HesDx.png" alt="Hes.dx" style={S.hesdx} />

        {/* Info label — medium below */}
        <img src="/Info.png" alt="Info" style={S.infoLabel} />

        <hr style={S.divider} />

        {/* Photo + description row */}
        <div style={S.contentRow}>
          <img src={INFO.image} alt="Nathan Balducci" style={S.photo} />
          <div style={S.textCol}>
            {(Array.isArray(INFO.description) ? INFO.description : [INFO.description]).map((p, i) => (
              <p key={i} style={S.desc}>{p}</p>
            ))}
            {INFO.links.length > 0 && (
              <div style={S.links}>
                {INFO.links.map(l => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.link}
                    onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#f0ede8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111'; }}
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
