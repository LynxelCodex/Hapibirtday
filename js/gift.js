/* =============================================================
   GIFT.JS — Landing Scene Gift Box & Opening Animation
   ============================================================= */

import { fadeIn, fadeOut, bloomFlash, createParticleBurst, elasticPop } from './animations.js';
import { triggerBurst } from './particles.js';
import { getScene, setBloomStrength } from './three-scene.js';

const gsapRef = window.gsap;

/* ---- Module State ---- */
let sparkleInterval;
let burstUpdaters = [];
let rotX = -15;
let rotY = 25;
let isDragging = false;
let startX = 0;
let startY = 0;
let velocityX = 0;
let velocityY = 0;
let animFrameId;

/* ---- Public: Initialize Gift Scene ---- */

export function initGift() {
  createSparkles();
  animateEntrance();
  setupGift3DRotation();
}

/* ---- 3D Rotation Drag Controller ---- */

function setupGift3DRotation() {
  const container = document.getElementById('gift-container');
  const box = document.getElementById('gift-box');
  if (!container || !box) return;

  function onPointerDown(e) {
    isDragging = true;
    box.classList.add('dragging');
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    velocityX = 0;
    velocityY = 0;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    const dx = currentX - startX;
    const dy = currentY - startY;

    velocityX = dx * 0.45;
    velocityY = dy * 0.45;

    rotY += velocityX;
    rotX -= velocityY;

    // Clamp vertical tilt
    rotX = Math.max(-60, Math.min(60, rotX));

    startX = currentX;
    startY = currentY;

    applyBoxTransform(box);
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    box.classList.remove('dragging');
  }

  // Event Listeners
  container.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  container.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Inertia & idle sway loop
  function inertiaLoop() {
    if (!isDragging && box) {
      if (Math.abs(velocityX) > 0.05 || Math.abs(velocityY) > 0.05) {
        rotY += velocityX;
        rotX -= velocityY;
        rotX = Math.max(-60, Math.min(60, rotX));
        velocityX *= 0.92;
        velocityY *= 0.92;
        applyBoxTransform(box);
      } else {
        // Idle gentle 3D float sway
        const time = Date.now() * 0.0015;
        const swayX = Math.sin(time) * 4;
        const swayY = Math.cos(time * 0.8) * 3;
        box.style.transform = `rotateX(${rotX + swayY}deg) rotateY(${rotY + swayX}deg)`;
      }
    }
    animFrameId = requestAnimationFrame(inertiaLoop);
  }

  inertiaLoop();
}

function applyBoxTransform(box) {
  if (box) {
    box.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }
}

/* ---- Create floating sparkles around the gift box ---- */

function createSparkles() {
  const container = document.getElementById('gift-sparkles');
  if (!container) return;

  const sparkleCount = 12;

  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.classList.add('sparkle');

    // Random position around the gift
    const angle = (Math.PI * 2 * i) / sparkleCount;
    const radius = 60 + Math.random() * 50;
    const x = Math.cos(angle) * radius + 100;
    const y = Math.sin(angle) * radius + 100;

    sparkle.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      --dur: ${2 + Math.random() * 3}s;
      --delay: ${Math.random() * 2}s;
      --tx: ${(Math.random() - 0.5) * 60}px;
      --ty: ${-20 - Math.random() * 50}px;
      width: ${3 + Math.random() * 5}px;
      height: ${3 + Math.random() * 5}px;
    `;

    container.appendChild(sparkle);
  }
}

/* ---- Entrance Animation (fade in title & button) ---- */

function animateEntrance() {
  const title = document.getElementById('landing-title');
  const btn = document.getElementById('open-gift-btn');

  // Slight delay for dramatic effect after loader
  gsapRef.timeline({ delay: 0.5 })
    .to(title, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
    })
    .to(btn, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.4');
}

/* ---- Public: Play Gift Opening Animation ---- */

export function playGiftOpenAnimation() {
  return new Promise((resolve) => {
    const lid = document.getElementById('gift-lid');
    const box = document.getElementById('gift-box');
    const btn = document.getElementById('open-gift-btn');
    const title = document.getElementById('landing-title');
    const giftContainer = document.getElementById('gift-container');

    // Get gift box center for burst
    const rect = box.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Stop 3D drag animation loop
    cancelAnimationFrame(animFrameId);

    // Build the opening timeline
    const tl = gsapRef.timeline({
      onComplete: () => {
        // Clean up sparkle interval
        clearInterval(sparkleInterval);
        resolve();
      }
    });

    // 1. Fade out button
    tl.to(btn, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: 'power2.in',
    });

    // 2. Gift box 3D shakes with anticipation
    tl.to(box, {
      rotationZ: -4,
      duration: 0.08,
      ease: 'power2.inOut',
    })
    .to(box, { rotationZ: 4, duration: 0.08, ease: 'power2.inOut' })
    .to(box, { rotationZ: -3, duration: 0.08, ease: 'power2.inOut' })
    .to(box, { rotationZ: 3, duration: 0.08, ease: 'power2.inOut' })
    .to(box, { rotationZ: 0, duration: 0.08, ease: 'power2.inOut' });

    // 3. 3D Lid lifts off and rotates away in 3D
    tl.to(lid, {
      y: -140,
      rotationX: -55,
      rotationY: 25,
      opacity: 0,
      duration: 0.85,
      ease: 'power2.out',
    });

    // 4. Particle burst!
    tl.add(() => {
      createParticleBurst(centerX, centerY, 35);

      // Also trigger Three.js burst
      const scene = getScene();
      if (scene) {
        const burstUpdate = triggerBurst(scene, { x: 0, y: 0, z: 10 }, 60);
        if (burstUpdate) burstUpdaters.push(burstUpdate);
      }

      // Intensify bloom
      setBloomStrength(1.5);
    }, '-=0.3');

    // 5. Gift body scales up with glow
    tl.to(box, {
      scale: 1.35,
      filter: 'brightness(2.2) blur(2px)',
      duration: 0.5,
      ease: 'power2.out',
    }, '-=0.3');

    // 6. Second CSS particle burst
    tl.add(() => {
      createParticleBurst(centerX, centerY, 30);
      createParticleBurst(centerX - 40, centerY - 20, 20);
      createParticleBurst(centerX + 40, centerY - 20, 20);
    }, '-=0.1');

    // 7. Fade out title
    tl.to(title, {
      opacity: 0,
      y: -20,
      duration: 0.4,
    }, '-=0.3');

    // 8. Bloom flash (full white)
    tl.add(() => {
      bloomFlash(1.5);
    }, '-=0.2');

    // 9. Fade out entire gift container
    tl.to(giftContainer, {
      opacity: 0,
      scale: 1.5,
      filter: 'blur(10px)',
      duration: 0.8,
      ease: 'power2.in',
    }, '-=1');

    // 10. Reset bloom
    tl.add(() => {
      setBloomStrength(0.8);
    }, '+=0.3');
  });
}

/* ---- Burst updaters (called from render loop) ---- */
export function updateGiftBursts(delta) {
  burstUpdaters = burstUpdaters.filter(updater => !updater(delta));
}
