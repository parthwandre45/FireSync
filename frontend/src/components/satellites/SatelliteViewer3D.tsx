import React, { useState, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, useTexture } from '@react-three/drei';
import { SatelliteInfoCard } from './SatelliteInfoCard';
import { Satellite, Flame, Orbit, RotateCw } from 'lucide-react';

interface SatelliteModelMeshProps {
  id: 'MODIS' | 'VIIRS';
  accentColor: string;
}

// 3D Satellite CAD model using authentic high-resolution textures
const SatelliteModelMesh: React.FC<SatelliteModelMeshProps> = ({ id, accentColor }) => {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(id === 'MODIS' ? '/satellites/modis.png' : '/satellites/viirs.png');
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <group ref={meshRef} scale={1.85}>
      {/* Volumetric glow aura */}
      <mesh position={[0, 0, -0.04]} scale={1.05}>
        <planeGeometry args={[2.2, 1.1]} />
        <meshBasicMaterial
          map={texture}
          color={accentColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Primary Satellite Plane */}
      <mesh>
        <planeGeometry args={[2.2, 1.1]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.02}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export const SatelliteViewer3D: React.FC = () => {
  const [selectedSatellite, setSelectedSatellite] = useState<'MODIS' | 'VIIRS'>('MODIS');

  return (
    <div className="w-full rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-xl overflow-hidden p-6 lg:p-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-nasa-cyan text-xs font-mono mb-1">
            <Orbit className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
            <span>INTERACTIVE 3D SATELLITE INSPECTION // CAD MODEL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
            Spacecraft Architecture & Sensor Payload
          </h2>
        </div>

        {/* Satellite Toggle Buttons */}
        <div className="flex items-center space-x-2 bg-space-950/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setSelectedSatellite('MODIS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
              selectedSatellite === 'MODIS'
                ? 'bg-nasa-cyan text-space-950 shadow-glow-cyan/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>MODIS (Terra/Aqua)</span>
          </button>

          <button
            onClick={() => setSelectedSatellite('VIIRS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
              selectedSatellite === 'VIIRS'
                ? 'bg-nasa-orange text-white shadow-glow-orange/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>VIIRS (S-NPP/JPSS)</span>
          </button>
        </div>
      </div>

      {/* Split view: 3D CAD on Left, Telemetry Specs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: 3D Interactive Canvas */}
        <div className="relative h-[340px] sm:h-[420px] rounded-2xl bg-space-950/90 border border-white/10 overflow-hidden flex items-center justify-center">
          <Canvas
            camera={{ position: [0, 0.4, 3.6], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[-4, 4, 3]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[4, -2, -2]} intensity={0.6} color="#00e5ff" />

            <Suspense fallback={null}>
              <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
                <SatelliteModelMesh
                  id={selectedSatellite}
                  accentColor={selectedSatellite === 'MODIS' ? '#00e5ff' : '#ff5722'}
                />
              </Float>
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.8}
            />
          </Canvas>

          {/* User Guide Tag */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-space-900/80 border border-white/10 text-[10px] font-mono text-slate-400 flex items-center space-x-1.5 pointer-events-none">
            <RotateCw className="w-3 h-3 text-nasa-cyan animate-spin" style={{ animationDuration: '6s' }} />
            <span>DRAG TO ROTATE 3D MODEL</span>
          </div>
        </div>

        {/* Right: Detailed Telemetry Specs */}
        <div>
          <SatelliteInfoCard
            satelliteId={selectedSatellite}
            onSelectSatellite={(id) => setSelectedSatellite(id)}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

