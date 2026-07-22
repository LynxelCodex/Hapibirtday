/* =============================================================
   THREE-SCENE.JS — Three.js Environment, Camera, Lighting, Bloom
   ============================================================= */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ---- Module State ---- */
let renderer, scene, camera, composer;
let mouseTarget = { x: 0, y: 0 };
let mouseCurrent = { x: 0, y: 0 };
let clock;
let animationId;
let onUpdateCallbacks = [];

/* ---- Public: Initialization ---- */
export function initThreeScene(canvas) {
  clock = new THREE.Clock();

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e1526, 0.008);

  // Camera
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 30);

  // Lighting
  setupLighting();

  // Post-processing (bloom)
  setupPostProcessing();

  // Resize handler
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer };
}

/* ---- Lighting Setup ---- */
function setupLighting() {
  // Ambient — soft warm fill
  const ambient = new THREE.AmbientLight(0xFFF8E7, 0.45);
  scene.add(ambient);

  // Hemisphere — sky/ground color gradient
  const hemi = new THREE.HemisphereLight(0x4A6FA5, 0x2E8B57, 0.25);
  scene.add(hemi);

  // Directional — golden sunlight
  const sun = new THREE.DirectionalLight(0xFFD700, 0.4);
  sun.position.set(10, 20, 15);
  scene.add(sun);

  // Accent point lights
  const pinkLight = new THREE.PointLight(0xE87AA4, 0.6, 50);
  pinkLight.position.set(-8, 5, 10);
  scene.add(pinkLight);

  const lavenderLight = new THREE.PointLight(0xC4A8D8, 0.4, 50);
  lavenderLight.position.set(8, -3, 12);
  scene.add(lavenderLight);

  const goldLight = new THREE.PointLight(0xFFD700, 0.3, 40);
  goldLight.position.set(0, 8, 8);
  scene.add(goldLight);
}

/* ---- Post-Processing (Bloom) ---- */
function setupPostProcessing() {
  try {
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,   // strength
      0.4,   // radius
      0.85   // threshold
    );
    composer.addPass(bloomPass);
  } catch (e) {
    console.warn('Bloom post-processing unavailable, falling back to standard rendering:', e);
    composer = null;
  }
}

/* ---- Render Loop ---- */
export function startRenderLoop() {
  function animate() {
    animationId = requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Smooth mouse follow for camera
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.03;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.03;

    camera.position.x += (mouseCurrent.x * 2 - camera.position.x) * 0.02;
    camera.position.y += (mouseCurrent.y * 1.5 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Run registered update callbacks
    for (const cb of onUpdateCallbacks) {
      cb(delta, clock.getElapsedTime());
    }

    // Render
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  animate();
}

/* ---- Public API ---- */

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }

/**
 * Update mouse target position (normalized -1 to 1)
 */
export function setMousePosition(nx, ny) {
  mouseTarget.x = nx;
  mouseTarget.y = ny;
}

/**
 * Register a callback to run every frame
 */
export function onUpdate(callback) {
  onUpdateCallbacks.push(callback);
}

/**
 * Remove a registered update callback
 */
export function removeUpdate(callback) {
  onUpdateCallbacks = onUpdateCallbacks.filter(cb => cb !== callback);
}

/**
 * Animate camera to a target position
 */
export function setCameraTarget(targetPos, duration = 2) {
  const gsapRef = window.gsap;
  return gsapRef.to(camera.position, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration,
    ease: 'power2.inOut',
  });
}

/**
 * Adjust bloom intensity
 */
export function setBloomStrength(value) {
  if (composer && composer.passes[1]) {
    const gsapRef = window.gsap;
    gsapRef.to(composer.passes[1], {
      strength: value,
      duration: 1,
      ease: 'power2.inOut',
    });
  }
}

/**
 * Adjust fog density
 */
export function setFogDensity(value) {
  if (scene.fog) {
    const gsapRef = window.gsap;
    gsapRef.to(scene.fog, {
      density: value,
      duration: 1.5,
      ease: 'power2.inOut',
    });
  }
}

/* ---- Resize Handler ---- */
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  if (composer) {
    composer.setSize(w, h);
  }
}

/* ---- Cleanup ---- */
export function disposeScene() {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);

  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });

  renderer.dispose();
  if (composer) composer.dispose();
}
