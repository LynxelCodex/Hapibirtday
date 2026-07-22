/* =============================================================
   PARTICLES.JS — Petal, Firefly & Sparkle Particle Systems
   All systems use Three.js Points with BufferGeometry
   ============================================================= */

import * as THREE from 'three';

/* ---- Configuration ---- */
const CONFIG = {
  petals:    { count: 180, color: 0xF8B4C8, size: 0.45, speed: 0.4 },
  fireflies: { count: 60,  color: 0xFFD700, size: 0.25, speed: 0.15 },
  sparkles:  { count: 100, color: 0xFFFFFF, size: 0.12, speed: 0.05 },
};

/* ---- Module State ---- */
let petalSystem, fireflySystem, sparkleSystem;
let systems = [];

/* ---- Texture Generators ---- */

function createSoftCircleTexture(color, res = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d');
  const half = res / 2;

  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color + 'AA');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, res, res);

  return new THREE.CanvasTexture(canvas);
}

function createPetalTexture(res = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = Math.floor(res * 1.4);
  const ctx = canvas.getContext('2d');

  // Petal shape (ellipse)
  ctx.fillStyle = '#F8B4C8';
  ctx.beginPath();
  ctx.ellipse(res / 2, canvas.height / 2, res * 0.35, canvas.height * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight
  const gradient = ctx.createRadialGradient(
    res * 0.4, canvas.height * 0.4, 0,
    res / 2, canvas.height / 2, res * 0.35
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/* ---- System Builder ---- */

function createParticleSystem(config, texture, scene) {
  const { count, size } = config;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count); // For sine wave offsets
  const alphas = new Float32Array(count);
  const spread = 50;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * spread;
    positions[i3 + 1] = (Math.random() - 0.5) * spread;
    positions[i3 + 2] = (Math.random() - 0.5) * spread * 0.6;

    phases[i] = Math.random() * Math.PI * 2;
    alphas[i] = Math.random() * 0.5 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: texture,
    size,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return { points, geometry, material, positions, velocities, phases, alphas, count, spread };
}

/* ---- Public: Initialize All Particle Systems ---- */

export function initParticles(scene) {
  // Petals — soft pink falling particles
  const petalTexture = createPetalTexture();
  petalSystem = createParticleSystem(CONFIG.petals, petalTexture, scene);
  systems.push(petalSystem);

  // Fireflies — golden glowing dots
  const fireflyTexture = createSoftCircleTexture('#FFD700');
  fireflySystem = createParticleSystem(CONFIG.fireflies, fireflyTexture, scene);
  systems.push(fireflySystem);

  // Sparkles — white twinkling points
  const sparkleTexture = createSoftCircleTexture('#FFFFFF');
  sparkleSystem = createParticleSystem(CONFIG.sparkles, sparkleTexture, scene);
  systems.push(sparkleSystem);
}

/* ---- Public: Update (called each frame) ---- */

export function updateParticles(delta, elapsed) {
  if (!petalSystem) return;

  updatePetals(delta, elapsed);
  updateFireflies(delta, elapsed);
  updateSparkles(delta, elapsed);
}

/* ---- Petal Update: Slow spiral fall ---- */
function updatePetals(delta, elapsed) {
  const { positions, phases, count, spread, geometry } = petalSystem;
  const speed = CONFIG.petals.speed;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const phase = phases[i];

    // Fall downward
    positions[i3 + 1] -= speed * delta * (0.8 + Math.sin(phase) * 0.4);

    // Gentle horizontal drift (wind)
    positions[i3] += Math.sin(elapsed * 0.3 + phase) * delta * 0.3;

    // Slight depth sway
    positions[i3 + 2] += Math.cos(elapsed * 0.2 + phase * 2) * delta * 0.1;

    // Reset when fallen below view
    if (positions[i3 + 1] < -spread / 2) {
      positions[i3]     = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = spread / 2 + Math.random() * 5;
      positions[i3 + 2] = (Math.random() - 0.5) * spread * 0.6;
    }
  }

  geometry.attributes.position.needsUpdate = true;
}

/* ---- Firefly Update: Random wandering with glow ---- */
function updateFireflies(delta, elapsed) {
  const { positions, phases, count, spread, geometry, material } = fireflySystem;
  const speed = CONFIG.fireflies.speed;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const phase = phases[i];
    const t = elapsed + phase;

    // Wandering motion (Lissajous-like curves)
    positions[i3]     += Math.sin(t * 0.7) * speed * delta * 3;
    positions[i3 + 1] += Math.cos(t * 0.5) * speed * delta * 2;
    positions[i3 + 2] += Math.sin(t * 0.3 + phase) * speed * delta;

    // Boundary wrapping
    for (let axis = 0; axis < 3; axis++) {
      const limit = spread / 2 * (axis === 2 ? 0.6 : 1);
      if (positions[i3 + axis] > limit) positions[i3 + axis] = -limit;
      if (positions[i3 + axis] < -limit) positions[i3 + axis] = limit;
    }
  }

  // Pulsing glow (vary opacity over time)
  material.opacity = 0.6 + Math.sin(elapsed * 2) * 0.2;

  geometry.attributes.position.needsUpdate = true;
}

/* ---- Sparkle Update: Twinkling in place ---- */
function updateSparkles(delta, elapsed) {
  const { positions, phases, count, geometry, material } = sparkleSystem;

  // Sparkles mostly stay in place but twinkle
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Very subtle movement
    positions[i3]     += Math.sin(elapsed + phases[i]) * delta * 0.05;
    positions[i3 + 1] += Math.cos(elapsed * 0.5 + phases[i]) * delta * 0.03;
  }

  // Twinkle effect
  material.opacity = 0.4 + Math.sin(elapsed * 3) * 0.3;

  geometry.attributes.position.needsUpdate = true;
}

/* ---- Public: Adjust intensity per system ---- */

export function setParticleIntensity(type, intensity) {
  const system = type === 'petals' ? petalSystem
    : type === 'fireflies' ? fireflySystem
    : type === 'sparkles' ? sparkleSystem
    : null;

  if (system) {
    const gsapRef = window.gsap;
    gsapRef.to(system.material, {
      opacity: intensity,
      duration: 1,
      ease: 'power2.inOut',
    });
  }
}

/* ---- Public: Burst effect — temporary particle explosion ---- */

export function triggerBurst(scene, position = { x: 0, y: 0, z: 0 }, count = 50) {
  const burstGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = position.x;
    positions[i3 + 1] = position.y;
    positions[i3 + 2] = position.z;

    // Random outward velocity
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI - Math.PI / 2;
    const speed = Math.random() * 8 + 3;
    velocities.push(
      Math.cos(angle1) * Math.cos(angle2) * speed,
      Math.sin(angle2) * speed + 2,
      Math.sin(angle1) * Math.cos(angle2) * speed
    );
  }

  burstGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const colors = [0xF8B4C8, 0xFFD700, 0xC4A8D8, 0xFFFFFF, 0x2E8B57];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const texture = createSoftCircleTexture('#' + color.toString(16).padStart(6, '0'));

  const burstMat = new THREE.PointsMaterial({
    map: texture,
    size: 0.4,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const burstPoints = new THREE.Points(burstGeo, burstMat);
  scene.add(burstPoints);

  // Animate burst
  let life = 0;
  const maxLife = 2;

  function updateBurst(delta) {
    life += delta;
    if (life > maxLife) {
      scene.remove(burstPoints);
      burstGeo.dispose();
      burstMat.dispose();
      texture.dispose();
      return true; // done
    }

    const posAttr = burstGeo.attributes.position;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posAttr.array[i3]     += velocities[i3] * delta;
      posAttr.array[i3 + 1] += velocities[i3 + 1] * delta;
      posAttr.array[i3 + 2] += velocities[i3 + 2] * delta;

      // Gravity
      velocities[i3 + 1] -= 4 * delta;
    }
    posAttr.needsUpdate = true;

    // Fade out
    burstMat.opacity = 1 - (life / maxLife);

    return false;
  }

  return updateBurst;
}

/* ---- Cleanup ---- */
export function disposeParticles() {
  for (const sys of systems) {
    sys.geometry.dispose();
    sys.material.dispose();
    if (sys.material.map) sys.material.map.dispose();
  }
  systems = [];
}
