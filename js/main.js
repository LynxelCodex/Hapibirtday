/* =============================================================
   MAIN.JS — Scene Orchestrator & Application Entry Point
   Ties together all modules and manages scene flow
   ============================================================= */

import { initThreeScene, startRenderLoop, setMousePosition, onUpdate } from './three-scene.js';
import { initParticles, updateParticles } from './particles.js';
import { initGift, playGiftOpenAnimation, updateGiftBursts } from './gift.js';
import { initGallery, showGallery, hideGallery, setGalleryMouse } from './gallery.js';
import { initLetter } from './letter.js';
import { initMusicPlayer, initVideoPlayer } from './player.js';
import { initFinale, playFinale } from './finale.js';
import { cinematicTransition, fadeIn, initParallax, createClickHeart } from './animations.js';

const gsapRef = window.gsap;

/* ---- State ---- */
let currentScene = 'scene-landing';
let isMuted = true; // Start muted (browser policy)
let audioResumed = false;

/* ==================== INITIALIZATION ==================== */

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  // Show loader
  simulateLoading();

  // Initialize Three.js scene
  const canvas = document.getElementById('three-canvas');
  initThreeScene(canvas);

  // Initialize particle systems
  const { getScene } = await import('./three-scene.js');
  const scene = getScene();
  initParticles(scene);

  // Register particle update in render loop
  onUpdate((delta, elapsed) => {
    updateParticles(delta, elapsed);
    updateGiftBursts(delta);
  });

  // Start Three.js render loop
  startRenderLoop();

  // Mouse tracking, click heart effect & mobile gyroscope tilt
  setupMouseTracking();
  setupClickHearts();
  setupGyroscopeTilt();

  // Initialize scene modules
  initGift();
  initLetter();
  initFinale();

  // Setup button event listeners
  setupEventListeners();

  // Mute button
  setupMuteButton();
}

/* ---- Loading Simulation ---- */

function simulateLoading() {
  const progress = document.getElementById('loader-progress');
  const loader = document.getElementById('loader');

  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 15 + 5;
    if (p > 100) p = 100;

    if (progress) progress.style.width = p + '%';

    if (p >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        if (loader) {
          loader.classList.add('hidden');
          // Show mute button
          const muteBtn = document.getElementById('mute-btn');
          if (muteBtn) muteBtn.classList.add('visible');
        }
      }, 500);
    }
  }, 200);
}

/* ==================== EVENT LISTENERS ==================== */

function setupEventListeners() {
  // Landing → Gift Opening → Memories
  const openGiftBtn = document.getElementById('open-gift-btn');
  openGiftBtn?.addEventListener('click', async () => {
    currentScene = 'scene-memories';

    // Resume audio context on first interaction
    resumeAudio();

    // Play gift opening animation
    await playGiftOpenAnimation();

    // Transition to memories scene
    await cinematicTransition('scene-landing', 'scene-memories', {
      duration: 1.5,
      useBloom: false, // Already bloomed during gift opening
    });

    // Initialize and show gallery
    initGallery();
    showGallery();
  });

  // Memories → Letter
  const memoriesContinueBtn = document.getElementById('memories-continue-btn');
  memoriesContinueBtn?.addEventListener('click', async () => {
    currentScene = 'scene-letter';

    // Hide gallery (fade out photos)
    hideGallery();

    // Wait a beat for photos to fade
    await new Promise(r => setTimeout(r, 400));

    // Transition
    await cinematicTransition('scene-memories', 'scene-letter', {
      duration: 1.2,
      useBloom: true,
    });
  });

  // Letter → Garden
  const letterContinueBtn = document.getElementById('letter-continue-btn');
  letterContinueBtn?.addEventListener('click', async () => {
    currentScene = 'scene-garden';

    // Mute and pause ambient song in Our Garden
    const ambient = document.getElementById('ambient-audio');
    if (ambient) {
      gsapRef.to(ambient, {
        volume: 0,
        duration: 1,
        onComplete: () => {
          ambient.pause();
          ambient.muted = true;
        },
      });
    }

    await cinematicTransition('scene-letter', 'scene-garden', {
      duration: 1.2,
      useBloom: true,
    });

    // Initialize players after transition
    initMusicPlayer();
    initVideoPlayer();

    // Animate garden title
    const gardenTitle = document.querySelector('.garden-title');
    if (gardenTitle) {
      fadeIn(gardenTitle, 1, 0.3);
    }
  });

  // Garden → Finale
  const gardenContinueBtn = document.getElementById('garden-continue-btn');
  gardenContinueBtn?.addEventListener('click', async () => {
    currentScene = 'scene-finale';

    // Pause music player if playing
    const musicAudio = document.getElementById('music-audio');
    if (musicAudio) {
      gsapRef.to(musicAudio, {
        volume: 0,
        duration: 1,
        onComplete: () => musicAudio.pause(),
      });
    }

    // Pause main video if playing
    const mainVideo = document.getElementById('main-video');
    if (mainVideo && !mainVideo.paused) {
      mainVideo.pause();
    }

    await cinematicTransition('scene-garden', 'scene-finale', {
      duration: 1.5,
      useBloom: true,
    });

    // Unmute and continue ambient song in Final Surprise
    const ambient = document.getElementById('ambient-audio');
    if (ambient) {
      ambient.muted = isMuted;
      if (!isMuted) {
        ambient.volume = 0;
        ambient.play().catch(() => {});
        gsapRef.to(ambient, {
          volume: 0.3,
          duration: 2,
        });
      }
    }

    // Play finale sequence
    playFinale();
  });

  // Video ended → Auto-transition to finale (optional)
  document.addEventListener('videoEnded', () => {
    // Could auto-transition, but let user click the button
  });
}

/* ==================== MOUSE TRACKING ==================== */

function setupMouseTracking() {
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    // Normalized -1 to 1
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    // Update Three.js camera
    setMousePosition(mouseX, mouseY);

    // Update gallery
    setGalleryMouse(mouseX, mouseY);
  });

  // Touch support
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;

      setMousePosition(mouseX, mouseY);
      setGalleryMouse(mouseX, mouseY);
    }
  }, { passive: true });
}

/* ==================== CLICK HEART POP EFFECT ==================== */

function setupClickHearts() {
  let lastTouchTime = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      lastTouchTime = Date.now();
      const touch = e.touches[0];
      createClickHeart(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    // Ignore click event if it was triggered by a recent touchstart to avoid duplicate hearts on touch devices
    if (Date.now() - lastTouchTime < 400) return;
    createClickHeart(e.clientX, e.clientY);
  });
}

/* ==================== MOBILE GYROSCOPE TILT MANAGEMENT ==================== */

function setupGyroscopeTilt() {
  let initialBeta = null;
  let initialGamma = null;

  function handleOrientation(e) {
    if (e.gamma === null || e.beta === null) return;

    if (initialBeta === null) {
      initialBeta = e.beta;
      initialGamma = e.gamma;
    }

    // Clamp gamma & beta to comfortable tilt ranges (-30 to +30 degrees)
    const deltaGamma = Math.max(-30, Math.min(30, e.gamma - initialGamma));
    const deltaBeta = Math.max(-30, Math.min(30, e.beta - initialBeta));

    // Normalized -1 to 1 tilt
    const tiltX = deltaGamma / 30;
    const tiltY = deltaBeta / 30;

    // 1. Update Three.js camera & 3D scene parallax
    setMousePosition(tiltX, tiltY);

    // 2. Apply subtle 3D tilt to active scene content container
    const activeSceneContent = document.querySelector('.scene.active .scene-content');
    if (activeSceneContent) {
      gsapRef.to(activeSceneContent, {
        rotateY: tiltX * 8,
        rotateX: -tiltY * 8,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }

  // Request permission for iOS 13+ devices if required
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const requestPermission = () => {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        })
        .catch(() => {});
      window.removeEventListener('touchstart', requestPermission);
    };
    window.addEventListener('touchstart', requestPermission, { once: true });
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

/* ==================== AUDIO MANAGEMENT ==================== */

const SOUND_ON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const SOUND_OFF_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

function setupMuteButton() {
  const muteBtn = document.getElementById('mute-btn');
  const muteIcon = document.getElementById('mute-icon');

  muteBtn?.addEventListener('click', () => {
    isMuted = !isMuted;

    if (muteIcon) {
      muteIcon.innerHTML = isMuted ? SOUND_OFF_SVG : SOUND_ON_SVG;
    }

    // Control ambient audio
    const ambient = document.getElementById('ambient-audio');
    if (ambient) {
      if (currentScene === 'scene-garden') {
        ambient.muted = true;
        ambient.pause();
      } else {
        ambient.muted = isMuted;
        if (!isMuted && ambient.paused) {
          ambient.volume = 0.3;
          ambient.play().catch(() => {});
        }
      }
    }

    // Control music audio
    const music = document.getElementById('music-audio');
    if (music) {
      music.muted = isMuted;
    }
  });
}

function resumeAudio() {
  if (audioResumed) return;
  audioResumed = true;
  isMuted = false;

  const muteIcon = document.getElementById('mute-icon');
  if (muteIcon) muteIcon.innerHTML = SOUND_ON_SVG;

  // Try to play ambient audio
  const ambient = document.getElementById('ambient-audio');
  if (ambient && currentScene !== 'scene-garden') {
    ambient.volume = 0.3;
    ambient.muted = false;
    ambient.play().catch(() => {
      // Autoplay blocked — that's okay, user can unmute
      isMuted = true;
      if (muteIcon) muteIcon.innerHTML = SOUND_OFF_SVG;
    });
  }
}
