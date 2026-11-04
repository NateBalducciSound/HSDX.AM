import { useRef, useMemo, useState, Suspense, Component, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, Billboard, Html } from '@react-three/drei';

class ModelErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? null : this.props.children; }
}
import * as THREE from 'three';

const OBELISKS = [
  { position: [-2.2,  1.8,  0 ], rotSpeed: 0.18, floatPhase: 0,   scale: 1.0, label: 'GAMES',  img: '/Games.png',   glb: '/Controller.glb',  glbRotation: [0, 0, 0.3],           labelY: -1.3, haloY: -0.6 },
  { position: [ 1.4,  0.8, -1 ], rotSpeed: 0.12, floatPhase: 1.2, scale: 1.0, label: 'MUSIC',  img: '/Music.png',   glb: '/Tambourine.glb', glbRotation: [0, 0, Math.PI + 0.3], labelY: -0.6, haloY: -0.3 },
  { position: [-1.0, -0.6, -2 ], rotSpeed: 0.22, floatPhase: 2.5, scale: 1.0, label: 'VISUAL', img: '/Visuals.png', haloY: -0.3, glb: '/PCMonitor.glb?v=2', screenTex: '/HSDX_ASCIILight.png' },
  { position: [ 3.4, -1.5, -3 ], rotSpeed: 0.15, floatPhase: 0.8, scale: 0.1, label: 'INFO',   img: '/Info.png',    haloY: -0.3, glb: '/nav_buttons_2.glb', nodeName: 'Btn_Info', glass: true, hitScale: 0.4 },
];

// Each letter rendered individually with sine wave offset on hover
const FIXED_W = 1.2;

class HaloMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      depthWrite: false,
      uniforms: { opacity: { value: 0.25 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float opacity;
        void main() {
          vec2 c = vUv - 0.5;
          float dist = length(c) * 2.0;
          float alpha = smoothstep(0.6, 0.0, dist) * opacity;
          gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
        }
      `,
    });
  }
}

function WaveLabel({ img, labelY = -1.5, hidden }) {
  const portalRef = useRef(document.body);
  if (hidden) return null;
  return (
    <Html
      position={[0, labelY, 0]}
      center
      occlude={false}
      portal={portalRef}
      style={{ pointerEvents: 'none' }}
    >
      <img src={img} style={{ width: 96, imageRendering: 'auto' }} />
    </Html>
  );
}

function GLBModel({ path, nodeName, rotation = [0, 0, 0], glass = false, screenTex }) {
  const { scene, nodes } = useGLTF(path);
  const loadedTex = screenTex ? useTexture(screenTex) : null;
  const cloned = useMemo(() => {
    const src = nodeName ? nodes[nodeName] : scene;
    if (!src) return null;
    const c = src.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    c.position.sub(center);
    c.scale.setScalar(1 / maxDim);
    c.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material.side = THREE.DoubleSide;
      if (child.name === 'Screen') {
        child.material = new THREE.MeshStandardMaterial({
          color: '#000000',
          emissive: '#000000',
          ...(loadedTex ? { emissiveMap: loadedTex, emissiveIntensity: 1.0 } : {}),
          side: THREE.DoubleSide,
          roughness: 0.1,
          metalness: 0.0,
        });
      }
      if (glass) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#5ecfaa'),
          transmission: 0.55,
          roughness: 0.08,
          metalness: 0.0,
          thickness: 0.5,
          transparent: true,
          opacity: 0.9,
          envMapIntensity: 1.0,
          side: THREE.DoubleSide,
        });
        const edgeMat = new THREE.LineBasicMaterial({ color: '#a0ffe0', transparent: true, opacity: 0.85 });
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 15), edgeMat);
        child.add(edges);
      }
    });
    return c;
  }, [scene, nodes, nodeName, glass]);
  if (!cloned) return null;
  return <primitive object={cloned} rotation={rotation} />;
}

function Obelisk({ position, rotSpeed, floatPhase, scale, label, img, glb, nodeName, glass, glbRotation, labelY, haloY = -0.3, hitScale, screenTex, onSelect, hideLabels }) {
  const [hovered, setHovered] = useState(false);
  const floatRef = useRef();
  const spinRef  = useRef();

  // Placeholder geometry — swap with useGLTF when models are ready
  const edges = useMemo(() => {
    const r = 0.28, h = 1.6, tip = 0.55, segs = 6;
    const verts = [];
    const hexRing = (y) => Array.from({ length: segs }, (_, i) => {
      const a = (i / segs) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    });
    const top = hexRing(h / 2), bot = hexRing(-h / 2);
    const apex  = new THREE.Vector3(0,  h / 2 + tip, 0);
    const nadir = new THREE.Vector3(0, -h / 2 - tip, 0);
    const push = (a, b) => verts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    for (let i = 0; i < segs; i++) {
      const ni = (i + 1) % segs;
      push(top[i], top[ni]); push(bot[i], bot[ni]);
      push(top[i], bot[i]);
      push(top[i], apex);    push(bot[i], nadir);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed = hovered ? 3 : 1;
    if (floatRef.current) {
      floatRef.current.position.y = position[1] + Math.sin(t * 0.6 * speed + floatPhase) * 0.12;
      floatRef.current.position.x = position[0] + Math.sin(t * 0.4 * speed + floatPhase * 1.3) * 0.08;
    }
    if (spinRef.current)  spinRef.current.rotation.y += delta * rotSpeed * speed;
  });

  return (
    <group ref={floatRef} position={position}>
      {/* Radial dark halo */}
      <Billboard>
        <mesh position={[0, haloY, -0.1]} raycast={() => null}>
          <planeGeometry args={[3.5, 4]} />
          <primitive object={new HaloMaterial()} attach="material" />
        </mesh>
      </Billboard>

      <group ref={spinRef} scale={scale}>
        {glb ? (
          <ModelErrorBoundary>
            <Suspense fallback={null}>
              <GLBModel path={glb} nodeName={nodeName} rotation={glbRotation} glass={glass} screenTex={screenTex} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <lineSegments geometry={edges}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.55} />
          </lineSegments>
        )}
      </group>
      <WaveLabel img={img} labelY={labelY} hidden={hideLabels} />
      {/* Hit area — tightly sized to object */}
      <mesh
        visible={false}
        scale={hitScale ?? scale * 1.2}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.fov = size.width < 768 ? 75 : 50;
    camera.updateProjectionMatrix();
  }, [size.width]);
  return null;
}

function ObeliskList({ onSelect, hideLabels }) {
  const layout = useMobilePositions();
  return layout.map((o, i) => (
    <Obelisk key={i} {...o} onSelect={() => onSelect(i)} hideLabels={hideLabels} />
  ));
}

function useMobilePositions() {
  const { size } = useThree();
  const mobile = size.width < 768;
  if (!mobile) return OBELISKS;
  return [
    { ...OBELISKS[0], position: [-1.4,  1.8,  0] },
    { ...OBELISKS[1], position: [ 1.4,  0.6, -1] },
    { ...OBELISKS[2], position: [-1.4, -0.6, -2] },
    { ...OBELISKS[3], position: [ 1.4, -1.8, -3] },
  ];
}

export default function Obelisks({ onSelect, hideLabels }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 50 }}
      dpr={0.7}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', imageRendering: 'pixelated' }}
      gl={{ antialias: false }}
    >
      <ResponsiveCamera />
      <color attach="background" args={['#f0ede8']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <ObeliskList onSelect={onSelect} hideLabels={hideLabels} />
    </Canvas>
  );
}
