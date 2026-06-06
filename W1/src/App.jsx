import React, { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Html, PerspectiveCamera, Grid, PositionalAudio, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { gsap } from 'gsap';
import * as THREE from 'three';

const OUTLINE_MAT = new THREE.MeshBasicMaterial({
  color: 'white',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.35,
});

const GROUP_TO_CAM = {
  'RadioBoomBoxglb': 'OutdoorCam',
  'Box':             'PhoneCam',
};

const GROUP_TO_HIGHLIGHT_CAM = {
  'RadioStationDeskglb': 'ConsoleCam',
  'RadioBoomBoxglb':     'OutdoorCam',
  'Box':                 'PhoneCam',
};

const GROUP_SUPPRESSED_CAMS = {
  'RadioStationDeskglb': ['ConsoleCam', 'ScreenCam'],
  'RadioBoomBoxglb':     ['OutdoorCam', 'BoomBoxCam'],
  'Box':                 ['PhoneCam'],
};

function makeDistortionCurve(amount = 20) {
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function RadioAudio({ position, url, audioControlRef }) {
  const audioRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = audio.context;

    if (!camera.children.find(c => c.isAudioListener)) {
      camera.add(audio.listener);
    }

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 800;
    hp.Q.value = 1.5;

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(30);
    shaper.oversample = '2x';

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2500;
    lp.Q.value = 1.0;

    audio.setFilters([hp, shaper, lp]);
    audio.setVolume(0.4);

    audioControlRef.current = {
      toggle: () => {
        if (audio.isPlaying) {
          audio.pause();
        } else {
          ctx.resume().then(() => audio.play());
        }
      },
    };

    const startAudio = () => {
      if (audio.isPlaying) return;
      ctx.resume().then(() => audio.play());
      document.removeEventListener('click', startAudio);
    };
    document.addEventListener('click', startAudio);

    return () => document.removeEventListener('click', startAudio);
  }, [camera, audioControlRef]);

  return (
    <mesh position={position}>
      <PositionalAudio ref={audioRef} url={url} distance={10} loop />
    </mesh>
  );
}

const BOOT_LINES = [
  'HSDX_OS  v0.9.1-alpha',
  '──────────────────────────────────────',
  'BIOS POST ... OK',
  'CPU: HSDX-X1 @ 3.6GHz  [8 CORES DETECTED]',
  'RAM: 16384MB DDR5 ... OK',
  'GPU: HSDX-RENDER-UNIT ... OK',
  '',
  'Loading kernel ...',
  'Mounting /sys ... OK',
  'Mounting /dev ... OK',
  'Mounting /proc ... OK',
  'Starting udev ... OK',
  '',
  'Initialising audio subsystem ... OK',
  'Initialising render pipeline ... OK',
  'Loading scene shaders ... OK',
  '',
  'NETWORK: eth0 UP  [192.168.1.xx]',
  'FIREWALL: active',
  '',
  '──────────────────────────────────────',
  'USER: Admin',
  'SESSION: tty1',
  '──────────────────────────────────────',
  '',
  'MOUNTING...',
];

const CHAR_SPEED = 6;
const LINE_PAUSE = 30;

function lineColor(text) {
  if (text.startsWith('──'))      return '#1a8c1a';
  if (text.startsWith('MOUNTING')) return '#ffffff';
  if (text.startsWith('USER') || text.startsWith('SESSION')) return '#aaffaa';
  return '#33ff33';
}

function BootScreen({ sceneReady, onDone }) {
  const [doneLines, setDoneLines] = useState([]);
  const [activeLine, setActiveLine] = useState('');
  const [lineIdx, setLineIdx]       = useState(0);
  const [charIdx, setCharIdx]       = useState(0);
  const [fading, setFading]         = useState(false);

  const bootDone = lineIdx >= BOOT_LINES.length;

  useEffect(() => {
    if (bootDone) return;
    const full = BOOT_LINES[lineIdx];
    if (charIdx < full.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), CHAR_SPEED);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDoneLines(prev => [...prev, full]);
        setActiveLine('');
        setCharIdx(0);
        setLineIdx(l => l + 1);
      }, full === '' ? 20 : LINE_PAUSE);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx, bootDone]);

  useEffect(() => {
    if (bootDone) return;
    setActiveLine(BOOT_LINES[lineIdx]?.slice(0, charIdx) ?? '');
  }, [charIdx, lineIdx, bootDone]);

  useEffect(() => {
    if (!bootDone || !sceneReady) return;
    const fadeStart = setTimeout(() => setFading(true), 300);
    const done      = setTimeout(() => onDone(), 300 + 650);
    return () => { clearTimeout(fadeStart); clearTimeout(done); };
  }, [bootDone, sceneReady, onDone]);

  return (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
        padding: '40px 48px', boxSizing: 'border-box',
        fontFamily: "'Courier New', monospace", fontSize: '13px',
        lineHeight: '1.7', overflowY: 'auto',
        opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease',
      }}
    >
      {doneLines.map((line, i) => (
        <div key={i} style={{ color: lineColor(line), fontWeight: line.startsWith('MOUNTING') ? 'bold' : 'normal' }}>
          {line || '\u00a0'}
        </div>
      ))}
      {!bootDone && (
        <div style={{ color: lineColor(BOOT_LINES[lineIdx] ?? ''), fontWeight: BOOT_LINES[lineIdx]?.startsWith('MOUNTING') ? 'bold' : 'normal' }}>
          {activeLine}<span className="boot-cursor" />
        </div>
      )}
      {bootDone && !sceneReady && (
        <div><span className="boot-cursor" /></div>
      )}
    </div>
  );
}

// ── Projects data ──────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title: 'CHEWS',
    tags: ['UNITY', 'C#', 'ChucK'],
    desc: 'A procedural tool using the audio programming language ChucK.',
    link: 'https://youtu.be/P47jwyYOaNw?si=kXnKMFaZg_3png2s',
  },
  {
    title: 'Latest Game Jam',
    tags: ['Unity', 'C#'],
    desc: 'My latest contribution to a game jam. Lead gameplay programmer, level and game design.',
    link: 'https://carnol16.itch.io/cowboy-cadavers',
  },
  {
    title: 'This Website',
    tags: ['Blender', 'ThreeJS', 'HTML', 'React'],
    desc: 'The website you are on right now. All 3D modeling, music, and web development.',
    link: 'https://www.HSDX.am',
  },
];

const BIO_SHORT = 'Hes (Nathan Balducci) — game dev, music producer, audio programmer. BFA: Creative Computing @ CalArts.';
const BIO_FULL  = 'Hes, a.k.a. Nathan Balducci, is a game developer, music producer, and audio programmer. With a unique blend of skills ranging from audio engineering to 3D modeling, Nathan infuses his dynamic range of abilities into his love for video games. Currently getting their BFA in Creative Computing: Game Design and Music Technology at the California Institute of the Arts. With a background in classical percussion for over 10 years, Nathan has created an eclectic and diverse musical production style, writing music for projects such as Healthy Zoo and lending sound design to student films such as Little Lies, Little Crimes. Nathan aspires to work in the games industry as an audio specialist and game programmer.';

const ITCH_URL = 'https://hesiodic.itch.io';

const arrowBtn = {
  background: 'none',
  border: '1px solid #1a4d1a',
  color: '#33ff33',
  textShadow: '0 0 6px rgba(51,255,51,0.8)',
  fontFamily: "'Courier New', monospace",
  fontSize: '14px',
  padding: '2px 10px',
  cursor: 'pointer',
  lineHeight: 1,
  pointerEvents: 'auto',
};

const tabBtn = (active) => ({
  background: active ? '#1a4d1a' : 'none',
  border: 'none',
  borderRight: '1px solid #1a4d1a',
  color: active ? '#aaffaa' : '#33ff33',
  fontFamily: "'Courier New', monospace",
  fontSize: '10px',
  padding: '4px 12px',
  cursor: 'pointer',
  pointerEvents: 'auto',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
});

// Shared console panel content — fills its container; parent controls width/height
function ConsolePanelContent({ large = false, embedded = false }) {
  const [tab, setTab] = useState('projects');
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const project = PROJECTS[idx];
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + PROJECTS.length) % PROJECTS.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % PROJECTS.length); };

  const handleSend = (e) => {
    e.preventDefault();
    if (sending || (!msg && !name)) return;
    setSending(true);
    setTimeout(() => {
      setMsg(''); setName(''); setEmail('');
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }, 1200);
  };

  // Font sizes scale with large mode
  const fs   = large ? '13px' : '11px';
  const fsXs = large ? '12px' : '10px';
  const fsLg = large ? '15px' : '13px';
  const bio  = large ? BIO_FULL : BIO_SHORT;

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #1a4d1a',
    outline: 'none',
    color: '#aaffaa',
    fontFamily: "'Courier New', monospace",
    fontSize: fsXs,
    minWidth: 0,
    pointerEvents: 'auto',
  };

  return (
    // Outer container: flex-column, fills parent — parent sets width & height
    <div
      className="crt-screen"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#020d02',
        border: '2px solid #1a4d1a',
        fontFamily: "'Courier New', monospace",
        color: '#33ff33',
        fontSize: fs,
        boxSizing: 'border-box',
        userSelect: embedded ? 'none' : 'text',
        pointerEvents: embedded ? 'none' : 'auto',
      }}
    >
      {/* Header — fixed height */}
      <div className="crt-text" style={{
        flexShrink: 0,
        background: '#060f06',
        padding: '6px 10px',
        borderBottom: '1px solid #1a4d1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ opacity: 0.65 }}>HSDX_OS $ ./portfolio</span>
        <a
          href={ITCH_URL}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: '#ff5555', textDecoration: 'none', fontWeight: 'bold', pointerEvents: 'auto' }}
        >
          ITCH.IO ↗
        </a>
      </div>

      {/* Tabs — fixed height */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid #1a4d1a', background: '#030a03' }}>
        <button onClick={(e) => { e.stopPropagation(); setTab('projects'); }} style={tabBtn(tab === 'projects')}>
          [projects]
        </button>
        <button onClick={(e) => { e.stopPropagation(); setTab('contact'); }} style={tabBtn(tab === 'contact')}>
          [contact]
        </button>
      </div>

      {/* Scrollable content — grows to fill remaining space */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', boxSizing: 'border-box' }}>

        {/* ── Projects tab ── */}
        {tab === 'projects' && (
          <>
            <div style={{ color: '#33ff33', opacity: 0.55, marginBottom: '6px', fontSize: fsXs }}>
              {'> cat project_0' + (idx + 1) + '.txt'}
            </div>
            <div style={{ borderTop: '1px solid #1a4d1a', borderBottom: '1px solid #1a4d1a', padding: '6px 0', marginBottom: '8px' }}>
              <div className="crt-text" style={{ color: '#aaffaa', fontWeight: 'bold', fontSize: fsLg, marginBottom: '4px' }}>
                {project.title}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {project.tags.map(tag => (
                  <span key={tag} style={{
                    background: '#0a1a0a', border: '1px solid #2a5a2a',
                    padding: '1px 5px', fontSize: large ? '11px' : '9px', color: '#66cc66',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ color: '#aaffaa', lineHeight: '1.6', marginBottom: '10px' }}>
              {project.desc}
            </div>
            <a
              href={project.link} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: '#33ff33', textDecoration: 'none', pointerEvents: 'auto', fontSize: fsXs }}
            >
              {'> VIEW_PROJECT ↗'}
            </a>
          </>
        )}

        {/* ── Contact tab ── */}
        {tab === 'contact' && (
          <>
            <div style={{ color: '#33ff33', opacity: 0.55, marginBottom: '4px', fontSize: fsXs }}>
              {'> cat bio.txt'}
            </div>
            <div style={{ borderTop: '1px solid #1a4d1a', paddingTop: '6px', marginBottom: '12px', color: '#aaffaa', lineHeight: '1.6', fontSize: fsXs }}>
              {bio}
            </div>
            <div style={{ color: '#33ff33', opacity: 0.55, marginBottom: '6px', fontSize: fsXs }}>
              {'> send_message --to hsdx.am'}
            </div>
            {sent && (
              <div className="crt-text" style={{ color: '#aaffaa', marginBottom: '8px', fontSize: fsXs }}>
                {'> MESSAGE TRANSMITTED ✓'}
              </div>
            )}
            <form onSubmit={handleSend} style={{ pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                <span style={{ opacity: 0.6, fontSize: fsXs, flexShrink: 0, paddingTop: '2px' }}>MSG:</span>
                <textarea
                  placeholder="write here..."
                  rows={large ? 3 : 2}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  className={sending ? 'console-sending' : ''}
                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #1a4d1a', outline: 'none', resize: 'none', color: '#aaffaa', fontFamily: "'Courier New', monospace", fontSize: fsXs, lineHeight: 1.5, pointerEvents: 'auto' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ opacity: 0.6, fontSize: fsXs, flexShrink: 0 }}>SIG:</span>
                  <input type="text" placeholder="name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ opacity: 0.6, fontSize: fsXs, flexShrink: 0 }}>@:</span>
                  <input type="email" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', background: 'none', border: '1px solid #1a4d1a', color: '#33ff33', fontFamily: "'Courier New', monospace", fontSize: fsXs, padding: '5px 0', cursor: 'pointer', letterSpacing: '0.1em', pointerEvents: 'auto', textShadow: '0 0 6px rgba(51,255,51,0.6)' }}>
                {'> — TRANSMIT —'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Nav — always rendered (same height both tabs); hidden on contact tab */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid #1a4d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#060f06',
        pointerEvents: tab === 'projects' ? 'auto' : 'none',
        visibility: tab === 'projects' ? 'visible' : 'hidden',
      }}>
        <button onClick={prev} style={arrowBtn}>◀</button>
        <span className="crt-text" style={{ color: '#33ff33', opacity: 0.5, fontSize: fsXs, letterSpacing: '0.1em' }}>
          {String(idx + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
        </span>
        <button onClick={next} style={arrowBtn}>▶</button>
      </div>
    </div>
  );
}

// Dimensions of the in-world sleep screen — overlay will match these exactly
const SLEEP_W = 320;
const SLEEP_H = 220;

// Sleep-mode screen shown in the 3D world — black with a faint standby glow
function ConsoleScreen({ transform, visible }) {
  const euler = new THREE.Euler().setFromQuaternion(transform.quat);
  const { pos } = transform;

  return (
    <mesh position={[pos.x, pos.y, pos.z]} rotation={[euler.x, euler.y, euler.z]}>
      <Html
        transform
        distanceFactor={3.53}
        style={{ pointerEvents: 'none' }}
        zIndexRange={[100, 0]}
      >
        {/* id used by overlay to read exact screen-space rect after zoom */}
        <div
          id="crt-sleep-screen"
          style={{
            width: `${SLEEP_W}px`,
            height: `${SLEEP_H}px`,
            background: '#020d02',
            borderRadius: '6px',
            border: '2px solid #1a4d1a',
            boxShadow: '0 0 10px rgba(51,255,51,0.3), 0 0 30px rgba(51,255,51,0.1)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '8px',
            boxSizing: 'border-box',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <span className="standby-led" />
        </div>
      </Html>
    </mesh>
  );
}

// Overlay shown when camera zooms in — positioned exactly over the 3D sleep screen
function LargeConsoleOverlay({ onClose, screenRect }) {
  const [phase, setPhase] = useState('powering'); // 'powering' | 'on'

  useEffect(() => {
    const t = setTimeout(() => setPhase('on'), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Position the panel exactly where the 3D sleep screen is in the viewport
  const panelStyle = screenRect
    ? {
        position: 'fixed',
        left: screenRect.left,
        top: screenRect.top,
        width: screenRect.width,
        height: screenRect.height,
        zIndex: 5001,
      }
    : {
        // Fallback: centered if rect wasn't captured
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw', height: '60vh',
        zIndex: 5001,
      };

  return (
    <>
      {/* Darkened backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 5000,
          background: 'rgba(0,4,0,0.88)',
          animation: 'bgFadeIn 0.3s ease forwards',
        }}
        onClick={onClose}
      />

      {/* Panel pinned to screen mesh position */}
      <div style={panelStyle}>
        {/* Close hint above the panel */}
        <div style={{
          position: 'absolute', top: '-22px', right: 0,
          fontFamily: "'Courier New', monospace", fontSize: '10px',
          color: '#33ff33', opacity: 0.4, letterSpacing: '0.1em',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          [ESC / CLICK OUTSIDE TO CLOSE]
        </div>

        {/* CRT shell fills the pinned area exactly */}
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {phase === 'powering' && (
            <div className="crt-poweron" style={{ width: '100%', height: '100%' }} />
          )}
          {phase === 'on' && (
            <div className="crt-content-fadein" style={{ width: '100%', height: '100%' }}>
              <ConsolePanelContent large />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function collectMeshes(obj) {
  const meshes = [];
  obj.traverse((child) => { if (child.isMesh) meshes.push(child); });
  return meshes;
}

function SceneContent({ setAvailableCameras, hoveredCam, setHoveredCam, currentCam, setCurrentCam, onReady, panelsVisible, onZoomComplete }) {
  const { scene: gltfScene, cameras } = useGLTF('/scene.glb');
  const { scene: r3fScene, gl } = useThree();
  const mainCamRef = useRef();
  const clearTimer = useRef(null);
  const audioControlRef = useRef(null);
  const pausePlayBtnRef = useRef(null);
  const [meshMap, setMeshMap] = useState({});
  const [boomboxPos, setBoomboxPos] = useState(null);
  const [screenTransform, setScreenTransform] = useState(null);

  // Nudge camera once screenTransform is known so drei Html gets positioned correctly
  useEffect(() => {
    if (!screenTransform || !mainCamRef.current) return;
    const nudge = () => {
      if (!mainCamRef.current) return;
      mainCamRef.current.position.x += 0.001;
      requestAnimationFrame(() => {
        if (mainCamRef.current) mainCamRef.current.position.x -= 0.001;
      });
    };
    nudge();
    const t1 = setTimeout(nudge, 150);
    return () => clearTimeout(t1);
  }, [screenTransform]);

  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;

    if (gltfScene.background) r3fScene.background = gltfScene.background;
    if (gltfScene.fog)        r3fScene.fog        = gltfScene.fog;

    const camMap = {};
    cameras.forEach((cam) => { camMap[cam.name] = cam; });
    setAvailableCameras(Object.keys(camMap));

    window.transitionToCamera = (name, duration = 1.2) => {
      const target = camMap[name];
      if (!target) return;
      const targetPos = new THREE.Vector3();
      const targetQua = new THREE.Quaternion();
      target.getWorldPosition(targetPos);
      target.getWorldQuaternion(targetQua);
      gsap.to(mainCamRef.current.position, {
        x: targetPos.x, y: targetPos.y, z: targetPos.z,
        duration, ease: 'power2.inOut',
      });
      gsap.to(mainCamRef.current.quaternion, {
        x: targetQua.x, y: targetQua.y, z: targetQua.z, w: targetQua.w,
        duration, ease: 'power2.inOut',
        onUpdate: () => mainCamRef.current.updateProjectionMatrix(),
      });
      setCurrentCam(name);
    };

    if (camMap['DefaultCam']) {
      window.transitionToCamera('DefaultCam', 0);
    } else {
      mainCamRef.current.position.set(5, 5, 5);
      mainCamRef.current.lookAt(0, 0, 0);
    }

    const found = {};
    gltfScene.traverse((obj) => {
      const cam = GROUP_TO_HIGHLIGHT_CAM[obj.name];
      if (cam) {
        found[cam] = collectMeshes(obj);
        if (obj.isMesh && !found[cam].includes(obj)) found[cam].unshift(obj);
      }
      if (obj.name === 'RadioBoomBoxglb') {
        const pos = new THREE.Vector3();
        obj.getWorldPosition(pos);
        setBoomboxPos([pos.x, pos.y, pos.z]);
      }
      if (obj.name === 'Pause_Play_Button') {
        pausePlayBtnRef.current = obj;
      }
      if (obj.isMesh && obj.name === 'Cube001_1') {
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        obj.getWorldPosition(pos);
        obj.getWorldQuaternion(quat);
        setScreenTransform({ pos, quat });
      }
      if (obj.name === 'RadioTowerglb' || obj.name?.includes('Tower')) {
        obj.traverse(child => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => { m.fog = false; });
          }
        });
      }
    });
    setMeshMap(found);
    onReady();
  }, [cameras, gl, gltfScene, r3fScene, setAvailableCameras, setCurrentCam, onReady]);

  useEffect(() => {
    const targets = hoveredCam ? (meshMap[hoveredCam] ?? []) : [];
    const added = targets.map((mesh) => {
      const outline = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
      outline.scale.setScalar(1.02);
      outline.name = '__outline__';
      mesh.add(outline);
      return { mesh, outline };
    });
    return () => { added.forEach(({ mesh, outline }) => mesh.remove(outline)); };
  }, [hoveredCam, meshMap]);

  const handleClick = (e) => {
    e.stopPropagation();
    let obj = e.object;
    while (obj) {
      if (obj.name === 'Pause_Play_Button' && currentCam === 'BoomBoxCam') {
        audioControlRef.current?.toggle();
        const btn = pausePlayBtnRef.current;
        if (btn) {
          const origY = btn.position.y;
          gsap.timeline()
            .to(btn.position, { y: origY - 0.03, duration: 0.08, ease: 'power2.in' })
            .to(btn.position, { y: origY,         duration: 0.15, ease: 'elastic.out(1, 0.4)' });
        }
        return;
      }
      if (obj.name === 'RadioBoomBoxglb') {
        if (currentCam === 'OutdoorCam') {
          window.transitionToCamera('BoomBoxCam');
        } else if (currentCam !== 'BoomBoxCam') {
          window.transitionToCamera('OutdoorCam');
        }
        return;
      }
      if (obj.name === 'RadioStationDeskglb') {
        if (currentCam === 'PanelZoomCam') {
          // Click again from panel-zoom → step back to ScreenCam
          window.transitionToCamera('ScreenCam');
        } else if (currentCam === 'ScreenCam') {
          // Third click: camera zooms into the screen itself
          zoomToScreen();
        } else if (currentCam === 'ConsoleCam') {
          window.transitionToCamera('ScreenCam');
        } else {
          window.transitionToCamera('ConsoleCam');
        }
        return;
      }
      const cam = GROUP_TO_CAM[obj.name];
      if (cam) { window.transitionToCamera(cam); return; }
      obj = obj.parent;
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    clearTimeout(clearTimer.current);
    let obj = e.object;
    while (obj) {
      const cam = GROUP_TO_HIGHLIGHT_CAM[obj.name];
      if (cam) {
        const suppressed = GROUP_SUPPRESSED_CAMS[obj.name] ?? [];
        if (suppressed.includes(currentCam)) {
          setHoveredCam(null);
          document.body.style.cursor = 'default';
        } else {
          setHoveredCam(cam);
          document.body.style.cursor = 'pointer';
        }
        return;
      }
      obj = obj.parent;
    }
    setHoveredCam(null);
    document.body.style.cursor = 'default';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    clearTimer.current = setTimeout(() => {
      setHoveredCam(null);
      document.body.style.cursor = 'default';
    }, 50);
  };

  // Zoom camera into the screen mesh, then read the sleep div's viewport rect
  const zoomToScreen = useCallback(() => {
    if (!screenTransform || !mainCamRef.current) return;
    const { pos, quat } = screenTransform;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    const camPos = pos.clone().addScaledVector(forward, 1.5);
    const lookMat = new THREE.Matrix4().lookAt(camPos, pos, new THREE.Vector3(0, 1, 0));
    const camQuat = new THREE.Quaternion().setFromRotationMatrix(lookMat);

    gsap.to(mainCamRef.current.position, {
      x: camPos.x, y: camPos.y, z: camPos.z,
      duration: 1.2, ease: 'power2.inOut',
    });
    gsap.to(mainCamRef.current.quaternion, {
      x: camQuat.x, y: camQuat.y, z: camQuat.z, w: camQuat.w,
      duration: 1.2, ease: 'power2.inOut',
      onUpdate: () => mainCamRef.current.updateProjectionMatrix(),
      onComplete: () => {
        // Wait two frames: one for Three.js to render, one for drei to update Html transforms
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const el = document.getElementById('crt-sleep-screen');
          if (!el) { onZoomComplete(null); return; }
          const r = el.getBoundingClientRect();
          // Sanity-check: if rect is degenerate fall back to null (overlay uses centered fallback)
          const rect = (r.width > 10 && r.height > 10)
            ? { left: r.left, top: r.top, width: r.width, height: r.height }
            : null;
          onZoomComplete(rect);
        }));
      },
    });
  }, [screenTransform, onZoomComplete]);

  return (
    <>
      <PerspectiveCamera makeDefault ref={mainCamRef} fov={75} far={1000} />

      <color attach="background" args={['#050505']} />
      <fogExp2 attach="fog" args={['#050505', 0.05]} />
      <Environment preset="night" blur={1} />

      <ambientLight intensity={1.8} />
      <pointLight position={[-5, 8, -5]} intensity={0.2} color="#223344" />

      <primitive
        object={gltfScene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      <Grid infiniteGrid fadeDistance={40} sectionColor="#333" cellColor="#111" />

      {boomboxPos && (
        <RadioAudio position={boomboxPos} url="/music.mp3" audioControlRef={audioControlRef} />
      )}

      {screenTransform && <ConsoleScreen transform={screenTransform} visible={panelsVisible} />}

      <EffectComposer>
        <Bloom luminanceThreshold={0.9} intensity={0.8} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={1.0} />
      </EffectComposer>
    </>
  );
}

export default function App() {
  const [camList, setCamList] = useState([]);
  const [hoveredCam, setHoveredCam] = useState(null);
  const [currentCam, setCurrentCam] = useState('DefaultCam');
  const [sceneReady, setSceneReady] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  const [screenRect, setScreenRect] = useState(null);

  const handleSceneReady  = useCallback(() => setSceneReady(true), []);
  const handleBootDone    = useCallback(() => setBootDone(true), []);
  const handleZoomComplete = useCallback((rect) => {
    setScreenRect(rect);
    setCurrentCam('PanelZoomCam');
  }, [setCurrentCam]);

  // Buttons fade only when the camera is zoomed into the panel
  const buttonsHidden = currentCam === 'PanelZoomCam';

  // ESC steps back from the panel zoom
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && currentCam === 'PanelZoomCam') {
        window.transitionToCamera?.('ScreenCam');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentCam]);

  const cameraLabels = {
    'DefaultCam': 'HSDX.AM',
    'ConsoleCam':  'GAMES',
    'OutdoorCam':  'MUSIC',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>

      {!bootDone && (
        <BootScreen sceneReady={sceneReady} onDone={handleBootDone} />
      )}

      <div
        className="ui-overlay"
        style={{
          opacity: buttonsHidden ? 0 : 1,
          pointerEvents: buttonsHidden ? 'none' : 'auto',
          transition: 'opacity 0.4s ease',
        }}
      >
        <div className="status-bar">HSDX_OS // USER_LOGIN</div>
        {['DefaultCam', ...camList.filter(n => n !== 'DefaultCam')]
          .filter(name => cameraLabels[name])
          .map((name) => (
            <button
              key={name}
              className="cam-button"
              onClick={() => {
                if (name === 'ConsoleCam') {
                  if (currentCam === 'ConsoleCam') {
                    window.transitionToCamera('ScreenCam');
                  } else {
                    window.transitionToCamera('ConsoleCam');
                  }
                } else {
                  window.transitionToCamera(name);
                }
              }}
              onMouseEnter={() => {
                if (Object.values(GROUP_TO_HIGHLIGHT_CAM).includes(name)) setHoveredCam(name);
              }}
              onMouseLeave={() => setHoveredCam(null)}
            >
              {cameraLabels[name]}
            </button>
          ))}
      </div>

      {currentCam === 'PanelZoomCam' && bootDone && (
        <LargeConsoleOverlay
          screenRect={screenRect}
          onClose={() => {
            setCurrentCam('ScreenCam');
            window.transitionToCamera?.('ScreenCam');
          }}
        />
      )}

      <Canvas
        dpr={0.65}
        gl={{ antialias: false }}
        style={{
          position: 'absolute', top: 0, left: 0,
          opacity: bootDone ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            setAvailableCameras={setCamList}
            hoveredCam={hoveredCam}
            setHoveredCam={setHoveredCam}
            currentCam={currentCam}
            setCurrentCam={setCurrentCam}
            onReady={handleSceneReady}
            panelsVisible={bootDone}
            onZoomComplete={handleZoomComplete}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
