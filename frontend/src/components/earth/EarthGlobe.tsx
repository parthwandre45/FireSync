import React, { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { AtmosphereGlow } from './AtmosphereGlow';
import { FireHotspots } from './FireHotspots';
import { createWildfireEmissiveTexture } from './fireTextureGenerator';

interface EarthGlobeProps {
  radius?: number;
  rotationSpeed?: number;
  sunDirection?: THREE.Vector3;
  cloudOpacity?: number;
}

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  radius = 2.0,
  rotationSpeed = 0.22,
  sunDirection,
  cloudOpacity = 0.68,
}) => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const surfaceMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const customUniformsRef = useRef<{
    uNightMap?: { value: THREE.Texture };
    uSunDirection?: { value: THREE.Vector3 };
    uCityLightsIntensity?: { value: number };
    uShadowFillIntensity?: { value: number };
  }>({});

  const cloudsUniformsRef = useRef<{
    uSunDirection?: { value: THREE.Vector3 };
    uCloudOpacity?: { value: number };
  }>({});

  // Load NASA planetary textures
  const [dayMap, normalMap, specularMap, cloudsMap, nightMap] = useLoader(
    THREE.TextureLoader,
    [
      '/textures/earth_daymap.jpg',
      '/textures/earth_normal.jpg',
      '/textures/earth_specular.jpg',
      '/textures/earth_clouds_2k.png',
      '/textures/earth_nightmap.jpg',
    ]
  );

  // Wildfire emission texture
  const wildfireEmissiveMap = useMemo(() => createWildfireEmissiveTexture(), []);

  // Configure texture filters and color space for maximum photorealism
  useMemo(() => {
    [dayMap, cloudsMap, nightMap].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
    });
    nightMap.wrapS = THREE.RepeatWrapping;
    nightMap.wrapT = THREE.ClampToEdgeWrapping;
  }, [dayMap, cloudsMap, nightMap]);

  // Hook into surface shader compilation
  const handleBeforeCompile = useCallback((shader: any) => {
    const defaultSun = (sunDirection ? sunDirection.clone() : new THREE.Vector3(-5, 4, 5)).normalize();

    customUniformsRef.current.uNightMap = { value: nightMap };
    customUniformsRef.current.uSunDirection = { value: defaultSun };
    customUniformsRef.current.uCityLightsIntensity = { value: 1.0 };
    customUniformsRef.current.uShadowFillIntensity = { value: 1.0 };

    Object.assign(shader.uniforms, customUniformsRef.current);

    // 1. Soft ocean sheen & cinematic deep navy calibration
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
        float waterMask = texelRoughness.r;
        
        // Soft, broad ocean sheen (0.48) - eliminates harsh white blinding hotspot
        roughnessFactor = mix(roughness, 0.48, waterMask);
        
        // Deep natural navy ocean calibration:
        // Replaces artificial electric cobalt with cinematic deep ocean navy
        // while preserving coastal shelf and reef luminosity (e.g. Bahamas, Caribbean)
        vec3 deepNavy = vec3(0.012, 0.045, 0.115);
        vec3 oceanCalibrated = mix(deepNavy, diffuseColor.rgb * vec3(0.35, 0.52, 0.72), 0.42);
        diffuseColor.rgb = mix(diffuseColor.rgb, oceanCalibrated, waterMask);
      #endif
      `
    );

    // 2. Pass world normal from vertex shader for solar angle calculation
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vEarthWorldNormal;
      `
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `
      #include <defaultnormal_vertex>
      vEarthWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      `
    );

    // 3. Declare custom uniforms and varyings in fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vEarthWorldNormal;
      uniform sampler2D uNightMap;
      uniform vec3 uSunDirection;
      uniform float uCityLightsIntensity;
      uniform float uShadowFillIntensity;
      `
    );

    // 4. Smooth cinematic twilight terminator, midnight ocean, and warm city lights
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>

      // Calculate solar angle on planetary surface
      float sunDot = dot(vEarthWorldNormal, uSunDirection);

      #ifdef USE_ROUGHNESSMAP
        float landMask = clamp(1.0 - texture2D(roughnessMap, vMapUv).r * 2.5, 0.0, 1.0);
      #else
        float landMask = 1.0;
      #endif

      // 1. Atmospheric twilight wrap across the terminator:
      // Softens the day/night boundary into a smooth, cinematic transition
      float twilightBand = smoothstep(-0.25, 0.15, sunDot) * (1.0 - smoothstep(0.0, 0.30, sunDot));
      vec3 twilightGlow = mix(vec3(0.02, 0.06, 0.14), vec3(0.12, 0.08, 0.05), landMask);
      totalEmissiveRadiance += diffuseColor.rgb * twilightGlow * (twilightBand * 0.45);

      // 2. Midnight ocean & continental night silhouette:
      // Prevents the night side from collapsing into an abrupt pitch-black void
      float nightFactor = 1.0 - smoothstep(-0.25, 0.05, sunDot);
      vec3 nightOceanGlow = vec3(0.002, 0.006, 0.015) * (1.0 - landMask) * nightFactor;
      vec3 nightLandGlow = diffuseColor.rgb * vec3(0.09, 0.11, 0.15) * landMask * nightFactor * uShadowFillIntensity;
      totalEmissiveRadiance += nightOceanGlow + nightLandGlow;

      // 3. Authentic NASA Black Marble night city lights:
      // Smoothly fades in across twilight and glows warmly on night continents
      float cityLightFade = 1.0 - smoothstep(-0.20, 0.05, sunDot);
      vec4 nightTexel = texture2D(uNightMap, vMapUv);
      vec3 cleanedNight = max(nightTexel.rgb - 0.04, 0.0);
      vec3 cityLights = cleanedNight * vec3(1.20, 0.95, 0.62) * 1.55;
      totalEmissiveRadiance += cityLights * cityLightFade * landMask * uCityLightsIntensity;
      `
    );
  }, [nightMap, sunDirection]);

  // Hook into cloud shader compilation: wispy feathered edges, translucent depth, and solar illumination
  const handleCloudBeforeCompile = useCallback((shader: any) => {
    const defaultSun = (sunDirection ? sunDirection.clone() : new THREE.Vector3(-5, 4, 5)).normalize();

    cloudsUniformsRef.current.uSunDirection = { value: defaultSun };
    cloudsUniformsRef.current.uCloudOpacity = { value: cloudOpacity };

    Object.assign(shader.uniforms, cloudsUniformsRef.current);

    // Pass world normal from vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vCloudWorldNormal;
      `
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `
      #include <defaultnormal_vertex>
      vCloudWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      `
    );

    // Declare uniforms in fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vCloudWorldNormal;
      uniform vec3 uSunDirection;
      uniform float uCloudOpacity;
      `
    );

    // Feathered cloud edges & solar illumination
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
        
        // Solar illumination on clouds
        float cloudSunDot = dot(vCloudWorldNormal, uSunDirection);
        float cloudDayFactor = smoothstep(-0.20, 0.25, cloudSunDot);
        
        // 1. Wispy feathered edges: pow(a, 1.25) gently thins mid-tones so terrain/ocean shows through
        // 2. Night fade: fades cloud opacity on the dark hemisphere so night lights and terrain remain crisp
        diffuseColor.a = pow(sampledDiffuseColor.a, 1.25) * mix(0.08, 1.0, cloudDayFactor) * uCloudOpacity;
        
        // Soft cloud diffuse color: natural white on sunlit side, subtle warm twilight near terminator
        vec3 cloudDayColor = vec3(0.96, 0.98, 1.00);
        vec3 cloudTwilight = vec3(0.88, 0.72, 0.62);
        float twilightZone = smoothstep(-0.15, 0.15, cloudSunDot) * (1.0 - smoothstep(0.05, 0.35, cloudSunDot));
        diffuseColor.rgb = mix(cloudDayColor, cloudTwilight, twilightZone * 0.35);
      #endif
      `
    );
  }, [sunDirection, cloudOpacity]);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    // Smooth continuous Earth axial rotation
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * rotationSpeed;
    }

    // Atmospheric cloud circulation (moves slightly faster than Earth's surface)
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * (rotationSpeed * 1.12);
    }

    // Dynamic fire respiration on planetary surface
    if (surfaceMaterialRef.current) {
      const firePulse =
        2.4 +
        Math.sin(time * 3.8) * 0.30 +
        Math.cos(time * 9.2) * 0.12;
      surfaceMaterialRef.current.emissiveIntensity = firePulse;
    }
  });

  return (
    <group ref={earthGroupRef} rotation={[0.22, 1.2, 0]}>
      {/* 1. Base Earth Surface: Calibrated PBR, deep navy oceans, soft sun glint, and twilight terminator */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          ref={surfaceMaterialRef}
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          roughnessMap={specularMap}
          roughness={0.82}
          metalness={0.0}
          emissiveMap={wildfireEmissiveMap}
          emissive={new THREE.Color('#ff5500')}
          emissiveIntensity={2.4}
          onBeforeCompile={handleBeforeCompile}
        />
      </mesh>

      {/* 2. 3D Active Flaming Points & Thermal Embers */}
      <FireHotspots radius={radius} />

      {/* 3. Swirling Atmospheric Cloud Layer (Wispy, translucent, preserving continental detail) */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.0035, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          color="#ffffff"
          blending={THREE.NormalBlending}
          depthWrite={false}
          roughness={0.85}
          metalness={0.0}
          onBeforeCompile={handleCloudBeforeCompile}
        />
      </mesh>

      {/* 4. Luminous Cyan-Blue Atmospheric Rim & Outer Space Halo */}
      <AtmosphereGlow
        radius={radius}
        color="#38bdf8"
        sunDirection={sunDirection}
      />
    </group>
  );
};
