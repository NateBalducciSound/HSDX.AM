iimport React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// --- 1. The Scene Loader & Camera Logic ---
function SceneContent({ scenePath }) {
  const { scene: loadedScene, cameras } = useGLTF(scenePath); // Note: useGLTF is preferred over ObjectLoader for web
  const mainCamRef = useRef();
  const [cameraMap, setCameraMap] = useState({});
  const { scene: globalScene } = useThree();

  useEffect(() => {
    const map = {};
    loadedScene.traverse((child) => {
      if (child.isCamera) {
        map[child.name] = child;
        child.visible = false;
      }
    });
    setCameraMap(map);

    // Initial transition to DefaultCam
    if (map['DefaultCam']) {
      transitionTo(map['DefaultCam'], 0);
    }

    // Attach to window for external HTML calls (as per your original script)
    window.transitionToCamera = (name, duration = 2) => {
      if (map[name]) transitionTo(map[name], duration);
    };
  }, [loadedScene]);

  const transitionTo = (target, duration) => {
    const targetPos = new THREE.Vector3();
    const targetQua = new THREE.Quaternion();
    target.getWorldPosition(targetPos);
    target.getWorldQuaternion(targetQua);

    gsap.to(mainCamRef.current.position, {
      x: targetPos.x, y: targetPos.y, z: targetPos.z,
      duration: duration,
      ease: "power2.inOut"
    });

    gsap.to(mainCamRef.current.quaternion, {
      x: targetQua.x, y: targetQua.y, z: targetQua.z, w: targetQua.w,
      duration: duration,
      ease: "power2.inOut",
      onUpdate: () => mainCamRef.current.updateProjectionMatrix()
    });
  };

  return (
    <>
      <PerspectiveCamera makeDefault ref={mainCamRef} fov={75} near={0.1} far={1000} />
      <primitive object={loadedScene} />
      
      {/* --- 2. The Contact Sheet (Paper) --- */}
      {/* Position this where your 'PhoneCam' is looking */}
      <mesh position={[2, 1, -5]} rotation={[0, -0.2, 0]}> 
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial color="#fff0d6" /> {/* Paper color */}
        
        {/* The "Magic" React Box */}
        <Html
          transform      // Makes the HTML move/rotate with the 3D mesh
          occlude        // Makes it hide behind other 3D objects
          distanceFactor={3}
          style={{
            width: '400px',
            padding: '20px',
            background: 'white',
            fontFamily: 'Courier New, monospace',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)'
          }}
        >
          <div className="contact-sheet">
            <h2 style={{ borderBottom: '2px solid black' }}>HSDX.AM</h2>
            <h3>Nathan Balducci</h3>
            <p style={{ fontSize: '14px' }}>
              Video Game Developer specializing in immersive audio environments 
              and interactive sci-fi consoles.
            </p>
            <hr />
            <form onSubmit={(e) => e.preventDefault()}>
              <label>Inquiry:</label><br/>
              <textarea placeholder="Tell me about your project..." style={{ width: '100%', height: '80px' }} />
              <button style={{ marginTop: '10px', cursor: 'pointer' }}>Send Email</button>
            </form>
          </div>
        </Html>
      </mesh>
    </>
  );
}

// --- 3. The Main App ---
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <React.Suspense fallback={<Html center>Loading Scene...</Html>}>
          <SceneContent scenePath="Scene.gltf" /> {/* Recommending .gltf over .json */}
        </React.Suspense>
      </Canvas>
    </div>
  );
}
