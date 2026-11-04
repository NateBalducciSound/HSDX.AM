import { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const ACCENT_COLORS = {
  null:    '#5ecfaa',
  games:   '#f4943e',
  music:   '#5a9eff',
  visual:  '#b87eff',
};

function glassMaterial(hex) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    transmission: 0.55,
    roughness: 0.08,
    metalness: 0.0,
    thickness: 0.5,
    transparent: true,
    opacity: 0.9,
    envMapIntensity: 1.0,
    side: THREE.DoubleSide,
  });
}

// ── 3D model that spins on hover ──────────────────────────────────────────────
function SpinModel({ nodeName, hovered, correctionRotation = [0, 0, 0], nudgeY = 0, accentColor }) {
  const { nodes } = useGLTF('/gallery_buttons.glb');
  const spinRef = useRef();

  const cloned = useMemo(() => {
    const n = nodes[nodeName];
    if (!n) return null;
    const c = n.clone(true);
    c.position.set(0, 0, 0);
    return c;
  }, [nodes, nodeName]);

  // Apply/update glass material + edge lines when accent color changes
  useEffect(() => {
    if (!cloned) return;
    const mat = glassMaterial(accentColor);
    const color = new THREE.Color(accentColor);
    // Brighten edge color slightly
    const edgeColor = color.clone().lerp(new THREE.Color('#ffffff'), 0.4);
    const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.85 });

    cloned.traverse(child => {
      if (!child.isMesh) return;
      child.material = mat;
      // Remove old edge children to avoid duplicates on re-run
      child.children = child.children.filter(c => !c.__isEdge);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(child.geometry, 15),
        edgeMat,
      );
      edges.__isEdge = true;
      child.add(edges);
    });
  }, [cloned, accentColor]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y += delta * (hovered ? 2.5 : 0.4);
  });

  if (!cloned) return null;

  return (
    <group ref={spinRef} position={[0, nudgeY, 0]}>
      <group rotation={correctionRotation}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

// ── Mini canvas icon ──────────────────────────────────────────────────────────
function ModelIcon({ nodeName, hovered, correctionRotation, nudgeY = 0, accentColor }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 32 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={3} color="#e8f8f0" />
        <directionalLight position={[4, 6, 5]} intensity={1.8} />
        <directionalLight position={[-3, 2, 3]} intensity={0.6} color="#c0eaff" />
        <Suspense fallback={null}>
          <SpinModel
            nodeName={nodeName}
            hovered={hovered}
            correctionRotation={correctionRotation}
            nudgeY={nudgeY}
            accentColor={accentColor}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ── Glass circle button with 3D icon inside ───────────────────────────────────
function GalButtons({ nodeName, label, onClick, active, correctionRotation = [0, 0, 0], nudgeY = 0, accentColor }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className={`nav-circle${active ? ' active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={label}
      title={label}
      style={{ overflow: 'hidden' }}
    >
      <ModelIcon
        nodeName={nodeName}
        hovered={hovered}
        correctionRotation={correctionRotation}
        nudgeY={nudgeY}
        accentColor={accentColor}
      />
      {hovered && <span className="nav-circle-tip">{label}</span>}
    </button>
  );
}

// ── Three nav buttons ─────────────────────────────────────────────────────────
export default function GalButtons({ onHome, onInfo, onContact, activeSection }) {
  const accentColor = ACCENT_COLORS[activeSection] ?? ACCENT_COLORS[null];

  return (
    <div style={{
      position: 'fixed',
      middle: 0,
      middle: 0,
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      zIndex: 100,
    }}>
      <3DButtons nodeName="Btn_Game"    label="Games"    onClick={onHome}    active correctionRotation={[0, 0, 0]} nudgeY={-0.25} accentColor={accentColor} />
      <3DButtons nodeName="Btn_Music"    label="Music"    onClick={onInfo}          nudgeY={0.1}                                   accentColor={accentColor} />
      <3DButtons nodeName="Btn_Visual" label="Visual" onClick={onContact}       nudgeY={0.1}                                   accentColor={accentColor} />
    </div>
  );
}

useGLTF.preload('/gallery_buttons.glb');
