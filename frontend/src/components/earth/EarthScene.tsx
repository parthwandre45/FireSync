import React, { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EarthGlobe } from './EarthGlobe';
import { SatellitesOrbit } from '../satellites/SatelliteOrbit';
import { Starfield } from './Starfield';

interface SceneContentProps {
  scrollProgress: number; // 0.0 to 1.0
  selectedSatellite: 'MODIS' | 'VIIRS' | null;
  onSelectSatellite?: (id: 'MODIS' | 'VIIRS' | null) => void;
  isMapExpanded?: boolean;
  sunDirection: THREE.Vector3;
}

const SceneContent: React.FC<SceneContentProps> = ({
  scrollProgress,
  selectedSatellite,
  onSelectSatellite,
  isMapExpanded = false,
  sunDirection,
}) => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!earthGroupRef.current) return;

    // Six-phase continuous kinematics for Earth across 3 sections
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.0;

    const isMobile = window.innerWidth < 768;
    const section2X = isMobile ? 1.05 : 2.65;
    const section2Y = isMobile ? 0.35 : 0;
    const section2Scale = isMobile ? 1.15 : 1.25;

    const peakScale = isMobile ? 2.1 : 2.35;
    const peakZ = isMobile ? 0.25 : 0.35;

    // Section 3: Earth made small & elegant in center
    const section3Scale = isMobile ? 0.76 : 0.94;
    const section3X = 0;
    const section3Y = isMobile ? -0.10 : 0.02;

    // Swapped coordinates when user expands map in Section 3:
    // Earth glides over to the Left column, docking precisely inside the "3D PLANET DOCKED VIEW" reticle
    let swappedX = isMobile ? 0 : -2.85;
    let swappedY = isMobile ? 1.05 : 0.45;
    let swappedScale = isMobile ? 0.28 : 0.23;

    if (isMapExpanded) {
      const targetEl =
        document.getElementById('planet-docked-view-target') ||
        document.getElementById('planet-docked-view-box');

      if (targetEl && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const pixelX = rect.left + rect.width / 2;
          const pixelY = rect.top + rect.height / 2;

          const ndcX = (pixelX / window.innerWidth) * 2 - 1;
          const ndcY = -(pixelY / window.innerHeight) * 2 + 1;

          const pCamera = camera as THREE.PerspectiveCamera;
          const vFovRad = (pCamera.fov * Math.PI) / 180;
          const visibleHeight = 2 * Math.tan(vFovRad / 2) * pCamera.position.z;
          const visibleWidth = visibleHeight * pCamera.aspect;

          swappedX = (ndcX * visibleWidth) / 2;
          swappedY = (ndcY * visibleHeight) / 2;

          // Fit globe cleanly inside the circular reticle
          const targetDiameterPx = Math.min(rect.width * 0.88, rect.height * 0.88, 120);
          const targetWorldDiam = (targetDiameterPx / window.innerHeight) * visibleHeight;
          swappedScale = targetWorldDiam / 4.0; // EarthGlobe radius = 2.0 -> diameter = 4.0
        }
      }
    }

    if (scrollProgress <= 0.20) {
      // 1. Hero Hold (Section 1)
      targetScale = 1.0;
      targetZ = 0;
      targetX = 0;
      targetY = 0;
    } else if (scrollProgress <= 0.35) {
      // 2. Approach Zoom & Planetary Descent
      const t = (scrollProgress - 0.20) / 0.15;
      const ease = t * t * (3 - 2 * t);
      targetScale = 1.0 + ease * (peakScale - 1.0);
      targetZ = ease * peakZ;
      targetX = 0;
      targetY = 0;
    } else if (scrollProgress <= 0.50) {
      // 3. Move to Right for Section 2
      const t = (scrollProgress - 0.35) / 0.15;
      const ease = t * t * (3 - 2 * t);
      targetScale = peakScale - ease * (peakScale - section2Scale);
      targetZ = peakZ * (1 - ease);
      targetX = ease * section2X;
      targetY = ease * section2Y;
    } else if (scrollProgress <= 0.68) {
      // 4. Section 2 Hold (Earth on Right, Content on Left)
      targetScale = section2Scale;
      targetZ = 0;
      targetX = section2X;
      targetY = section2Y;
    } else if (scrollProgress <= 0.84) {
      // 5. Transition Section 2 -> Section 3: Smooth horizontal glide to Center & adjust to small scale
      const t = (scrollProgress - 0.68) / 0.16;
      const ease = t * t * (3 - 2 * t);
      const destX = isMapExpanded ? swappedX : section3X;
      const destY = isMapExpanded ? swappedY : section3Y;
      const destScale = isMapExpanded ? swappedScale : section3Scale;

      targetScale = section2Scale + ease * (destScale - section2Scale);
      targetZ = 0;
      targetX = section2X - ease * (section2X - destX);
      targetY = section2Y - ease * (section2Y - destY);
    } else {
      // 6. Section 3: Command Center Hold
      if (isMapExpanded) {
        // Swapped to left column!
        targetScale = swappedScale;
        targetZ = 0;
        targetX = swappedX;
        targetY = swappedY;
      } else {
        // Centered & compact
        targetScale = section3Scale;
        targetZ = 0;
        targetX = section3X;
        targetY = section3Y;
      }
    }

    // Smooth dampening for Earth position & scale
    earthGroupRef.current.position.x = THREE.MathUtils.lerp(
      earthGroupRef.current.position.x,
      targetX,
      0.08
    );
    earthGroupRef.current.position.y = THREE.MathUtils.lerp(
      earthGroupRef.current.position.y,
      targetY,
      0.08
    );
    earthGroupRef.current.position.z = THREE.MathUtils.lerp(
      earthGroupRef.current.position.z,
      targetZ,
      0.08
    );

    const currentScale = earthGroupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
    earthGroupRef.current.scale.set(newScale, newScale, newScale);
  });

  return (
    <>
      {/* 3D Earth Globe with dynamic rotation and realistic hotspots */}
      <group ref={earthGroupRef}>
        <EarthGlobe
          radius={2.0}
          rotationSpeed={0.24}
          sunDirection={sunDirection}
        />
      </group>

      {/* MODIS and VIIRS Satellites (Active in Hero and Stage 2, removed completely in Stage 3 / 3rd page) */}
      {(scrollProgress < 0.68 || selectedSatellite) && (
        <SatellitesOrbit
          scrollProgress={scrollProgress}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={onSelectSatellite}
        />
      )}
    </>
  );
};

// Fallback loader while textures are decoding
const SceneLoadingFallback: React.FC = () => {
  return (
    <mesh>
      <sphereGeometry args={[2.0, 32, 32]} />
      <meshBasicMaterial color="#081b3b" wireframe opacity={0.3} transparent />
    </mesh>
  );
};

interface EarthSceneProps {
  scrollProgress: number;
  selectedSatellite: 'MODIS' | 'VIIRS' | null;
  onSelectSatellite?: (id: 'MODIS' | 'VIIRS' | null) => void;
  isMapExpanded?: boolean;
}

export const EarthScene: React.FC<EarthSceneProps> = ({
  scrollProgress,
  selectedSatellite,
  onSelectSatellite,
  isMapExpanded = false,
}) => {
  const sunDirection = React.useMemo(
    () => new THREE.Vector3(-5, 4, 5).normalize(),
    []
  );

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      {/* Interactive Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
        className="w-full h-full"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Deep space ambient fill light - balanced for terrain readability and cosmic contrast */}
        <ambientLight color="#081628" intensity={0.28} />

        {/* Primary space directional sunlight - calibrated to avoid specular clipping and washed-out highlights */}
        <directionalLight
          position={[-5, 4, 5]}
          color="#ffffff"
          intensity={2.20}
        />

        {/* Soft, subtle deep space rim fill */}
        <directionalLight
          position={[5, -2, -2]}
          color="#0a182a"
          intensity={0.08}
        />

        {/* Deep space celestial starfield */}
        <Starfield count={1000} />

        {/* Persistent 3D Earth & Interactive Satellites */}
        <Suspense fallback={<SceneLoadingFallback />}>
          <SceneContent
            scrollProgress={scrollProgress}
            selectedSatellite={selectedSatellite}
            onSelectSatellite={onSelectSatellite}
            isMapExpanded={isMapExpanded}
            sunDirection={sunDirection}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
