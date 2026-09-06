"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

export type BananaPlantProps = {
  /** 0 = struggling, 1 = thriving */
  health: number;
};

/* ------------------------------ zoom control ------------------------------ */

type ZoomApi = { zoomIn: () => void; zoomOut: () => void };

const ZOOM_STEP = 0.8; // each click scales the camera distance by this
const MIN_DISTANCE = 1.6;
const MAX_DISTANCE = 11;

function CameraZoomRig({ apiRef }: { apiRef: React.RefObject<ZoomApi | null> }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as
    | (THREE.Object3D & { target: THREE.Vector3; update: () => void })
    | null;

  useEffect(() => {
    if (!controls) return;

    const move = (factor: number) => {
      const direction = camera.position.clone().sub(controls.target);
      const distance = THREE.MathUtils.clamp(
        direction.length() * factor,
        MIN_DISTANCE,
        MAX_DISTANCE,
      );
      camera.position.copy(controls.target).add(direction.setLength(distance));
      controls.update();
    };

    apiRef.current = {
      zoomIn: () => move(ZOOM_STEP),
      zoomOut: () => move(1 / ZOOM_STEP),
    };
    return () => {
      apiRef.current = null;
    };
  }, [camera, controls, apiRef]);

  return null;
}

function ZoomButtons({ apiRef }: { apiRef: React.RefObject<ZoomApi | null> }) {
  const buttonClass =
    "grid size-9 place-items-center rounded-md border border-line bg-surface/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-surface";

  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-2">
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        className={buttonClass}
        onClick={() => apiRef.current?.zoomIn()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8 11h6M11 8v6" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        className={buttonClass}
        onClick={() => apiRef.current?.zoomOut()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8 11h6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------- sensor-driven plant ------------------------- */

function SensorPlant({ health }: { health: number }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const clamped = Math.min(1, Math.max(0, health));
  const { scene } = useGLTF("/models/banana-tree.glb");

  // Clone once so material tweaks don't leak between renders.
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    // Normalize: model is ~4.7m wide and ~3.8m tall (min.y=-2.66 is below origin).
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 1.9 / Math.max(size.x, size.y, size.z);
    const wrapper = new THREE.Group();
    cloned.position.sub(center);
    cloned.position.y += size.y / 2; // sit on ground
    wrapper.add(cloned);
    wrapper.scale.setScalar(scale);
    return { wrapper, height: size.y * scale };
  }, [scene]);

  // Wind sway on the whole plant.
  useFrame((state) => {
    if (!group.current || !inner.current) return;
    const t = state.clock.elapsedTime;
    const vigor = 0.4 + clamped * 0.9;
    group.current.rotation.z = Math.sin(t * 0.8) * 0.018 * vigor;
    group.current.rotation.x = Math.cos(t * 0.6) * 0.012 * vigor;
    // Subtle "breathing" bob.
    inner.current.position.y = Math.sin(t * 1.4) * 0.02 * (0.3 + clamped);
  });

  return (
    <group ref={group} position={[0, -0.95, 0]}>
      <group ref={inner}>
        <primitive object={model.wrapper} castShadow receiveShadow />
      </group>
    </group>
  );
}

/* --------------------------------- ground --------------------------------- */

function Ground({ light }: { light: boolean }) {
  return (
    <>
      <mesh position={[0, -1.0, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 2.2, 0.3, 32]} />
        <meshStandardMaterial color={light ? "#b09a76" : "#54452f"} roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.18, 0]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.4, 0.12, 40]} />
        <meshStandardMaterial color={light ? "#8fbe78" : "#375233"} roughness={1} />
      </mesh>
    </>
  );
}

/* ------------------------------ theme helper ------------------------------ */

function useIsLightTheme() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsLight(root.dataset.theme === "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return isLight;
}

/* ---------------------------------- scene --------------------------------- */

export default function BananaPlantScene({ health }: BananaPlantProps) {
  const isLight = useIsLightTheme();
  const zoomApi = useRef<ZoomApi | null>(null);

  return (
    <div className="relative h-full w-full" data-testid="banana-plant-scene">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2.1, 1.4, 2.4], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={[isLight ? "#e8f0e4" : "#050b14"]} />
        <fog attach="fog" args={[isLight ? "#e8f0e4" : "#050b14", 10, 22]} />

        <ambientLight intensity={isLight ? 0.8 : 0.5} />
        <hemisphereLight
          args={[isLight ? "#dfe9ff" : "#334155", isLight ? "#8a7a5a" : "#1a140c", isLight ? 0.9 : 0.55]}
        />
        <directionalLight
          position={[4, 7, 3]}
          intensity={isLight ? 1.7 : 1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-4, 3, -3]} intensity={0.35} color="#7fd4a8" />

        <Suspense
          fallback={
            <Html center>
              <div className="rounded-md border border-line bg-surface/90 px-3 py-2 text-xs text-muted backdrop-blur">
                Loading banana tree…
              </div>
            </Html>
          }
        >
          <SensorPlant health={health} />
        </Suspense>
        <Ground light={isLight} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={9} blur={2.6} far={3.5} />

        <OrbitControls
          enablePan
          enableZoom
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={false}
          target={[0, 0.15, 0]}
          makeDefault
        />
        <CameraZoomRig apiRef={zoomApi} />
      </Canvas>
      <ZoomButtons apiRef={zoomApi} />
    </div>
  );
}
