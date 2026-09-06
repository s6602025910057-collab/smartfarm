"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

export type BananaPlantProps = {
  /** 0 = struggling, 1 = thriving */
  health: number;
  soil?: number;
  water?: number;
  light?: number;
  stress?: number;
};

type ZoomApi = { zoomIn: () => void; zoomOut: () => void };

const ZOOM_STEP = 0.8;
const MIN_DISTANCE = 1.6;
const MAX_DISTANCE = 11;

function CameraZoomRig({ apiRef }: { apiRef: React.RefObject<ZoomApi | null> }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as (THREE.Object3D & { target: THREE.Vector3; update: () => void }) | null;

  useEffect(() => {
    if (!controls) return;
    const move = (factor: number) => {
      const direction = camera.position.clone().sub(controls.target);
      const distance = THREE.MathUtils.clamp(direction.length() * factor, MIN_DISTANCE, MAX_DISTANCE);
      camera.position.copy(controls.target).add(direction.setLength(distance));
      controls.update();
    };
    apiRef.current = { zoomIn: () => move(ZOOM_STEP), zoomOut: () => move(1 / ZOOM_STEP) };
    return () => { apiRef.current = null; };
  }, [camera, controls, apiRef]);

  return null;
}

function ZoomButtons({ apiRef }: { apiRef: React.RefObject<ZoomApi | null> }) {
  const buttonClass = "grid size-9 place-items-center rounded-md border border-line bg-surface/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-surface";
  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-2">
      <button type="button" aria-label="Zoom in" title="Zoom in" className={buttonClass} onClick={() => apiRef.current?.zoomIn()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M8 11h6M11 8v6" strokeLinecap="round" /></svg>
      </button>
      <button type="button" aria-label="Zoom out" title="Zoom out" className={buttonClass} onClick={() => apiRef.current?.zoomOut()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M8 11h6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

function SensorPlant({ health, soil = 0.6, water = 0.7, light = 0.75, stress = 0.2 }: BananaPlantProps) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const clamped = THREE.MathUtils.clamp(health, 0, 1);
  const { scene } = useGLTF("/models/banana-tree.glb");

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 1.9 / Math.max(size.x, size.y, size.z);
    const wrapper = new THREE.Group();
    cloned.position.sub(center);
    cloned.position.y += size.y / 2;
    wrapper.add(cloned);
    wrapper.scale.setScalar(scale);
    return { wrapper };
  }, [scene]);

  useFrame((state) => {
    if (!group.current || !inner.current) return;
    const t = state.clock.elapsedTime;
    const vitality = 0.35 + clamped * 0.95;
    const waterFlex = 0.6 + water * 0.6;
    const lightDrive = 0.55 + light * 0.9;
    const stressDroop = stress * 0.06;

    group.current.rotation.z = Math.sin(t * (0.55 + light * 0.5)) * 0.02 * vitality * waterFlex;
    group.current.rotation.x = Math.cos(t * 0.42) * 0.012 * vitality - stressDroop;
    group.current.rotation.y = Math.sin(t * 0.3) * 0.006 * lightDrive;
    inner.current.position.y = Math.sin(t * (0.9 + light * 0.7)) * 0.018 * (0.35 + clamped);
    inner.current.scale.y = 1 - stress * 0.025 + Math.sin(t * 0.7) * 0.002;
  });

  return (
    <group ref={group} position={[0, -0.95, 0]}>
      <group ref={inner}>
        <primitive object={model.wrapper} castShadow receiveShadow />
      </group>
    </group>
  );
}

function Ground({ light }: { light: number }) {
  const bright = THREE.MathUtils.clamp(light, 0, 1);
  return (
    <>
      <mesh position={[0, -1.0, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 2.2, 0.3, 32]} />
        <meshStandardMaterial color={new THREE.Color().lerpColors(new THREE.Color("#54452f"), new THREE.Color("#b09a76"), bright)} roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.18, 0]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.4, 0.12, 40]} />
        <meshStandardMaterial color={new THREE.Color().lerpColors(new THREE.Color("#243522"), new THREE.Color("#8fbe78"), bright)} roughness={1} />
      </mesh>
    </>
  );
}

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

export default function BananaPlantScene({ health, soil = 0.6, water = 0.7, light = 0.75, stress = 0.2 }: BananaPlantProps) {
  const isLight = useIsLightTheme();
  const zoomApi = useRef<ZoomApi | null>(null);
  const lightLevel = 0.55 + light * 1.25;

  return (
    <div className="relative h-full w-full" data-testid="banana-plant-scene">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2.1, 1.4, 2.4], fov: 45 }} style={{ width: "100%", height: "100%" }}>
        <color attach="background" args={[isLight ? "#e8f0e4" : "#050b14"]} />
        <fog attach="fog" args={[isLight ? "#e8f0e4" : "#050b14", 10, 22]} />
        <ambientLight intensity={(isLight ? 0.75 : 0.42) + light * 0.3} />
        <hemisphereLight args={[isLight ? "#dfe9ff" : "#334155", isLight ? "#8a7a5a" : "#1a140c", (isLight ? 0.85 : 0.5) + water * 0.15]} />
        <directionalLight position={[4, 7, 3]} intensity={(isLight ? 1.45 : 1.0) * lightLevel} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-4, 3, -3]} intensity={0.2 + soil * 0.25} color="#7fd4a8" />

        <Suspense fallback={<Html center><div className="rounded-md border border-line bg-surface/90 px-3 py-2 text-xs text-muted backdrop-blur">Loading banana tree…</div></Html>}>
          <SensorPlant health={health} soil={soil} water={water} light={light} stress={stress} />
        </Suspense>
        <Ground light={light} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.5 + water * 0.12} scale={9} blur={2.6} far={3.5} />
        <OrbitControls enablePan enableZoom minDistance={MIN_DISTANCE} maxDistance={MAX_DISTANCE} maxPolarAngle={Math.PI / 2.05} autoRotate={false} target={[0, 0.15, 0]} makeDefault />
        <CameraZoomRig apiRef={zoomApi} />
      </Canvas>
      <ZoomButtons apiRef={zoomApi} />
    </div>
  );
}
