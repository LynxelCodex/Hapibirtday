/* =============================================================
   GALLERY.JS — Scene 2: Floating 3D Photo Memories
   Photos orbit in Three.js space with mouse interaction
   ============================================================= */

import * as THREE from 'three';
import { getScene, getCamera, onUpdate, removeUpdate } from './three-scene.js';

const gsapRef = window.gsap;

/* ---- Configuration ---- */
const PHOTO_COUNT = 8;
const ORBIT_RADIUS = 12;
const PHOTO_SIZE = { w: 3.2, h: 4.2 }; // Default to portrait orientation

/* ---- Module State ---- */
let photoMeshes = [];
let photoGroup;
let cakeMesh;
let mouseInfluence = { x: 0, y: 0 };
let highlightTimer;
let updateFn;
let isActive = false;

/* ---- Photo file paths ---- */
function getPhotoPath(index) {
  return `assets/images/memories/memory${index + 1}.jpg`;
}

/* ---- Procedural 3D Birthday Cake ---- */
function createCake3D() {
  const cakeGroup = new THREE.Group();

  // Materials
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.8,
    roughness: 0.25,
    emissive: 0x332200,
    transparent: true,
  });

  const baseFrostingMat = new THREE.MeshStandardMaterial({
    color: 0xF8B4C8, // Pastel Pink
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
  });

  const midFrostingMat = new THREE.MeshStandardMaterial({
    color: 0xFFF5E6, // Warm Cream
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
  });

  const topFrostingMat = new THREE.MeshStandardMaterial({
    color: 0xE87AA4, // Deep Pink
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
  });

  const whiteCreamMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.2,
    transparent: true,
  });

  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xFFFAF0,
    roughness: 0.3,
    transparent: true,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFF6600,
    emissiveIntensity: 2.8,
    roughness: 0.1,
    transparent: true,
  });

  // 1. Gold Cake Plate
  const plateGeo = new THREE.CylinderGeometry(4.6, 5.0, 0.3, 32);
  const plate = new THREE.Mesh(plateGeo, goldMat);
  plate.position.y = -2.8;
  cakeGroup.add(plate);

  // 2. Bottom Tier (Tier 1)
  const tier1Geo = new THREE.CylinderGeometry(3.8, 3.8, 1.8, 32);
  const tier1 = new THREE.Mesh(tier1Geo, baseFrostingMat);
  tier1.position.y = -1.75;
  cakeGroup.add(tier1);

  // Decorative pearls around Tier 1 base
  const pearlGeo = new THREE.SphereGeometry(0.18, 12, 12);
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    const pearl = new THREE.Mesh(pearlGeo, goldMat);
    pearl.position.set(Math.cos(angle) * 3.85, -2.55, Math.sin(angle) * 3.85);
    cakeGroup.add(pearl);
  }

  // 3. Middle Tier (Tier 2)
  const tier2Geo = new THREE.CylinderGeometry(2.6, 2.6, 1.5, 32);
  const tier2 = new THREE.Mesh(tier2Geo, midFrostingMat);
  tier2.position.y = -0.1;
  cakeGroup.add(tier2);

  // Middle tier gold ribbon trim
  const ribbonGeo = new THREE.CylinderGeometry(2.65, 2.65, 0.22, 32);
  const ribbon = new THREE.Mesh(ribbonGeo, goldMat);
  ribbon.position.y = -0.75;
  cakeGroup.add(ribbon);

  // 4. Top Tier (Tier 3)
  const tier3Geo = new THREE.CylinderGeometry(1.5, 1.5, 1.2, 32);
  const tier3 = new THREE.Mesh(tier3Geo, topFrostingMat);
  tier3.position.y = 1.25;
  cakeGroup.add(tier3);

  // Whipped cream dollops around top tier rim
  const dollopGeo = new THREE.SphereGeometry(0.22, 12, 12);
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10;
    const dollop = new THREE.Mesh(dollopGeo, whiteCreamMat);
    dollop.position.set(Math.cos(angle) * 1.4, 1.85, Math.sin(angle) * 1.4);
    cakeGroup.add(dollop);
  }

  // 5. Candles & Flames
  const flameMeshes = [];
  const candleCount = 5;

  for (let i = 0; i < candleCount; i++) {
    const angle = (Math.PI * 2 * i) / candleCount;
    const r = 0.8;
    const cx = Math.cos(angle) * r;
    const cz = Math.sin(angle) * r;

    // Candle body
    const cGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.1, 16);
    const candle = new THREE.Mesh(cGeo, candleMat);
    candle.position.set(cx, 2.4, cz);
    cakeGroup.add(candle);

    // Candle flame (cone)
    const fGeo = new THREE.ConeGeometry(0.12, 0.4, 16);
    fGeo.translate(0, 0.2, 0); // Origin at base of flame
    const flame = new THREE.Mesh(fGeo, flameMat);
    flame.position.set(cx, 2.95, cz);
    cakeGroup.add(flame);
    flameMeshes.push(flame);
  }

  // Central main golden candle
  const mainCandleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 16);
  const mainCandle = new THREE.Mesh(mainCandleGeo, goldMat);
  mainCandle.position.set(0, 2.55, 0);
  cakeGroup.add(mainCandle);

  const mainFlameGeo = new THREE.ConeGeometry(0.16, 0.5, 16);
  mainFlameGeo.translate(0, 0.25, 0);
  const mainFlame = new THREE.Mesh(mainFlameGeo, flameMat);
  mainFlame.position.set(0, 3.25, 0);
  cakeGroup.add(mainFlame);
  flameMeshes.push(mainFlame);

  // Candle warm point light
  const candleLight = new THREE.PointLight(0xFF9900, 2.2, 16);
  candleLight.position.set(0, 3.4, 0);
  cakeGroup.add(candleLight);

  cakeGroup.userData = {
    flameMeshes,
    candleLight,
  };

  return cakeGroup;
}

/* ---- Public: Initialize Gallery ---- */

export function initGallery() {
  const scene = getScene();
  if (!scene) return;

  photoGroup = new THREE.Group();
  scene.add(photoGroup);

  // Create & add 3D Birthday Cake in center
  cakeMesh = createCake3D();
  cakeMesh.position.set(0, -0.5, 0);
  photoGroup.add(cakeMesh);

  // Create photo frames
  const loader = new THREE.TextureLoader();

  for (let i = 0; i < PHOTO_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PHOTO_COUNT;
    const radius = ORBIT_RADIUS + (Math.random() - 0.5) * 3;
    const heightOffset = (Math.random() - 0.5) * 5;

    // Photo plane (initial portrait geometry)
    const geometry = new THREE.PlaneGeometry(PHOTO_SIZE.w, PHOTO_SIZE.h);

    // Try to load photo, use MeshBasicMaterial for 100% full bright unshaded photo quality
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Glowing gold frame (wireframe slightly larger)
    const frameGeo = new THREE.PlaneGeometry(PHOTO_SIZE.w + 0.3, PHOTO_SIZE.h + 0.3);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.02;
    mesh.add(frame);

    // Position in orbit
    mesh.position.set(
      Math.cos(angle) * radius,
      heightOffset,
      Math.sin(angle) * radius
    );

    // Face toward center
    mesh.lookAt(0, heightOffset * 0.3, 0);

    // Attempt texture load
    loader.load(
      getPhotoPath(i),
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;

        // Auto-fit photo & frame to natural aspect ratio (portrait / landscape / square)
        const img = texture.image;
        if (img && img.width && img.height) {
          const aspect = img.width / img.height;
          let targetW, targetH;
          if (aspect < 1) {
            // Portrait photo
            targetH = 4.4;
            targetW = targetH * aspect;
          } else {
            // Landscape or square photo
            targetW = 4.4;
            targetH = targetW / aspect;
          }
          // Update plane geometries
          mesh.geometry.dispose();
          mesh.geometry = new THREE.PlaneGeometry(targetW, targetH);
          frame.geometry.dispose();
          frame.geometry = new THREE.PlaneGeometry(targetW + 0.3, targetH + 0.3);
        }
      },
      undefined,
      () => {
        // Photo not found — create a portrait gradient placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 300, 400);
        const hue = (i / PHOTO_COUNT) * 360;
        grad.addColorStop(0, `hsl(${hue}, 40%, 25%)`);
        grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 35%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 300, 400);

        // Draw elegant camera vector outline on portrait canvas
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(100, 160, 100, 70, 10);
        } else {
          ctx.rect(100, 160, 100, 70);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(150, 195, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(125, 175, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        const fallbackTexture = new THREE.CanvasTexture(canvas);
        material.map = fallbackTexture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      }
    );

    // Store metadata
    mesh.userData = {
      baseAngle: angle,
      radius,
      heightOffset,
      speed: 0.08 + Math.random() * 0.06,
      bobSpeed: 0.5 + Math.random() * 0.5,
      bobRange: 0.3 + Math.random() * 0.5,
      index: i,
    };

    photoGroup.add(mesh);
    photoMeshes.push(mesh);
  }

  // Register update function
  updateFn = updateGallery;
  onUpdate(updateFn);
}

/* ---- Update: Orbit, bob, mouse react (called per frame) ---- */

function updateGallery(delta, elapsed) {
  if (!isActive || !photoGroup) return;

  // Smooth mouse influence
  mouseInfluence.x += (targetMouse.x - mouseInfluence.x) * 0.05;
  mouseInfluence.y += (targetMouse.y - mouseInfluence.y) * 0.05;

  // Update 3D Cake rotation & candle flickering
  if (cakeMesh) {
    cakeMesh.rotation.y += delta * 0.25;
    cakeMesh.position.y = -0.5 + Math.sin(elapsed * 1.2) * 0.25;

    const d = cakeMesh.userData;
    if (d && d.flameMeshes) {
      const flicker = 1 + Math.sin(elapsed * 14) * 0.12 + Math.cos(elapsed * 22) * 0.08;
      d.flameMeshes.forEach((flame, i) => {
        flame.scale.set(flicker, flicker * (1 + Math.sin(elapsed * 18 + i) * 0.12), flicker);
      });
      if (d.candleLight) {
        d.candleLight.intensity = 2.0 + Math.sin(elapsed * 25) * 0.4;
      }
    }
  }

  for (const mesh of photoMeshes) {
    const d = mesh.userData;

    // Orbit rotation around cake
    d.baseAngle += d.speed * delta;
    const r = d.radius + mouseInfluence.x * 2;

    mesh.position.x = Math.cos(d.baseAngle) * r;
    mesh.position.z = Math.sin(d.baseAngle) * r;

    // Vertical bobbing
    mesh.position.y = d.heightOffset + Math.sin(elapsed * d.bobSpeed) * d.bobRange;
    mesh.position.y += mouseInfluence.y * 1.5;

    // Face camera (billboard-like, but with gentle tilt)
    const camera = getCamera();
    if (camera) {
      mesh.lookAt(camera.position);
    }

    // Subtle rotation
    mesh.rotation.z = Math.sin(elapsed * 0.3 + d.index) * 0.05;
  }

  // Slowly rotate entire group
  photoGroup.rotation.y += delta * 0.02;
}

/* ---- Mouse tracking for gallery ---- */
let targetMouse = { x: 0, y: 0 };

export function setGalleryMouse(nx, ny) {
  targetMouse.x = nx;
  targetMouse.y = ny;
}

/* ---- Public: Show Gallery (fade in photos & 3D Cake) ---- */

export function showGallery() {
  isActive = true;

  // Animate 3D Cake entrance & fade-in
  if (cakeMesh) {
    cakeMesh.traverse((child) => {
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = 0;
        gsapRef.to(child.material, {
          opacity: 1,
          duration: 1.2,
          ease: 'power2.out',
        });
      }
    });
    gsapRef.fromTo(cakeMesh.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 1.4, ease: 'back.out(1.4)' }
    );
  }

  // Animate each photo fading in with stagger
  photoMeshes.forEach((mesh, i) => {
    gsapRef.to(mesh.material, {
      opacity: 1.0,
      duration: 1,
      delay: i * 0.15,
      ease: 'power2.out',
    });
  });

  // Start random highlight timer
  startHighlightCycle();

  // Animate title
  const title = document.getElementById('memories-title');
  if (title) {
    gsapRef.to(title, { opacity: 1, duration: 1, delay: 0.5, ease: 'power2.out' });
  }
}

/* ---- Public: Hide Gallery (fade out photos & 3D Cake) ---- */

export function hideGallery() {
  isActive = false;

  // Stop highlight
  clearInterval(highlightTimer);

  // Fade out 3D Cake
  if (cakeMesh) {
    cakeMesh.traverse((child) => {
      if (child.material) {
        gsapRef.to(child.material, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.in',
        });
      }
    });
  }

  // Fade out photos
  photoMeshes.forEach((mesh) => {
    gsapRef.to(mesh.material, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
    });
  });

  // After fade, remove from scene
  setTimeout(() => {
    if (photoGroup) {
      const scene = getScene();
      if (scene) scene.remove(photoGroup);

      // Dispose
      photoMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.children.forEach(child => {
          child.geometry.dispose();
          child.material.dispose();
        });
      });

      if (cakeMesh) {
        cakeMesh.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }

      photoMeshes = [];
      cakeMesh = null;
      photoGroup = null;
    }

    if (updateFn) {
      removeUpdate(updateFn);
      updateFn = null;
    }
  }, 800);
}

/* ---- Random Highlight Cycle ---- */

function startHighlightCycle() {
  highlightTimer = setInterval(() => {
    if (!isActive || photoMeshes.length === 0) return;

    const idx = Math.floor(Math.random() * photoMeshes.length);
    const mesh = photoMeshes[idx];
    if (!mesh) return;

    // Scale up then back
    gsapRef.timeline()
      .to(mesh.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.8, ease: 'power2.out' })
      .to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'power2.inOut' });

    // Brighten frame
    const frame = mesh.children[0];
    if (frame) {
      gsapRef.timeline()
        .to(frame.material, { opacity: 0.7, duration: 0.8 })
        .to(frame.material, { opacity: 0.3, duration: 0.8 });
    }

  }, 4000);
}
