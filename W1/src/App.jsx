import React, { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Html, PerspectiveCamera, Grid, PositionalAudio } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';

const OUTLINE_MAT = new THREE.MeshBasicMaterial({
  color: 'white',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.35,
});

const GROUP_TO_CAM = {
  'RadioBoomBoxglb':     'OutdoorCam',
  'Box':                 'PhoneCam',
};

// Used for hover highlighting — includes desk even though it has custom click logic
const GROUP_TO_HIGHLIGHT_CAM = {
  'RadioStationDeskglb': 'ConsoleCam',
  'RadioBoomBoxglb':     'OutdoorCam',
  'Box':                 'PhoneCam',
};

// Cams where the group's highlight should be suppressed (already "inside" that area)
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

// audioControlRef.current = { toggle }  — wired by RadioAudio, called by SceneContent
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

    // More aggressive bandpass: kill below 800 Hz and above 2500 Hz
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

    // Expose toggle so the Pause_Play_Button mesh can control playback
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
  'USER: nathan@hsdx',
  'SESSION: tty1',
  '──────────────────────────────────────',
  '',
  'MOUNTING...',
];

const CHAR_SPEED = 6;    // ms per character
const LINE_PAUSE = 30;    // ms pause after each line finishes

function lineColor(text) {
  if (text.startsWith('──'))      return '#1a8c1a';
  if (text.startsWith('MOUNTING')) return '#ffffff';
  if (text.startsWith('USER') || text.startsWith('SESSION')) return '#aaffaa';
  return '#33ff33'; 
}

function BootScreen({ sceneReady, onDone }) {
  const [doneLines, setDoneLines] = useState([]);   // fully typed lines
  const [activeLine, setActiveLine] = useState(''); // line currently being typed
  const [lineIdx, setLineIdx]       = useState(0);
  const [charIdx, setCharIdx]       = useState(0);
  const [fading, setFading]         = useState(false);

  const bootDone = lineIdx >= BOOT_LINES.length;

  // Character-by-character typewriter
  useEffect(() => {
    if (bootDone) return;
    const full = BOOT_LINES[lineIdx];

    if (charIdx < full.length) {
      // Type next character
      const t = setTimeout(() => setCharIdx(c => c + 1), CHAR_SPEED);
      return () => clearTimeout(t);
    } else {
      // Line complete — pause then advance
      const t = setTimeout(() => {
        setDoneLines(prev => [...prev, full]);
        setActiveLine('');
        setCharIdx(0);
        setLineIdx(l => l + 1);
      }, full === '' ? 20 : LINE_PAUSE);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx, bootDone]);

  // Keep activeLine in sync with charIdx
  useEffect(() => {
    if (bootDone) return;
    setActiveLine(BOOT_LINES[lineIdx]?.slice(0, charIdx) ?? '');
  }, [charIdx, lineIdx, bootDone]);

  // Fade out once text done AND scene ready, then call onDone after fade
  useEffect(() => {
    if (!bootDone || !sceneReady) return;
    const fadeStart = setTimeout(() => setFading(true), 300);
    const done      = setTimeout(() => onDone(), 300 + 650); // 300 delay + 600 fade + buffer
    return () => { clearTimeout(fadeStart); clearTimeout(done); };
  }, [bootDone, sceneReady, onDone]);

  return (
    <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: '#000',
        padding: '40px 48px',
        boxSizing: 'border-box',
        fontFamily: "'Courier New', monospace",
        fontSize: '13px',
        lineHeight: '1.7',
        overflowY: 'auto',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      {doneLines.map((line, i) => (
        <div key={i} style={{ color: lineColor(line), fontWeight: line.startsWith('MOUNTING') ? 'bold' : 'normal' }}>
          {line || '\u00a0'}
        </div>
      ))}
      {/* Currently typing line with blinking cursor at end */}
      {!bootDone && (
        <div style={{ color: lineColor(BOOT_LINES[lineIdx] ?? ''), fontWeight: BOOT_LINES[lineIdx]?.startsWith('MOUNTING') ? 'bold' : 'normal' }}>
          {activeLine}<span className="boot-cursor" />
        </div>
      )}
      {/* Waiting for scene after boot text done */}
      {bootDone && !sceneReady && (
        <div><span className="boot-cursor" /></div>
      )}
    </div>
  );
}

// ─── Edit your projects here ──────────────────────────────────────────────────
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
      desc: 'My latest Contribution to a game jam. I was lead gameplay programmer, and did the level and game design.',
      link: 'https://carnol16.itch.io/cowboy-cadavers',
  },
  {
    title: 'This Website',
      tags: ['Blender', 'ThreeJS', 'HTML', 'React(Fiber and Drei)'],
      desc: 'The Website you are on right now. I did all the 3D modeling, music, and web development.',
      link: 'https://www.HSDX.am',
  },
];
const ITCH_URL = 'https://hesiodic.itch.io'; // ← replace with your itch.io profile URL
// ──────────────────────────────────────────────────────────────────────────────

function ConsoleScreen({ transform }) {
  const [idx, setIdx] = useState(0);
  const project = PROJECTS[idx];

  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + PROJECTS.length) % PROJECTS.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % PROJECTS.length); };

  // Build a rotation array from the quaternion
  const euler = new THREE.Euler().setFromQuaternion(transform.quat);
  const { pos } = transform;

  return (
    <mesh position={[pos.x, pos.y, pos.z]} rotation={[euler.x, euler.y, euler.z]}>
      <Html
        transform
        distanceFactor={3.53}
        position={[0, 0, 0.2]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="crt-screen" style={{
          width: '320px',
          background: '#020d02',
          border: '2px solid #1a4d1a',
          fontFamily: "'Courier New', monospace",
          color: '#33ff33',
          fontSize: '11px',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          {/* Header */}
          <div className="crt-text" style={{ background: '#060f06', padding: '6px 10px', borderBottom: '1px solid #1a4d1a', display: 'flex', justifyContent: 'space-between' }}>
            <span>HSDX_WORKS</span>
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

          {/* Project display */}
          <div style={{ padding: '14px 16px', minHeight: '120px' }}>
            <div className="crt-text" style={{ color: '#aaffaa', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
              {project.title}
            </div>
            <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {project.tags.map(tag => (
                <span key={tag} style={{ background: '#1a1a1a', border: '1px solid #444', padding: '1px 6px', fontSize: '10px', color: '#aaa' }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ color: '#aaffaa', lineHeight: '1.5' }}>{project.desc}</div>
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-block', marginTop: '12px', color: '#33ff33', textDecoration: 'underline', fontSize: '11px', pointerEvents: 'auto' }}
            >
              VIEW PROJECT ↗
            </a>
          </div>

          {/* Navigation */}
          <div style={{ borderTop: '1px solid #1a4d1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#060f06', pointerEvents: 'auto' }}>
            <button onClick={prev} style={arrowBtn}>◀</button>
            <span className="crt-text" style={{ color: '#33ff33', opacity: 0.5 }}>{idx + 1} / {PROJECTS.length}</span>
            <button onClick={next} style={arrowBtn}>▶</button>
          </div>
        </div>
      </Html>
    </mesh>
  );
}

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
};

function collectMeshes(obj) {
  const meshes = [];
  obj.traverse((child) => { if (child.isMesh) meshes.push(child); });
  return meshes;
}

function SceneContent({ setAvailableCameras, hoveredCam, setHoveredCam, currentCam, setCurrentCam, onReady }) {
  const { scene: gltfScene, cameras } = useGLTF('/scene.glb');
  const { scene: r3fScene, gl } = useThree();
  const mainCamRef = useRef();
  const clearTimer = useRef(null);
  const audioControlRef = useRef(null);
  const pausePlayBtnRef = useRef(null);
  const [meshMap, setMeshMap] = useState({});
  const [boomboxPos, setBoomboxPos] = useState(null);
  const [screenTransform, setScreenTransform] = useState(null);

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
      // Find the screen mesh by material name
      if (obj.isMesh && obj.name === 'Cube001_1') {
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        obj.getWorldPosition(pos);
        obj.getWorldQuaternion(quat);
        setScreenTransform({ pos, quat });
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
      // Pause/Play button — only active when zoomed in at BoomBoxCam
      if (obj.name === 'Pause_Play_Button' && currentCam === 'BoomBoxCam') {
        audioControlRef.current?.toggle();
        // Animate press-in along the button's local Y axis then spring back
        const btn = pausePlayBtnRef.current;
        if (btn) {
          const origY = btn.position.y;
          gsap.timeline()
            .to(btn.position, { y: origY - 0.03, duration: 0.08, ease: 'power2.in' })
            .to(btn.position, { y: origY,         duration: 0.15, ease: 'elastic.out(1, 0.4)' });
        }
        return;
      }
      // BoomBox body — two-stage camera zoom
      if (obj.name === 'RadioBoomBoxglb') {
        if (currentCam === 'OutdoorCam') {
          window.transitionToCamera('BoomBoxCam');
        } else if (currentCam !== 'BoomBoxCam') {
          window.transitionToCamera('OutdoorCam');
        }
        return;
      }
      // Console desk — two-stage camera zoom
      if (obj.name === 'RadioStationDeskglb') {
        if (currentCam === 'ConsoleCam') {
          window.transitionToCamera('ScreenCam');
        } else if (currentCam !== 'ScreenCam') {
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
          // Already inside this area — no highlight
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

  return (
    <>
      <PerspectiveCamera makeDefault ref={mainCamRef} fov={75} far={1000} />

      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />

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

      {screenTransform && <ConsoleScreen transform={screenTransform} />}

      <mesh position={[-8.9, 6.6, -4]} rotation={[0, -105.2, 0]}>
        <Html transform occlude distanceFactor={2.5}>
          <div className="contact-paper">
            <h2 style={{ borderBottom: '2px solid black', margin: '0 0 10px 0' }}>SIGNAL_ID</h2>
            <p><strong>Nathan Balducci</strong></p>
            <p style={{ fontSize: '12px' }}>Dev Bio: Building digital artifacts.</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <textarea placeholder="Type message..." />
              <button className="send-btn">SEND SIGNAL</button>
            </form>
          </div>
        </Html>
      </mesh>
    </>
  );
}

export default function App() {
  const [camList, setCamList] = useState([]);
  const [hoveredCam, setHoveredCam] = useState(null);
  const [currentCam, setCurrentCam] = useState('DefaultCam');
  const [sceneReady, setSceneReady] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleBootDone   = useCallback(() => setBootDone(true), []);

  const cameraLabels = {
    'DefaultCam': 'HSDX.AM',
    'ConsoleCam':  'GAMES', 
    'OutdoorCam':  'MUSIC',
    'PhoneCam':    'SIGNAL',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>

      {!bootDone && (
        <BootScreen
          sceneReady={sceneReady}
          onDone={handleBootDone}
        />
      )}

      <div className="ui-overlay">
        <div className="status-bar">HSDX_OS // USER_LOGIN</div>
        {['DefaultCam', ...camList.filter(n => n !== 'DefaultCam')]
          .filter(name => cameraLabels[name])
          .map((name) => (
            <button
              key={name}
              className="cam-button"
              onClick={() => {
                if (name === 'ConsoleCam') {
                  if (currentCam === 'ConsoleCam') window.transitionToCamera('ScreenCam');
                  else window.transitionToCamera('ConsoleCam');
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
