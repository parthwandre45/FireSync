import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { REALISTIC_HOTSPOTS } from './fireData';

interface FireHotspotsProps {
  radius?: number;
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Generate photorealistic active fire texture: small, sharp bright core, vivid orange flame, deep ember edge
function createRealFlameTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0.0, 'rgba(255, 235, 150, 1.0)'); // Sharp pin-point bright center
  gradient.addColorStop(0.20, 'rgba(255, 125, 0, 0.95)');  // Intense fire orange
  gradient.addColorStop(0.55, 'rgba(230, 45, 0, 0.70)');   // Vivid red-orange flame
  gradient.addColorStop(0.85, 'rgba(180, 15, 0, 0.20)');   // Deep crimson ember margin
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');        // Transparent falloff

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Soft restrained ground thermal glow texture to simulate subtle terrain illumination
function createThermalHaloTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0.0, 'rgba(255, 75, 0, 0.35)'); // Restrained soft warm glow
  gradient.addColorStop(0.45, 'rgba(210, 35, 0, 0.12)');
  gradient.addColorStop(0.80, 'rgba(140, 10, 0, 0.03)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const FireHotspots: React.FC<FireHotspotsProps> = ({ radius = 2.0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const corePointsRef = useRef<THREE.Points>(null);
  const flamePointsRef = useRef<THREE.Points>(null);
  const haloPointsRef = useRef<THREE.Points>(null);

  const flameTexture = useMemo(() => createRealFlameTexture(), []);
  const haloTexture = useMemo(() => createThermalHaloTexture(), []);

  // Compute fixed 3D surface vectors for all realistic wildfire coordinates
  const localVectors = useMemo(() => {
    return REALISTIC_HOTSPOTS.map((p) =>
      latLonToVector3(p.lat, p.lon, radius + 0.0035)
    );
  }, [radius]);

  // Unique phase offsets for organic asynchronous flame flickering
  const phaseOffsets = useMemo(() => {
    return REALISTIC_HOTSPOTS.map((_, i) => (i * 1.618033) % (Math.PI * 2));
  }, []);

  // Positions and base colors
  const { positions, coreColors, flameColors, haloColors } = useMemo(() => {
    const pos: number[] = [];
    const coreCol: number[] = [];
    const flameCol: number[] = [];
    const haloCol: number[] = [];

    localVectors.forEach((v, index) => {
      pos.push(v.x, v.y, v.z);

      const p = REALISTIC_HOTSPOTS[index];
      const frpNorm = Math.min(1.0, p.frp / 380);

      // 1. Core: Defined bright orange-yellow combustion center
      coreCol.push(1.0, 0.92 + frpNorm * 0.08, 0.55 + frpNorm * 0.35);

      // 2. Flame: Rich fire orange-red flame
      flameCol.push(1.0, 0.38 + frpNorm * 0.22, 0.02);

      // 3. Ground Halo: Restrained warm ember glow
      haloCol.push(1.0, 0.28, 0.02);
    });

    return {
      positions: new Float32Array(pos),
      coreColors: new Float32Array(coreCol),
      flameColors: new Float32Array(flameCol),
      haloColors: new Float32Array(haloCol),
    };
  }, [localVectors]);

  // Scratch vectors for fast frame calculations without garbage collection
  const tempWorldPos = useMemo(() => new THREE.Vector3(), []);
  const tempNormal = useMemo(() => new THREE.Vector3(), []);
  const tempView = useMemo(() => new THREE.Vector3(), []);
  const tempCenter = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    if (!groupRef.current || !corePointsRef.current || !flamePointsRef.current) return;

    const time = clock.getElapsedTime();
    groupRef.current.getWorldPosition(tempCenter);

    const coreColorAttr = corePointsRef.current.geometry.getAttribute('color') ||
      corePointsRef.current.geometry.getAttribute('attributes-color');
    const flameColorAttr = flamePointsRef.current.geometry.getAttribute('color') ||
      flamePointsRef.current.geometry.getAttribute('attributes-color');
    const haloColorAttr = haloPointsRef.current?.geometry.getAttribute('color') ||
      haloPointsRef.current?.geometry.getAttribute('attributes-color');

    if (coreColorAttr && flameColorAttr) {
      const coreArray = coreColorAttr.array as Float32Array;
      const flameArray = flameColorAttr.array as Float32Array;
      const haloArray = haloColorAttr ? (haloColorAttr.array as Float32Array) : null;

      localVectors.forEach((localV, i) => {
        // Calculate world coordinates of this fire front
        tempWorldPos.copy(localV);
        tempWorldPos.applyMatrix4(groupRef.current!.matrixWorld);

        // Surface normal of the globe at this fire
        tempNormal.subVectors(tempWorldPos, tempCenter).normalize();

        // Vector from fire toward the camera
        tempView.subVectors(camera.position, tempWorldPos).normalize();

        // Dot product: if <= 0, fire is on the back hemisphere (facing away from camera)
        const dot = tempNormal.dot(tempView);

        // Natural smooth limb cutoff (disappears behind horizon naturally)
        const limbFactor = dot > 0.05 ? Math.min(1.0, (dot - 0.05) * 5.0) : 0.0;

        if (limbFactor <= 0.001) {
          // Zero brightness on back side
          coreArray[i * 3] = 0;
          coreArray[i * 3 + 1] = 0;
          coreArray[i * 3 + 2] = 0;
          flameArray[i * 3] = 0;
          flameArray[i * 3 + 1] = 0;
          flameArray[i * 3 + 2] = 0;
          if (haloArray) {
            haloArray[i * 3] = 0;
            haloArray[i * 3 + 1] = 0;
            haloArray[i * 3 + 2] = 0;
          }
        } else {
          // Multi-harmonic organic turbulent flame flicker (looks like living fire!)
          const phase = phaseOffsets[i];
          const flameFlicker =
            0.85 +
            0.12 * Math.sin(time * 7.5 + phase) +
            0.06 * Math.cos(time * 16.3 + phase * 2.3);

          const intensity = limbFactor * flameFlicker;

          // Core sharp bright flicker
          coreArray[i * 3] = coreColors[i * 3] * intensity;
          coreArray[i * 3 + 1] = coreColors[i * 3 + 1] * intensity;
          coreArray[i * 3 + 2] = coreColors[i * 3 + 2] * intensity;

          // Fiery flame flare
          flameArray[i * 3] = flameColors[i * 3] * intensity;
          flameArray[i * 3 + 1] = flameColors[i * 3 + 1] * intensity;
          flameArray[i * 3 + 2] = flameColors[i * 3 + 2] * intensity;

          // Restrained ground thermal halo
          if (haloArray) {
            const haloPulse = 0.88 + 0.12 * Math.sin(time * 4.2 + phase);
            const haloIntensity = limbFactor * haloPulse * 0.55;
            haloArray[i * 3] = haloColors[i * 3] * haloIntensity;
            haloArray[i * 3 + 1] = haloColors[i * 3 + 1] * haloIntensity;
            haloArray[i * 3 + 2] = haloColors[i * 3 + 2] * haloIntensity;
          }
        }
      });

      coreColorAttr.needsUpdate = true;
      flameColorAttr.needsUpdate = true;
      if (haloColorAttr) haloColorAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Ground Thermal Radiance (warm radiant bloom cast onto terrain) */}
      <points ref={haloPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[haloColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.110}
          map={haloTexture}
          vertexColors
          transparent
          opacity={0.52}
          depthTest={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={true}
        />
      </points>

      {/* 2. Defined Fiery Flame Body (vivid orange-red combustion flare) */}
      <points ref={flamePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[flameColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          map={flameTexture}
          vertexColors
          transparent
          depthTest={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={true}
        />
      </points>

      {/* 3. Sharp Defined Ignition Centers (crisp, clearly readable active fire points) */}
      <points ref={corePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[coreColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.038}
          map={flameTexture}
          vertexColors
          transparent
          depthTest={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};
