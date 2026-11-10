import React, { useMemo } from 'react';
import * as THREE from 'three';

// 1. Inner Atmosphere Rim (Limb brightening on the planet disc horizon)
const innerAtmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const innerAtmosphereFragmentShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldNormal;
uniform vec3 uColor;
uniform vec3 uSunDirection;

void main() {
  // Horizon grazing rim angle (Fresnel)
  float rim = 1.0 - max(dot(vViewDir, vNormal), 0.0);
  float rimCurve = pow(rim, 3.8);

  // Solar angle on surface
  float sunDot = dot(vWorldNormal, uSunDirection);
  float sunFactor = smoothstep(-0.20, 0.35, sunDot);

  // Brilliant luminous cyan-blue on sunlit horizon
  vec3 sunlitColor = uColor * 1.50;
  // Deep indigo fringe on night horizon
  vec3 nightColor = vec3(0.015, 0.045, 0.12);
  float nightRim = (1.0 - sunFactor) * 0.08 * pow(rim, 6.0);

  vec3 finalColor = sunlitColor * (sunFactor * rimCurve) + nightColor * nightRim;
  float finalAlpha = (sunFactor * 0.95 * rimCurve) + nightRim;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

// 2. Outer Atmospheric Halo (Ethereal aura radiating into deep space beyond the planet disc)
const outerHaloVertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const outerHaloFragmentShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldNormal;
uniform vec3 uColor;
uniform vec3 uSunDirection;

void main() {
  // For BackSide rendering of an outer sphere:
  // dot(vViewDir, vNormal) is largest (~0.35) near the planet horizon, and falls to 0.0 at the outer halo boundary
  float rim = max(dot(vViewDir, vNormal), 0.0);
  float intensity = pow(clamp(rim / 0.36, 0.0, 1.0), 2.2);

  // Modulate by solar angle
  float sunDot = dot(vWorldNormal, uSunDirection);
  float sunFactor = smoothstep(-0.25, 0.40, sunDot);

  // Celestial cyan-blue halo radiating into space matching cinematic reference
  vec3 haloColor = uColor * 1.35;
  vec3 finalColor = haloColor * (sunFactor * intensity * 0.85);
  float finalAlpha = sunFactor * intensity * 0.85;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

interface AtmosphereGlowProps {
  radius?: number;
  color?: string;
  sunDirection?: THREE.Vector3;
}

export const AtmosphereGlow: React.FC<AtmosphereGlowProps> = ({
  radius = 2.0,
  color = '#38bdf8',
  sunDirection,
}) => {
  const defaultSunDir = useMemo(
    () => sunDirection || new THREE.Vector3(-5, 4, 5).normalize(),
    [sunDirection]
  );

  const innerUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uSunDirection: { value: defaultSunDir },
    }),
    [color, defaultSunDir]
  );

  const outerUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uSunDirection: { value: defaultSunDir },
    }),
    [color, defaultSunDir]
  );

  return (
    <group>
      {/* 1. Inner Atmospheric Rim (Limb brightening on the planet disc horizon) */}
      <mesh>
        <sphereGeometry args={[radius * 1.005, 64, 64]} />
        <shaderMaterial
          vertexShader={innerAtmosphereVertexShader}
          fragmentShader={innerAtmosphereFragmentShader}
          uniforms={innerUniforms}
          blending={THREE.AdditiveBlending}
          transparent={true}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Outer Atmospheric Halo (Ethereal aura radiating into deep space) */}
      <mesh>
        <sphereGeometry args={[radius * 1.065, 64, 64]} />
        <shaderMaterial
          vertexShader={outerHaloVertexShader}
          fragmentShader={outerHaloFragmentShader}
          uniforms={outerUniforms}
          blending={THREE.AdditiveBlending}
          transparent={true}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
