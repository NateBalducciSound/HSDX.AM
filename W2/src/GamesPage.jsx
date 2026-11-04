import { useState } from 'react';

// ─── Games page ───────────────────────────────────────────────────────────────
// To add a new project, copy the existing entry object in PROJECTS and fill in:
//
//   title, role, summary          — always visible
//   link: { label, url }          — App Store / external button (optional)
//   skills: ['Unity', ...]        — tag pills shown in expanded section
//   image: '/filename.png'        — screenshot beside the summary (optional)
//   video: '/file.mp4' or         — video below the detail sections (optional)
//          'https://youtube.com/embed/ID'
//   details: [                    — expandable sections (optional, add as many as you want)
//     { heading: 'What I Built', body: '...' },             — single paragraph
//     { heading: 'Sound Design', body: ['p1...', 'p2...'] } — multiple paragraphs
//   ]
// ──────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
    {
        title: 'Defunct',
        role: 'Game Designer · Programmer · Composer · Sound Designer',
        summary:
        "A Rocket-Jumping Puzzle-Platformer where the player navigates an abandoned video game. Inspired by Portal 2, Quake, and Half-Life, navigate a once popular game, where things are all just a little bit off.",
        skills: ['Unity', 'C#', 'Sound Design', 'Music Production', 'Blender', 'Level Design'],
        image: '/nate-defunct-flyer-v1.png',
        details: [
            {
                heading: 'Game Design',
                body: ['I was always in love with the way Portal 2 was designed. There was a perfect grace with which each gameplay element is added seamlessly into the environment. The story seamlessly weaves with the gameplay, to me, it is a truly flawless gameplay experience.', 'In an attempt to capture some of that magic, I began work on Defunct, my shot at a Puzzle Platformer. The method of movement in this game is rocket-jumping, inspired by Quake. You use your rockets to activate buttons, launch objects, launch yourself, and navigate each of the different puzzles.']
            },
            {
                heading: 'Current Status',
                body: 'This is my current project. It currently has a movement demo finished, and was showcased at CalArts Project Week 2026. As of now, efforts continue on developing puzzle chambers, music, and visual assets for the game. Alongside this the visual aesthetic and story are being worked on as well.'
            },
        ]
    },
  {
    title: 'Healthy Zoo',
    role: 'Programmer · Sound Designer · Composer',
    summary:
      "A kid's pediatric care app where children interact with animals to learn about health checkups. Lead Unity programmer, sole developer, and responsible for all audio.",
    link: {
      label: 'Healthy Zoo on the App Store',
        url: 'https://apps.apple.com/us/app/healthyzoo/id6763671834',
    },
      skills: ['Unity', 'C#', 'Sound Design', 'Music Composition', 'iOS Build', 'Android Build'],
    image: '/HealthyZooSplash.png',   // e.g. '/HealthyZoo_screenshot.png'
    video: null,   // e.g. '/HealthyZoo_trailer.mp4' or YouTube embed URL
    details: [
      {
        heading: 'Programming',
        body: 'I was the sole Unity developer on this project, responsible for all gameplay programming, scene architecture, and build pipeline. I implemented all animal interaction systems, the health checkup flow logic, and the full iOS deployment.',
      },
      {
        heading: 'Sound Design & Music',
        body: 'I composed all of the music and produced every sound effect in the game. I designed the audio to feel soft and approachable for a young audience, while keeping it engaging and reactive to player actions.',
      },
      {
        heading: 'Team & Process',
        body: 'I collaborated with an animator and a graphic designer but was the sole developer. I handled implementation of all art assets, build quality, and overall project delivery.',
      },
    ],
  },
    {
        title: 'Tower',
        role: 'Game Designer · Programmer · Composer · 3D Modeler · Sound Designer',
        summary:
        "An Analog horror game where you navigate camera feeds, scan for corrupted signals, and thwart a lovecraftian entity using a computer terminal.",
        skills: ['Unity', 'C#', 'WWise', 'Sound Design', 'Music Production', 'Blender', 'PC Build'],
        image: '/Sigil.png',
        video: '/TowerStateofPlay.mov',
        details: [
            {
                heading: 'Visual and Gameplay Design',
                body: [
                    'I designed Tower to be reminiscent of my home town, surrounded by colossal trees, and covered in fog at night. To match this, an entity that inhabits the town, warping the citizens memories, and taking individuals at its will, the Tower. A stark contrast to aged-buildings, and small businesses, a giant monolith erected in the middle of town, unquestioned and natural to the inhabitants.',
                    'The gameplay was designed after the entity/resource management style of the FNAF franchise. The twist in design comes in the form of using a terminal to type commands to change cameras, distract the entity, and try to search for clues in how to free your home from the tower.',
                ]
            },
            {
                heading: 'Programming',
                body: 'The main concept was an entity/resource management game where nearly all commands were done through a computer terminal. The concept was intriguing and from a programming point of view not too difficult.',
            },
            {
                heading: 'Sound Design',
                body: 'I knew the sound design should feel tactile, retro, and follow some of the trends of the analog horror scene. I decided to use WWise because the Unity sound system can be somewhat frustrating when needing to cue sounds in time with coroutines. WWise makes random containers, event based sound playback, and more complex audio implementation much easier.',
            },
        ]
    }
];

// ── Styles ────────────────────────────────────────────────────────────────────

const C = {
  page: {
    position: 'fixed',
    inset: 0,
    background: '#f0ede8',
    overflowY: 'auto',
    fontFamily: "'Space Mono', monospace",
  },
  inner: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '40px 32px 80px',
  },
  pageTitle: {
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #d0ccc6',
    margin: 0,
  },

  // ── Collapsed header row ──
  header: {
    padding: '32px 0 28px',
  },
  topRow: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  imageCol: {
    flexShrink: 0,
    width: 360,
  },
  image: {
    width: '100%',
    display: 'block',
    borderRadius: 4,
    border: '1px solid #d0ccc6',
    imageRendering: 'auto',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#111',
    letterSpacing: '0.02em',
    marginBottom: 5,
    lineHeight: 1.2,
  },
  role: {
    fontSize: '0.65rem',
    color: '#888',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  summary: {
    fontSize: '0.78rem',
    color: '#444',
    lineHeight: 1.85,
    marginBottom: 18,
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  btn: {
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
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    color: '#999',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  chevron: (open) => ({
    display: 'inline-block',
    transition: 'transform 0.2s',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    fontSize: '0.7rem',
  }),

  // ── Expanded section ──
  expandBody: {
    overflow: 'hidden',
    transition: 'max-height 0.35s ease',
  },
  skillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
    paddingTop: 4,
  },
  skill: {
    padding: '3px 12px',
    borderRadius: 999,
    border: '1px solid #c0bbb4',
    fontSize: '0.6rem',
    color: '#555',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailHeading: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#111',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailBody: {
    fontSize: '0.78rem',
    color: '#333',
    lineHeight: 1.9,
  },
  videoWrap: {
    marginTop: 8,
    marginBottom: 28,
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #d0ccc6',
    background: '#111',
  },
  videoEl: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
};

function isYouTube(url) {
  return url && (url.includes('youtube.com/embed') || url.includes('youtu.be'));
}

function ProjectEntry({ title, role, summary, link, skills, image, video, details, isLast }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <hr style={C.divider} />
      <div style={C.header}>
        {/* Top row: text + optional image */}
        <div style={C.topRow}>
          <div style={C.textCol}>
            <div style={C.title}>{title}</div>
            <div style={C.role}>{role}</div>
            <p style={C.summary}>{summary}</p>
            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={C.btn}
                onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#f0ede8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111'; }}
              >
                {link.label} ↗
              </a>
            )}
          </div>

          {image && (
            <div style={C.imageCol}>
              <img src={image} alt={title} style={C.image} />
              {(details?.length || video) && (
                <button style={{ ...C.expandBtn, marginTop: 22, justifyContent: 'flex-end', width: '100%' }} onClick={() => setOpen(o => !o)}>
                  {open ? 'less' : 'more details'}
                  <span style={C.chevron(open)}>▾</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expandable detail section */}
        <div style={{ ...C.expandBody, maxHeight: open ? 2000 : 0 }}>
          <div style={{ paddingTop: 28 }}>
            {/* Skills pills */}
            {skills?.length > 0 && (
              <div style={C.skillsRow}>
                {skills.map(s => (
                  <span key={s} style={C.skill}>{s}</span>
                ))}
              </div>
            )}

            {/* Detail sections — body can be a string or array of strings (each = paragraph) */}
            {details?.map(d => (
              <div key={d.heading} style={C.detailSection}>
                <div style={C.detailHeading}>{d.heading}</div>
                {(Array.isArray(d.body) ? d.body : [d.body]).map((para, i) => (
                  <p key={i} style={{ ...C.detailBody, marginTop: i > 0 ? 12 : 0 }}>{para}</p>
                ))}
              </div>
            ))}

            {/* Video */}
            {video && (
              <div style={C.videoWrap}>
                {isYouTube(video) ? (
                  <iframe
                    src={video}
                    style={C.videoEl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={video} style={C.videoEl} controls />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {isLast && <hr style={C.divider} />}
    </>
  );
}

export default function GamesPage() {
  return (
    <div style={C.page}>
      <div style={C.inner}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <img src="/HesDx.png" alt="Hes.dx" style={{ height: 40, imageRendering: 'auto' }} />
        </div>
        <div style={C.pageTitle}>Games</div>
        {PROJECTS.map((p, i) => (
          <ProjectEntry
            key={p.title}
            {...p}
            isLast={i === PROJECTS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
