import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ── Constants ─────────────────────────────────────────────────────────────────
const BLADE_COUNT  = 1800;
const SPREAD_X     = 44;
const SPREAD_Z     = 6;
const BLADE_H_MIN  = 4.8;
const BLADE_H_MAX  = 6.5;
const BASE_Y       = -5.2;
const TIP_Y        = BASE_Y + (BLADE_H_MIN + BLADE_H_MAX) / 2; // ≈ 0.45

const WIND_STRENGTH = 0.24;
const WIND_SPEED    = 0.55;
const WIND_WAVE     = 0.09;

// ── Color gradient texture ────────────────────────────────────────────────────
function createColorTexture() {
  const c = document.createElement('canvas');
  c.width = 1; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 64, 0, 0);
  g.addColorStop(0.00, '#0a1a0d');
  g.addColorStop(0.30, '#122b14');
  g.addColorStop(0.65, '#1a3d1c');
  g.addColorStop(1.00, '#2a5c2e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1, 64);
  return new THREE.CanvasTexture(c);
}

// ── Soft circle sprite for particles ─────────────────────────────────────────
function createCircleTexture() {
  const s = 64, c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const r = s / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.35,'rgba(255,255,255,0.9)');
  g.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

// ── Blade geometry: stretched-sphere ellipsoid, base at y=0 tip at y=1 ───────
function createBladeGeo() {
  const geo = new THREE.SphereGeometry(0.5, 9, 6);
  geo.translate(0, 0.5, 0);
  return geo;
}

// ── Grass field with velocity-based mouse wind ────────────────────────────────
function GrassField({ mouseWorld }) {
  const meshRef     = useRef();
  const dummy       = useMemo(() => new THREE.Object3D(), []);
  // Lerped mouse-wind influence (scalar, represents a local lean offset)
  const mouseWind   = useRef(0);

  const blades = useMemo(() => {
    const arr = [];
    for (let i = 0; i < BLADE_COUNT; i++) {
      arr.push({
        x:        (Math.random() - 0.5) * SPREAD_X,
        z:        -(Math.random() * SPREAD_Z),
        h:        BLADE_H_MIN + Math.random() * (BLADE_H_MAX - BLADE_H_MIN),
        jitter:   (Math.random() - 0.5) * 0.03,
        baseLean: (Math.random() - 0.5) * 0.05,
      });
    }
    return arr;
  }, []);

  const colorTexture = useMemo(() => createColorTexture(), []);
  const bladeGeo     = useMemo(() => createBladeGeo(),     []);

  useFrame((_, delta) => {
    const t  = performance.now() / 1000;
    const mw = mouseWorld.current;

    // ── Mouse velocity → smooth wind influence ──────────────────────────────
    // Target influence = mouse vx * scale (clamped to prevent extremes)
    const targetInfluence = mw.active
      ? Math.max(-0.18, Math.min(0.18, mw.vx * 0.018))
      : 0;

    // Lerp: fast when mouse active, slow return to zero when gone
    const lerpRate = mw.active ? 0.10 : 0.025;
    mouseWind.current += (targetInfluence - mouseWind.current) * lerpRate;

    // ── Update blade matrices ───────────────────────────────────────────────
    blades.forEach((b, i) => {
      // Coherent wind wave (same direction for all, slight per-blade jitter)
      const wind = Math.sin(t * WIND_SPEED + b.x * WIND_WAVE + b.jitter) * WIND_STRENGTH;

      // Gaussian proximity to mouse X — influence fades with distance
      const gaussRadius = 5.0;
      const dx = b.x - mw.x;
      const proximity = mw.active
        ? Math.exp(-(dx * dx) / (gaussRadius * gaussRadius))
        : 0;

      const lean = b.baseLean + wind + mouseWind.current * proximity * 6;

      dummy.position.set(b.x, BASE_Y, b.z);
      dummy.rotation.order = 'YXZ';
      dummy.rotation.y = 0;
      dummy.rotation.x = lean;
      dummy.rotation.z = 0;
      dummy.scale.set(0.055, b.h, 0.055);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[bladeGeo, null, BLADE_COUNT]} frustumCulled={false}>
      <meshLambertMaterial map={colorTexture} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ── Particle field ─────────────────────────────────────────────────────────────
const P_COUNT = 300;

const SECTION_PARTICLE_COLORS = {
  null:    [0.55, 0.89, 0.77], // mint green (home)
  games:   [0.96, 0.58, 0.24], // orange
  music:   [0.35, 0.62, 1.00], // blue
  visual:  [0.72, 0.49, 1.00], // purple
};

function ParticleField({ mouseWorld, activeSection }) {
  const geoRef    = useRef();
  const positions = useRef(new Float32Array(P_COUNT * 3));
  const velocities = useRef(new Float32Array(P_COUNT * 3));
  const lives     = useRef(new Float32Array(P_COUNT));
  const colors      = useRef(new Float32Array(P_COUNT * 3));
  const nextSlot    = useRef(0);
  const colorsDirty = useRef(true);

  // Update all particle colors when section changes
  useEffect(() => {
    const rgb = SECTION_PARTICLE_COLORS[activeSection] ?? SECTION_PARTICLE_COLORS[null];
    const c = colors.current;
    for (let i = 0; i < P_COUNT; i++) {
      c[i*3]=rgb[0]; c[i*3+1]=rgb[1]; c[i*3+2]=rgb[2];
    }
    colorsDirty.current = true;
  }, [activeSection]);

  const circleTex = useMemo(() => createCircleTexture(), []);

  useFrame((_, delta) => {
    const pos  = positions.current;
    const vel  = velocities.current;
    const life = lives.current;
    const mw   = mouseWorld.current;

    // Spawn when mouse is active in grass zone
    if (mw.active) {
      const spawnN = 12;
      for (let s = 0; s < spawnN; s++) {
        const idx = nextSlot.current % P_COUNT;
        nextSlot.current++;
        const i3 = idx * 3;
        pos[i3]   = mw.x + (Math.random() - 0.5) * 2.0;
        pos[i3+1] = TIP_Y + (Math.random() - 0.5) * 0.3;
        pos[i3+2] = -(Math.random() * 2);
        vel[i3]   = mw.vx * 0.02 + (Math.random() - 0.5) * 0.04;
        vel[i3+1] = 0.025 + Math.random() * 0.03;
        vel[i3+2] = 0;
        life[idx] = 1.2 + Math.random() * 0.6;
      }
    }

    // Update all particles
    for (let i = 0; i < P_COUNT; i++) {
      const i3 = i * 3;
      if (life[i] <= 0) {
        pos[i3] = 0; pos[i3+1] = -9999; pos[i3+2] = 0;
        continue;
      }
      life[i] -= delta;
      pos[i3]   += vel[i3]   * delta * 60;
      pos[i3+1] += vel[i3+1] * delta * 60;
      if (life[i] <= 0) { pos[i3+1] = -9999; }
    }

    if (geoRef.current) {
      geoRef.current.attributes.position.needsUpdate = true;
      if (colorsDirty.current) {
        geoRef.current.attributes.color.needsUpdate = true;
        colorsDirty.current = false;
      }
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" array={positions.current} count={P_COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color"    array={colors.current}    count={P_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.22}
        sizeAttenuation
        transparent
        depthWrite={false}
        map={circleTex}
        alphaTest={0.01}
      />
    </points>
  );
}


// ── Mouse tracker: position + velocity via window listener ────────────────────
function MouseTracker({ mouseWorld }) {
  const { camera, gl } = useThree();
  const plane     = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 1), []); // vertical plane at z=-1
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const target    = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let prevX = 0, prevTime = 0;

    const onMove = (e) => {
      const rect = gl.domElement.getBoundingClientRect();
      if (e.clientY < rect.top) {
        mouseWorld.current.active = false;
        return;
      }
      const nx =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: nx, y: ny }, camera);
      if (raycaster.ray.intersectPlane(plane, target)) {
        const now = performance.now() / 1000;
        const dt  = now - prevTime;
        if (dt > 0.001) {
          // World-space horizontal velocity (units/sec)
          mouseWorld.current.vx = (target.x - prevX) / dt;
        }
        prevX    = target.x;
        prevTime = now;
        mouseWorld.current.x      = target.x;
        mouseWorld.current.z      = target.z;
        mouseWorld.current.active = true;
      }
    };
    const onLeave = () => {
      mouseWorld.current.active = false;
      mouseWorld.current.vx     = 0;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [camera, plane, raycaster, target, mouseWorld]);

  return null;
}

// ── GrassScene ────────────────────────────────────────────────────────────────
export default function GrassScene({ activeSection }) {
  const mouseWorld = useRef({ x: 0, z: 0, vx: 0, active: false });

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: '26vh',
      zIndex: 10,
      pointerEvents: 'none',
    }}>


      {/* Earth strip */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '14px',
        background: 'linear-gradient(90deg, #060d07, #0d1a0e, #0a1509, #060d07)',
        zIndex: 3,
      }} />

      <Canvas
        camera={{ position: [0, 0.6, 5.5], fov: 38, near: 0.1, far: 120 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
        onCreated={({ camera }) => camera.lookAt(0, 0.6, 0)}
      >
        <ambientLight intensity={1.8} color="#1a3d2a" />
        <directionalLight position={[6, 10, 4]}  intensity={0.6} color="#8de4c5" />
        <directionalLight position={[-5, 8, 10]} intensity={0.2} color="#4a8a6a" />

        <MouseTracker mouseWorld={mouseWorld} />
        <GrassField    mouseWorld={mouseWorld} />
        <ParticleField mouseWorld={mouseWorld} activeSection={activeSection} />
      </Canvas>
    </div>
  );
}
