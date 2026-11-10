import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';

interface SatelliteMeshProps {
  id: 'MODIS' | 'VIIRS';
  textureUrl: string;
  name: string;
  instrument: string;
  accentColor: string;
  isInspected: boolean;
  isBehindEarth?: boolean;
  showBadge?: boolean;
  showTapToInspect?: boolean;
  badgeOffset?: [number, number, number];
  onClick?: () => void;
}

// Photorealistic NASA Spacecraft Physics Lighting Shader
// Unifies directional solar rays, Earth albedo bounce, camera fill, and metallic foil specular
const createSpacecraftShader = (
  texture: THREE.Texture,
  accentColor: string,
  id: 'MODIS' | 'VIIRS'
) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uSunDirection: { value: new THREE.Vector3(-0.615, 0.492, 0.615) },
      uEarthDirection: { value: new THREE.Vector3(0.65, -0.25, 0.45) },
      uAccentColor: { value: new THREE.Color(accentColor) },
      uIsInspected: { value: 0.0 },
      uSatelliteType: { value: id === 'MODIS' ? 0.0 : 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uSunDirection;
      uniform vec3 uEarthDirection;
      uniform vec3 uAccentColor;
      uniform float uIsInspected;
      uniform float uSatelliteType;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 texColor = texture2D(uMap, vUv);
        if (texColor.a < 0.05) discard;

        vec3 N = normalize(vNormal);
        if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(vViewPosition);
        vec3 L_sun = normalize(uSunDirection);
        vec3 L_earth = normalize(uEarthDirection);

        // 1. Directional Sunlight with Soft Wrapped Terminator
        // Completely eliminates harsh partitioning while preserving natural sun highlights
        float NdotL = dot(N, L_sun);
        float wrap = 0.45;
        float softSun = clamp((NdotL + wrap) / (1.0 + wrap), 0.0, 1.0);
        vec3 sunLight = vec3(1.15, 1.10, 1.04) * softSun * 0.95;

        // 2. Earth Albedo / Reflected Earthlight
        // Soft diffuse blue-green fill from the Earth-facing direction
        float NdotEarth = max(0.0, dot(N, L_earth));
        vec3 earthLight = vec3(0.12, 0.28, 0.45) * NdotEarth * 0.40;

        // 3. Eye / Camera Fill Light
        // Smoothly balances shadows so all telemetry payload and instruments remain readable
        float NdotCam = max(0.0, dot(N, vec3(0.0, 0.0, 1.0)));
        float camFillStrength = mix(0.35, 0.52, uIsInspected);
        vec3 camLight = vec3(0.36, 0.40, 0.46) * NdotCam * camFillStrength;

        // 4. Deep Space Ambient Cosmic Baseline
        vec3 ambient = vec3(0.24, 0.27, 0.32);

        // 5. Subtle Cool Rim / Edge Silhouette Lighting
        float NdotV = max(0.0, dot(N, V));
        float fresnel = pow(1.0 - NdotV, 2.5);
        vec3 rimTint = mix(vec3(0.25, 0.75, 0.95), vec3(0.95, 0.55, 0.25), uSatelliteType);
        vec3 rimLight = rimTint * fresnel * 0.28;

        // 6. Surface Material Refinement (Gold MLI foil vs dark silicon solar panels)
        // Gold foil on MODIS & VIIRS instruments
        float isGold = clamp((texColor.r - texColor.b) * 2.5, 0.0, 1.0) * float(texColor.g > 0.25);
        // Solar panel arrays
        float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        float isSolar = clamp((1.0 - lum * 2.0) * (texColor.b > texColor.r ? 1.5 : 0.8), 0.0, 1.0);

        // Specular highlight from Sun
        vec3 H = normalize(L_sun + V);
        float NdotH = max(0.0, dot(N, H));
        float specPower = mix(16.0, 36.0, isGold);
        float specAmount = mix(0.20, 0.50, isGold);
        specAmount = mix(specAmount, 0.32, isSolar);
        vec3 specular = vec3(1.0, 0.98, 0.92) * pow(NdotH, specPower) * specAmount * (NdotL > -0.2 ? 1.0 : 0.0);

        // Composite all balanced spacecraft lighting
        vec3 totalLight = ambient + sunLight + earthLight + camLight + rimLight;
        vec3 finalRgb = texColor.rgb * totalLight + specular;

        // Tonal preservation to avoid highlight burn-out
        finalRgb = min(finalRgb, vec3(1.35));

        gl_FragColor = vec4(finalRgb, texColor.a);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
};

// Photorealistic NASA Satellite Object Mesh using authentic spacecraft assets
const SatelliteMesh: React.FC<SatelliteMeshProps> = ({
  id,
  textureUrl,
  name,
  instrument,
  accentColor,
  isInspected,
  isBehindEarth = false,
  showBadge = true,
  showTapToInspect = false,
  badgeOffset = [0, 0.65, 0],
  onClick,
}) => {
  const texture = useTexture(textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = useMemo(
    () => createSpacecraftShader(texture, accentColor, id),
    [texture, accentColor, id]
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(() => {
    if (material && material.uniforms) {
      material.uniforms.uIsInspected.value = THREE.MathUtils.lerp(
        material.uniforms.uIsInspected.value,
        isInspected ? 1.0 : 0.0,
        0.08
      );
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <group>
      {/* 0. Generous Invisible Raycast Collider for guaranteed responsive tapping */}
      <mesh
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[2.8, 1.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 1. Volumetric Corona / Thruster Aura Glow (Backing plane) */}
      <mesh position={[0, 0, -0.04]} scale={1.05}>
        <planeGeometry args={[2.2, 1.1]} />
        <meshBasicMaterial
          map={texture}
          color={accentColor}
          transparent
          opacity={isInspected ? 0.14 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Primary High-Resolution Spacecraft with Photorealistic Physics Lighting */}
      <mesh
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
        material={material}
      >
        <planeGeometry args={[2.2, 1.1]} />
      </mesh>

      {/* 3. Tappable Floating 3D HUD Badge (Fixed pixel-perfect text size, hidden when inspected, behind Earth, or passing text) */}
      {!isInspected && !isBehindEarth && showBadge && (
        <Html
          position={badgeOffset}
          center
          className="select-none pointer-events-auto"
        >
          <button
            onClick={handleClick}
            className="group/badge flex items-center space-x-2 px-3 py-1.5 rounded-full bg-space-950/90 border border-white/20 hover:border-nasa-cyan backdrop-blur-md text-[10px] font-mono whitespace-nowrap shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            style={{
              boxShadow: `0 0 20px -2px ${accentColor}50`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-white font-bold tracking-wider">{name}</span>
            <span className="text-slate-400 text-[9px] hidden sm:inline">{instrument}</span>
            {showTapToInspect && (
              <span
                className="text-[9px] px-2 py-0.5 rounded font-bold transition-colors"
                style={{
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                }}
              >
                TAP TO INSPECT
              </span>
            )}
          </button>
        </Html>
      )}

      {/* 4. Active Inspection HUD Indicator (Shown above the zoomed satellite on the left, fixed text size) */}
      {isInspected && (
        <Html
          position={[0, 0.78, 0]}
          center
          className="select-none pointer-events-none"
        >
          <div
            className="flex items-center space-x-2 px-3.5 py-1 rounded-full bg-space-950/85 border text-[10px] font-mono tracking-widest backdrop-blur-md whitespace-nowrap shadow-xl"
            style={{
              borderColor: `${accentColor}60`,
              color: accentColor,
              boxShadow: `0 0 20px -4px ${accentColor}40`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span>3D SATELLITE INSPECTOR // {name}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Analytical 3D Keplerian inclined orbit calculator
const getOrbitCoords = (
  radiusX: number,
  radiusZ: number,
  inclination: number,
  theta: number
) => {
  const x = Math.cos(theta) * radiusX;
  const zPlane = Math.sin(theta) * radiusZ;
  const y = -zPlane * Math.sin(inclination);
  const z = zPlane * Math.cos(inclination);
  return { x, y, z };
};

// Orbital Path Ring visualization
const OrbitPathLine: React.FC<{
  radiusX: number;
  radiusZ: number;
  inclination: number;
  color: string;
  opacity: number;
}> = ({ radiusX, radiusZ, inclination, color, opacity }) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const { x, y, z } = getOrbitCoords(radiusX, radiusZ, inclination, theta);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [radiusX, radiusZ, inclination]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  if (opacity <= 0.005) return null;

  return (
    <primitive
      object={
        new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: opacity,
          })
        )
      }
    />
  );
};

export interface SatellitesOrbitProps {
  scrollProgress: number; // 0.0 to 1.0
  selectedSatellite: 'MODIS' | 'VIIRS' | null;
  onSelectSatellite?: (id: 'MODIS' | 'VIIRS' | null) => void;
}

export const SatellitesOrbit: React.FC<SatellitesOrbitProps> = ({
  scrollProgress,
  selectedSatellite,
  onSelectSatellite,
}) => {
  const modisRef = useRef<THREE.Group>(null);
  const viirsRef = useRef<THREE.Group>(null);
  const [modisState, setModisState] = React.useState({
    isBehind: false,
    showBadge: true,
    badgeOffset: [0, 0.65, 0] as [number, number, number],
  });
  const [viirsState, setViirsState] = React.useState({
    isBehind: false,
    showBadge: true,
    badgeOffset: [0, 0.65, 0] as [number, number, number],
  });
  const { pointer } = useThree();

  // Orbit 1: MODIS (Terra/Aqua representative polar sun-synchronous orbit)
  const modisOrbit = useMemo(
    () => ({
      radiusX: 2.65,
      radiusZ: 2.35,
      inclination: 0.52, // ~30 degrees inclination
      speed: 0.65, // ~9.6s period - smoothly and visibly orbiting
      phase: 0.2,
    }),
    []
  );

  // Orbit 2: VIIRS (Suomi-NPP / JPSS representative orbit)
  const viirsOrbit = useMemo(
    () => ({
      radiusX: 2.90,
      radiusZ: 2.55,
      inclination: -0.56, // ~-32 degrees inclination
      speed: 0.52, // ~12s period - smoothly and visibly orbiting
      phase: Math.PI + 0.4, // offset so satellites don't collide
    }),
    []
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const isMobile = window.innerWidth < 768;

    // Multi-phase factors across the 3 sections:
    // 1. Hero: scrollProgress < 0.35
    // 2. Section 2 (floating on right): 0.35 <= scrollProgress <= 0.68
    // 3. Section 3 (Command Center orbit): scrollProgress >= 0.68
    let section2Factor = 0;
    if (scrollProgress >= 0.35 && scrollProgress <= 0.50) {
      section2Factor = (scrollProgress - 0.35) / 0.15;
    } else if (scrollProgress > 0.50 && scrollProgress <= 0.68) {
      section2Factor = 1.0;
    } else if (scrollProgress > 0.68 && scrollProgress <= 0.84) {
      section2Factor = 1.0 - (scrollProgress - 0.68) / 0.16;
    }

    const section3Factor = THREE.MathUtils.clamp((scrollProgress - 0.70) / 0.16, 0, 1);
    const orbitRadiusScale = 1.0 + section3Factor * 0.25;

    // ==========================================
    // 1. CALCULATE ORBITAL POSITIONS
    // ==========================================
    const tModis = time * modisOrbit.speed + modisOrbit.phase;
    const orbModis = getOrbitCoords(
      modisOrbit.radiusX * orbitRadiusScale,
      modisOrbit.radiusZ * orbitRadiusScale,
      modisOrbit.inclination,
      tModis
    );

    const tViirs = time * viirsOrbit.speed + viirsOrbit.phase;
    const orbViirs = getOrbitCoords(
      viirsOrbit.radiusX * orbitRadiusScale,
      viirsOrbit.radiusZ * orbitRadiusScale,
      viirsOrbit.inclination,
      tViirs
    );

    // Occlusion check & responsive badge positioning
    // Satellite is behind Earth (radius 2.0 at origin)
    // In Section 3 (3rd page, scrollProgress >= 0.68), satellite info badges are completely disabled
    const isSection3 = scrollProgress >= 0.68;
    const isModisBehindNow =
      section2Factor < 0.2 &&
      orbModis.z < -0.15 &&
      orbModis.x * orbModis.x + orbModis.y * orbModis.y < 4.2;
    const showModisBadgeNow =
      !isSection3 && !isModisBehindNow && (scrollProgress >= 0.35 || orbModis.x >= -0.2);
    const modisOffsetNow: [number, number, number] =
      orbModis.y > 1.0 ? [0, -0.65, 0] : [0, 0.65, 0];

    if (
      isModisBehindNow !== modisState.isBehind ||
      showModisBadgeNow !== modisState.showBadge ||
      modisOffsetNow[1] !== modisState.badgeOffset[1]
    ) {
      setModisState({
        isBehind: isModisBehindNow,
        showBadge: showModisBadgeNow,
        badgeOffset: modisOffsetNow,
      });
    }

    const isViirsBehindNow =
      section2Factor < 0.2 &&
      orbViirs.z < -0.15 &&
      orbViirs.x * orbViirs.x + orbViirs.y * orbViirs.y < 4.2;
    const showViirsBadgeNow =
      !isSection3 && !isViirsBehindNow && (scrollProgress >= 0.35 || orbViirs.x >= -0.2);
    const viirsOffsetNow: [number, number, number] =
      orbViirs.y > 1.0 ? [0, -0.65, 0] : [0, 0.65, 0];

    if (
      isViirsBehindNow !== viirsState.isBehind ||
      showViirsBadgeNow !== viirsState.showBadge ||
      viirsOffsetNow[1] !== viirsState.badgeOffset[1]
    ) {
      setViirsState({
        isBehind: isViirsBehindNow,
        showBadge: showViirsBadgeNow,
        badgeOffset: viirsOffsetNow,
      });
    }

    // Dynamic zoom expansion during descent scroll so satellites expand in space
    const zoomExpansion = THREE.MathUtils.smoothstep(scrollProgress, 0.15, 0.38) * 1.4;

    // ========================================================
    // 2. FIXED FLOATING POSITIONS (PAGE 2 IDLE STATE)
    // Floating in the clear central corridor (X: +0.22 to +0.38, Z: 1.90-2.00)
    // Completely clear of the left text cards and safely in space in front of Earth!
    // ========================================================
    const modisHoverY = Math.sin(time * 1.5) * 0.04;
    const modisHoverX = Math.cos(time * 1.2) * 0.03;
    const floatModisTarget = new THREE.Vector3(
      isMobile ? 0.0 + modisHoverX : 0.22 + modisHoverX,
      isMobile ? 1.05 + modisHoverY : 0.75 + modisHoverY,
      1.90
    );

    const viirsHoverY = Math.cos(time * 1.4) * 0.04;
    const viirsHoverX = Math.sin(time * 1.1) * 0.03;
    const floatViirsTarget = new THREE.Vector3(
      isMobile ? 0.1 + viirsHoverX : 0.38 + viirsHoverX,
      isMobile ? -0.85 + viirsHoverY : -0.70 + viirsHoverY,
      2.00
    );

    // ========================================================
    // 3. INSPECTION POSITION (WHEN USER TAPS SATELLITE)
    // Satellite zooms and glides to the left side
    // ========================================================
    const inspectTarget = new THREE.Vector3(
      isMobile ? 0.0 : -1.55,
      isMobile ? 1.10 : 0.05,
      2.25
    );

    // Interactive pointer parallax tilt when inspected
    const tiltX = pointer.y * 0.12;
    const tiltY = pointer.x * 0.12;

    // ========================================================
    // 4. MODIS KINEMATICS & TARGET ASSIGNMENT
    // ========================================================
    if (modisRef.current) {
      let targetPos = new THREE.Vector3();
      let targetScale = 0.52;
      let targetRotX = 0;
      let targetRotY = 0;
      let targetRotZ = 0;

      if (selectedSatellite === 'MODIS') {
        // ACTIVELY INSPECTED: Zooms up and glides across to the LEFT side!
        targetPos.copy(inspectTarget);
        targetScale = isMobile ? 1.40 : 1.95;

        // Cinematic zero-g hover + pointer tilt
        targetRotY = tiltY + Math.sin(time * 0.7) * 0.06;
        targetRotX = -tiltX + 0.05 + Math.cos(time * 0.6) * 0.04;
        targetRotZ = Math.sin(time * 0.5) * 0.03;

        // Smooth transition into inspection position
        modisRef.current.position.lerp(targetPos, 0.085);
        modisRef.current.rotation.x = THREE.MathUtils.lerp(
          modisRef.current.rotation.x,
          targetRotX,
          0.085
        );
        modisRef.current.rotation.y = THREE.MathUtils.lerp(
          modisRef.current.rotation.y,
          targetRotY,
          0.085
        );
        modisRef.current.rotation.z = THREE.MathUtils.lerp(
          modisRef.current.rotation.z,
          targetRotZ,
          0.085
        );
      } else if (selectedSatellite === 'VIIRS') {
        // VIIRS is inspected: MODIS smoothly shrinks to 0 in its place
        targetPos.copy(floatModisTarget);
        targetScale = 0.0;
        modisRef.current.position.lerp(targetPos, 0.085);
      } else {
        // UNSELECTED:
        if (section3Factor > 0.01) {
          // SECTION 3 (3rd Page): Satellites removed from scene
          targetPos.set(orbModis.x, orbModis.y, orbModis.z);
          targetScale = Math.max(0, (1.0 - section3Factor) * 0.52);
          modisRef.current.position.lerp(targetPos, 0.08);
        } else if (section2Factor < 0.02) {
          // HERO: Pure continuous orbital trajectory tracking (safely clear of left headline copy)
          targetPos.set(orbModis.x + 0.15, orbModis.y, orbModis.z);
          modisRef.current.position.copy(targetPos);
          targetScale = 0.42;

          // Realistic orbital banking and flight attitude facing the viewer
          targetRotZ = Math.sin(tModis) * 0.16;
          targetRotX = Math.cos(tModis) * 0.08;
          targetRotY = Math.sin(tModis * 0.5) * 0.12;

          modisRef.current.rotation.x = targetRotX;
          modisRef.current.rotation.y = targetRotY;
          modisRef.current.rotation.z = targetRotZ;
        } else {
          // SECTION 2 (Earth on Right, Satellites Floating):
          const orbitalExpanded = new THREE.Vector3(
            orbModis.x * (1 + zoomExpansion),
            orbModis.y * (1 + zoomExpansion),
            orbModis.z * (1 + zoomExpansion)
          );
          targetPos.lerpVectors(orbitalExpanded, floatModisTarget, section2Factor);
          targetScale = THREE.MathUtils.lerp(0.52, 0.68, section2Factor);

          targetRotY = THREE.MathUtils.lerp(
            Math.sin(tModis * 0.5) * 0.12,
            -0.15 + Math.sin(time * 0.8) * 0.08,
            section2Factor
          );
          targetRotX = THREE.MathUtils.lerp(
            Math.cos(tModis) * 0.08,
            0.08 + Math.cos(time * 0.7) * 0.05,
            section2Factor
          );
          targetRotZ = THREE.MathUtils.lerp(
            Math.sin(tModis) * 0.16,
            Math.sin(time * 0.9) * 0.04,
            section2Factor
          );

          modisRef.current.position.lerp(targetPos, 0.08);
          modisRef.current.rotation.x = THREE.MathUtils.lerp(
            modisRef.current.rotation.x,
            targetRotX,
            0.08
          );
          modisRef.current.rotation.y = THREE.MathUtils.lerp(
            modisRef.current.rotation.y,
            targetRotY,
            0.08
          );
          modisRef.current.rotation.z = THREE.MathUtils.lerp(
            modisRef.current.rotation.z,
            targetRotZ,
            0.08
          );
        }
      }

      const currentScale = modisRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.085);
      modisRef.current.scale.set(newScale, newScale, newScale);
    }

    // ========================================================
    // 5. VIIRS KINEMATICS & TARGET ASSIGNMENT
    // ========================================================
    if (viirsRef.current) {
      let targetPos = new THREE.Vector3();
      let targetScale = 0.52;
      let targetRotX = 0;
      let targetRotY = 0;
      let targetRotZ = 0;

      if (selectedSatellite === 'VIIRS') {
        // ACTIVELY INSPECTED: Zooms up and glides across to the LEFT side!
        targetPos.copy(inspectTarget);
        targetScale = isMobile ? 1.40 : 1.95;

        // Cinematic zero-g hover + pointer tilt
        targetRotY = tiltY + Math.sin(time * 0.7) * 0.06;
        targetRotX = -tiltX + 0.05 + Math.cos(time * 0.6) * 0.04;
        targetRotZ = Math.cos(time * 0.5) * 0.03;

        // Smooth transition into inspection position
        viirsRef.current.position.lerp(targetPos, 0.085);
        viirsRef.current.rotation.x = THREE.MathUtils.lerp(
          viirsRef.current.rotation.x,
          targetRotX,
          0.085
        );
        viirsRef.current.rotation.y = THREE.MathUtils.lerp(
          viirsRef.current.rotation.y,
          targetRotY,
          0.085
        );
        viirsRef.current.rotation.z = THREE.MathUtils.lerp(
          viirsRef.current.rotation.z,
          targetRotZ,
          0.085
        );
      } else if (selectedSatellite === 'MODIS') {
        // MODIS is inspected: VIIRS smoothly shrinks to 0 in its place
        targetPos.copy(floatViirsTarget);
        targetScale = 0.0;
        viirsRef.current.position.lerp(targetPos, 0.085);
      } else {
        // UNSELECTED:
        if (section3Factor > 0.01) {
          // SECTION 3 (3rd Page): Satellites removed from scene
          targetPos.set(orbViirs.x, orbViirs.y, orbViirs.z);
          targetScale = Math.max(0, (1.0 - section3Factor) * 0.52);
          viirsRef.current.position.lerp(targetPos, 0.08);
        } else if (section2Factor < 0.02) {
          // HERO: Pure continuous orbital trajectory tracking (safely clear of left headline copy)
          targetPos.set(orbViirs.x + 0.15, orbViirs.y, orbViirs.z);
          viirsRef.current.position.copy(targetPos);
          targetScale = 0.42;

          // Realistic orbital banking and flight attitude facing the viewer
          targetRotZ = -Math.sin(tViirs) * 0.16;
          targetRotX = -Math.cos(tViirs) * 0.08;
          targetRotY = Math.sin(tViirs * 0.5) * 0.12;

          viirsRef.current.rotation.x = targetRotX;
          viirsRef.current.rotation.y = targetRotY;
          viirsRef.current.rotation.z = targetRotZ;
        } else {
          // SECTION 2 (Earth on Right, Satellites Floating):
          const orbitalExpanded = new THREE.Vector3(
            orbViirs.x * (1 + zoomExpansion),
            orbViirs.y * (1 + zoomExpansion),
            orbViirs.z * (1 + zoomExpansion)
          );
          targetPos.lerpVectors(orbitalExpanded, floatViirsTarget, section2Factor);
          targetScale = THREE.MathUtils.lerp(0.52, 0.68, section2Factor);

          targetRotY = THREE.MathUtils.lerp(
            Math.sin(tViirs * 0.5) * 0.12,
            0.15 + Math.sin(time * 0.7) * 0.08,
            section2Factor
          );
          targetRotX = THREE.MathUtils.lerp(
            -Math.cos(tViirs) * 0.08,
            -0.08 + Math.cos(time * 0.8) * 0.05,
            section2Factor
          );
          targetRotZ = THREE.MathUtils.lerp(
            -Math.sin(tViirs) * 0.16,
            Math.sin(time * 0.6) * 0.04,
            section2Factor
          );

          viirsRef.current.position.lerp(targetPos, 0.08);
          viirsRef.current.rotation.x = THREE.MathUtils.lerp(
            viirsRef.current.rotation.x,
            targetRotX,
            0.08
          );
          viirsRef.current.rotation.y = THREE.MathUtils.lerp(
            viirsRef.current.rotation.y,
            targetRotY,
            0.08
          );
          viirsRef.current.rotation.z = THREE.MathUtils.lerp(
            viirsRef.current.rotation.z,
            targetRotZ,
            0.08
          );
        }
      }

      const currentScale = viirsRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.085);
      viirsRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  // In Section 3 (3rd page), completely remove revolving satellites, orbit lines, and info badges
  if (scrollProgress >= 0.68 && !selectedSatellite) {
    return null;
  }

  // Orbital trajectories: active in Hero, fade in Section 2, completely removed in Section 3
  const orbitLineOpacity =
    selectedSatellite || scrollProgress >= 0.70
      ? 0.0
      : scrollProgress <= 0.35
      ? THREE.MathUtils.clamp(0.28 - (scrollProgress / 0.35) * 0.28, 0, 0.28)
      : 0.0;

  const currentOrbitScale = 1.0 + THREE.MathUtils.clamp((scrollProgress - 0.70) / 0.16, 0, 1) * 0.25;

  return (
    <group>
      {/* Orbital trajectory lines - exactly aligned with satellite coordinates */}
      <OrbitPathLine
        radiusX={modisOrbit.radiusX * currentOrbitScale}
        radiusZ={modisOrbit.radiusZ * currentOrbitScale}
        inclination={modisOrbit.inclination}
        color="#00e5ff"
        opacity={orbitLineOpacity}
      />
      <OrbitPathLine
        radiusX={viirsOrbit.radiusX * currentOrbitScale}
        radiusZ={viirsOrbit.radiusZ * currentOrbitScale}
        inclination={viirsOrbit.inclination}
        color="#ff9100"
        opacity={orbitLineOpacity}
      />

      {/* MODIS Spacecraft (Clickable) */}
      <group ref={modisRef}>
        <SatelliteMesh
          id="MODIS"
          textureUrl="/satellites/modis.png"
          name="MODIS"
          instrument="TERRA / AQUA"
          accentColor="#00e5ff"
          isInspected={selectedSatellite === 'MODIS'}
          isBehindEarth={modisState.isBehind}
          showBadge={modisState.showBadge}
          showTapToInspect={scrollProgress >= 0.35}
          badgeOffset={modisState.badgeOffset}
          onClick={() => onSelectSatellite?.('MODIS')}
        />
      </group>

      {/* VIIRS Spacecraft (Clickable) */}
      <group ref={viirsRef}>
        <SatelliteMesh
          id="VIIRS"
          textureUrl="/satellites/viirs.png"
          name="VIIRS"
          instrument="375M I-BAND"
          accentColor="#ff5722"
          isInspected={selectedSatellite === 'VIIRS'}
          isBehindEarth={viirsState.isBehind}
          showBadge={viirsState.showBadge}
          showTapToInspect={scrollProgress >= 0.35}
          badgeOffset={viirsState.badgeOffset}
          onClick={() => onSelectSatellite?.('VIIRS')}
        />
      </group>
    </group>
  );
};
