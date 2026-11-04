// src/data.js
// Add your projects here. Images/audio go in the /public folder.

export const INFO = {
  name: 'Nathan Balducci',
  handle: 'Hes / Hesiodic',
  bio: `Game developer, music producer, and audio programmer with a unique blend of skills ranging from audio engineering to 3D modeling. Currently pursuing a BFA in Creative Computing: Game Design & Music Technology at the California Institute of the Arts.`,
  bioExtended: `With over 10 years in classical percussion, I've developed an eclectic production style — writing music for projects like Healthy Zoo and lending sound design to student films like Little Lies, Little Crimes. My goal is to work in the games industry as an audio specialist and programmer.`,
  location: 'Valencia, CA — CalArts',
  email: 'hes@hsdx.am',
  itch: 'https://hesiodic.itch.io',
  photos: ['/NathanCoolPicture.jpg'],
};

// Add new projects here — images/videos/audio go in /public and are referenced by path
export const GAMES = [
  {
    id: 'chews',
    title: 'CHEWS',
    genre: 'Procedural Audio Tool',
    year: '2024',
    desc: 'A procedural audio tool using the ChucK audio programming language. Generates sound in real-time based on player interaction.',
    images: [],
    videos: ['https://youtu.be/P47jwyYOaNw?si=kXnKMFaZg_3png2s'],
    link: 'https://youtu.be/P47jwyYOaNw?si=kXnKMFaZg_3png2s',
  },
  {
    id: 'cowboy-cadavers',
    title: 'Cowboy Cadavers',
    genre: 'Game Jam / Western',
    year: '2024',
    desc: 'Game jam entry. Lead gameplay programmer, level design, and game design.',
    images: [],
    videos: [],
    link: 'https://carnol16.itch.io/cowboy-cadavers',
  },
  // Add new game entries above this line
];

export const MUSIC = [
  {
    id: 'healthy-zoo',
    title: 'Healthy Zoo',
    genre: 'Electronic / Game OST',
    year: '2024',
    desc: 'Original soundtrack composed for the Healthy Zoo project.',
    coverArt: '',  // e.g. '/music/healthy-zoo-cover.jpg'
    audioFiles: [], // e.g. [{ label: 'Main Theme', file: '/music/hz-main.mp3' }]
    videos: [],
  },
  // Add new music entries above this line
];

export const VISUAL = [
  {
    id: 'hsdx-site',
    title: 'HSDX.AM — Interactive 3D Room',
    type: '3D / WebGL',
    desc: 'Interactive 3D website environment. All modeling, lighting, shaders, and web development.',
    images: [],
    videos: [],
    link: '/W1',
  },
  // Add new visual entries above this line
];
