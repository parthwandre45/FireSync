import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const Starfield: React.FC<{ count?: number }> = ({ count = 1200 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const starTints = [
      new THREE.Color(0.85, 0.92, 1.0), // Cool white
      new THREE.Color(0.65, 0.85, 1.0), // Deep blue-white
      new THREE.Color(1.0, 0.95, 0.85), // Warm white
      new THREE.Color(0.5, 0.75, 1.0),  // Cyan tint
    ];

    for (let i = 0; i < count; i++) {
      // Distribute stars on a wide sphere surrounding the Earth
      const radius = 35 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const tint = starTints[Math.floor(Math.random() * starTints.length)];
      col[i * 3] = tint.r;
      col[i * 3 + 1] = tint.g;
      col[i * 3 + 2] = tint.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      // Very slow celestial drift
      pointsRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
};

