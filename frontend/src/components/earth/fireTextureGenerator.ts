import * as THREE from 'three';
import { REALISTIC_HOTSPOTS } from './fireData';

// Generates an emissive canvas texture with crisp, glowing circular DOTTED hotspots
// Strictly mapped to verified deep-inland continental landmasses (100% land, zero water overlap)

export function createWildfireEmissiveTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Base is pure black (zero emission across oceans and unburned land)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Precise equirectangular coordinate mapping
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Render each inland hotspot as a tight, glowing circular dot
  REALISTIC_HOTSPOTS.forEach((p) => {
    const x = toX(p.lon);
    const y = toY(p.lat);

    // Visible, defined hotspot radiance: sharp bright orange-red core with restrained warm halo
    const coreRadius = 3.2 + (p.frp / 400) * 1.8; // 3.8 to 5.0 px (readable at globe scale)
    const haloRadius = coreRadius * 2.0;          // 7.6 to 10.0 px

    // 1. Defined warm ember margin (restrained, no blurry haze)
    const haloGrad = ctx.createRadialGradient(x, y, 0, x, y, haloRadius);
    haloGrad.addColorStop(0.0, 'rgba(255, 80, 0, 0.55)');
    haloGrad.addColorStop(0.40, 'rgba(220, 35, 0, 0.22)');
    haloGrad.addColorStop(0.80, 'rgba(160, 15, 0, 0.05)');
    haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sharp, defined bright orange-red combustion core
    const flameGrad = ctx.createRadialGradient(x, y, 0, x, y, coreRadius);
    flameGrad.addColorStop(0.0, 'rgba(255, 240, 160, 1.0)'); // Defined bright ignition core
    flameGrad.addColorStop(0.25, 'rgba(255, 135, 0, 0.98)'); // Vivid fire orange
    flameGrad.addColorStop(0.65, 'rgba(235, 45, 0, 0.85)');  // Rich red-orange flame
    flameGrad.addColorStop(0.90, 'rgba(190, 15, 0, 0.40)');  // Crimson ember margin
    flameGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
