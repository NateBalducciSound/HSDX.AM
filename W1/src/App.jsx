import React, { Suspense, useRef, useEffect, useState } from 'react';
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
  'RadioStationDeskglb': 'ConsoleCam',
  'RadioBoomBoxglb':     'OutdoorCam',
  'Box':                 'PhoneCam',
};

// Cams where the group's highlight should be suppressed (already "inside" that area)
const GROUP_SUPPRESSED_CAMS = {
  'RadioStationDeskglb': ['ConsoleCam'],
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

function collectMeshes(obj) {
  const meshes = [];
  obj.traverse((child) => { if (child.isMesh) meshes.push(child); });
  return meshes;
}

function SceneContent({ setAvailableCameras, hoveredCam, setHoveredCam, currentCam, setCurrentCam }) {
  const { scene: gltfScene, cameras } = useGLTF('/scene.glb');
  const { scene: r3fScene, gl } = useThree();
  const mainCamRef = useRef();
  const clearTimer = useRef(null);
  const audioControlRef = useRef(null);
  const pausePlayBtnRef = useRef(null);
  const [meshMap, setMeshMap] = useState({});
  const [boomboxPos, setBoomboxPos] = useState(null);

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
      const cam = GROUP_TO_CAM[obj.name];
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
    });
    setMeshMap(found);
  }, [cameras, gl, gltfScene, r3fScene, setAvailableCameras, setCurrentCam]);

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
    console.log('CLICK currentCam:', currentCam, '| hit:', e.object?.name);
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
      const cam = GROUP_TO_CAM[obj.name];
      if (cam) { console.log('  -> transitioning to', cam); window.transitionToCamera(cam); return; }
      console.log('  -> walking past', obj.name, obj.type);
      obj = obj.parent;
    }
    console.log('  -> no match found');
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    clearTimeout(clearTimer.current);
    let obj = e.object;
    while (obj) {
      const cam = GROUP_TO_CAM[obj.name];
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
        <RadioAudio position={boomboxPos} url="/music.wav" audioControlRef={audioControlRef} />
      )}

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

  const cameraLabels = {
    'DefaultCam': 'HSDX.AM',
    'ConsoleCam':  'GAMES', 
    'OutdoorCam':  'MUSIC',
    'PhoneCam':    'SIGNAL',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>

      <div className="ui-overlay">
        <div className="status-bar">HSDX_OS // USER_LOGIN</div>
        {camList
          .filter(name => cameraLabels[name])
          .map((name) => (
            <button
              key={name}
              className="cam-button"
              onClick={() => window.transitionToCamera(name)}
              onMouseEnter={() => { if (Object.values(GROUP_TO_CAM).includes(name)) setHoveredCam(name); }}
              onMouseLeave={() => setHoveredCam(null)}
            >
              {cameraLabels[name]}
            </button>
          ))}
      </div>

      <Canvas
        dpr={0.65}
        gl={{ antialias: false }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Suspense fallback={<Html center><div style={{ color: 'white', fontFamily: 'monospace' }}>MOUNTING...</div></Html>}>
          <SceneContent
            setAvailableCameras={setCamList}
            hoveredCam={hoveredCam}
            setHoveredCam={setHoveredCam}
            currentCam={currentCam}
            setCurrentCam={setCurrentCam}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
