/* =============================================================
   FINALE.JS — Scene 6: Lanterns, Hearts & Farewell Text
   ============================================================= */

const gsapRef = window.gsap;

/* ---- Configuration ---- */
const LANTERN_COUNT = 30;
const HEART_COUNT = 20;

/* ---- Module State ---- */
let lanternInterval;
let heartInterval;

/* ---- Public: Initialize Finale ---- */

export function initFinale() {
  // Pre-create containers (already in HTML)
}

/* ---- Public: Play Finale Sequence ---- */

export function playFinale() {
  return new Promise((resolve) => {
    const sceneFinale = document.getElementById('scene-finale');
    const celestialHeader = document.getElementById('celestial-header');
    const textWrap = document.getElementById('finale-text-wrap');
    const lines = document.querySelectorAll('.finale-line');
    const lanternsContainer = document.getElementById('lanterns-container');

    // Trigger CSS Blossoming Flowers animation
    if (sceneFinale) {
      sceneFinale.classList.remove('not-loaded');
    }

    // Build the finale timeline
    const tl = gsapRef.timeline({ onComplete: resolve });

    // 0. Fade in celestial moon header
    if (celestialHeader) {
      tl.to(celestialHeader, {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'power3.out',
      }, 0.2);
    }

    // 1. Fade in each line with stagger
    lines.forEach((line, i) => {
      tl.to(line, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
      }, i * 1.5 + 0.6);
    });

    // 2. Start launching lanterns (continuous)
    tl.add(() => {
      launchLanterns(lanternsContainer);
    }, 1);

    // 3. Start heart particles
    tl.add(() => {
      launchHearts();
    }, 2);

    // 4. Ensure ambient audio is playing continuously in Final Surprise
    tl.add(() => {
      const ambient = document.getElementById('ambient-audio');
      if (ambient && ambient.paused && !ambient.muted) {
        ambient.volume = 0.3;
        ambient.play().catch(() => {});
      }
    }, lines.length * 1.5 + 2);
  });
}

/* ---- Launch Lanterns ---- */

function launchLanterns(container) {
  if (!container) return;

  let launched = 0;

  lanternInterval = setInterval(() => {
    if (launched >= LANTERN_COUNT) {
      clearInterval(lanternInterval);
      return;
    }

    const lantern = document.createElement('div');
    lantern.classList.add('lantern');

    const size = 20 + Math.random() * 25;
    const x = Math.random() * 100;
    const sway = (Math.random() - 0.5) * 40;
    const dur = 10 + Math.random() * 8;
    const delay = Math.random() * 0.5;

    lantern.style.cssText = `
      --size: ${size}px;
      --sway: ${sway}px;
      --dur: ${dur}s;
      --delay: ${delay}s;
      left: ${x}%;
      bottom: -60px;
    `;

    container.appendChild(lantern);

    // Remove after animation completes
    setTimeout(() => {
      lantern.remove();
    }, (dur + delay) * 1000 + 500);

    launched++;
  }, 600);
}

/* ---- Launch Heart Particles ---- */

function launchHearts() {
  let launched = 0;

  heartInterval = setInterval(() => {
    if (launched >= HEART_COUNT) {
      clearInterval(heartInterval);
      return;
    }

    const heart = document.createElement('div');
    heart.classList.add('heart-particle');

    const size = 18 + Math.random() * 16;
    const x = Math.random() * 100;
    const dur = 8 + Math.random() * 6;
    const delay = Math.random() * 0.3;
    const rot = (Math.random() - 0.5) * 60;
    const isGold = Math.random() > 0.4;

    heart.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 6px rgba(248,180,200,0.7));">
        <path fill="${isGold ? 'url(#gold-grad)' : 'url(#pink-gold-grad)'}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;

    heart.style.cssText = `
      --dur: ${dur}s;
      --delay: ${delay}s;
      --rot: ${rot}deg;
      left: ${x}%;
      bottom: -40px;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const container = document.getElementById('lanterns-container');
    if (container) container.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, (dur + delay) * 1000 + 500);

    launched++;
  }, 500);
}

/* ---- Cleanup ---- */

export function stopFinale() {
  clearInterval(lanternInterval);
  clearInterval(heartInterval);
}
