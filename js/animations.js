/* =============================================================
   ANIMATIONS.JS — GSAP Animation Presets & Utilities
   ============================================================= */

const gsapRef = window.gsap;

/**
 * Fade an element in with a gentle upward slide
 */
export function fadeIn(el, duration = 0.8, delay = 0) {
  return gsapRef.fromTo(el,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration, delay, ease: 'power3.out' }
  );
}

/**
 * Fade an element out
 */
export function fadeOut(el, duration = 0.6) {
  return gsapRef.to(el, { opacity: 0, duration, ease: 'power2.in' });
}

/**
 * Gentle infinite floating animation
 */
export function floatAnimation(el, range = 12, duration = 4) {
  return gsapRef.to(el, {
    y: `-=${range}`,
    duration,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

/**
 * Pulsing glow animation via box-shadow
 */
export function glowPulse(el, color = '232,122,164', duration = 2) {
  return gsapRef.to(el, {
    boxShadow: `0 0 40px rgba(${color},0.5), 0 0 80px rgba(${color},0.25)`,
    duration,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

/**
 * Typewriter effect — reveals text character by character
 * Returns a promise that resolves when typing finishes
 */
export function typeText(container, lines, charDelay = 35, lineDelay = 600) {
  return new Promise((resolve) => {
    container.innerHTML = '';

    let lineIndex = 0;
    const scrollParent = container.closest('.letter-paper') || container;

    function scrollToBottom() {
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      }
    }

    function typeLine() {
      if (lineIndex >= lines.length) {
        // Remove cursor
        const cursor = container.querySelector('.letter-cursor');
        if (cursor) cursor.remove();
        resolve();
        return;
      }

      const lineEl = document.createElement('span');
      lineEl.classList.add('letter-line');
      container.appendChild(lineEl);

      const cursor = document.createElement('span');
      cursor.classList.add('letter-cursor');
      container.appendChild(cursor);

      const text = lines[lineIndex];
      let charIndex = 0;

      // Make line visible
      gsapRef.set(lineEl, { opacity: 1 });
      lineEl.classList.add('typed');

      function typeChar() {
        if (charIndex < text.length) {
          lineEl.textContent += text[charIndex];
          charIndex++;
          scrollToBottom();
          setTimeout(typeChar, charDelay);
        } else {
          // Replace any emoji heart in typed line with SVG heart
          lineEl.innerHTML = lineEl.innerHTML.replace(/❤️|❤/g, `<svg class="inline-heart-svg" viewBox="0 0 24 24" width="22" height="22" style="vertical-align:-3px;margin-left:4px;"><path fill="url(#pink-gold-grad)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`);
          cursor.remove();
          lineEl.appendChild(document.createElement('br'));
          lineIndex++;
          scrollToBottom();
          setTimeout(typeLine, lineDelay);
        }
      }

      typeChar();
    }

    typeLine();
  });
}

/**
 * White bloom flash transition
 */
export function bloomFlash(duration = 1.2) {
  const flash = document.getElementById('bloom-flash');
  return new Promise((resolve) => {
    const tl = gsapRef.timeline({ onComplete: resolve });
    tl.to(flash, { opacity: 1, duration: duration * 0.4, ease: 'power2.in' })
      .to(flash, { opacity: 0, duration: duration * 0.6, ease: 'power2.out' });
  });
}

/**
 * Create CSS particle burst at a position
 */
export function createParticleBurst(x, y, count = 20, container = document.body) {
  const colors = ['#F8B4C8', '#C4A8D8', '#FFD700', '#FEFEFE', '#2E8B57'];
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 8 + 3;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = Math.random() * 120 + 60;
    const color = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(particle.style, {
      position: 'fixed',
      left: x + 'px',
      top: y + 'px',
      width: size + 'px',
      height: size + 'px',
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      pointerEvents: 'none',
      zIndex: '200',
    });

    container.appendChild(particle);

    gsapRef.to(particle, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 30,
      opacity: 0,
      scale: 0,
      duration: 0.8 + Math.random() * 0.6,
      ease: 'power2.out',
      onComplete: () => particle.remove(),
    });
  }
}

/**
 * Spawns an animated popping heart with mini sparkles at click/tap coordinates
 */
export function createClickHeart(x, y) {
  const heart = document.createElement('div');
  heart.className = 'click-heart-pop';

  const size = Math.random() * 14 + 24; // 24px - 38px
  const rot = (Math.random() - 0.5) * 50; // -25deg to 25deg
  const xOffset = (Math.random() - 0.5) * 50; // horizontal drift
  const yOffset = -(Math.random() * 50 + 65); // floats up 65px - 115px

  const gradients = [
    'url(#pink-gold-grad)',
    'url(#gold-grad)',
    'url(#flower-grad)',
    '#E87AA4',
    '#F8B4C8',
    '#FFD700',
  ];
  const fill = gradients[Math.floor(Math.random() * gradients.length)];

  heart.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 8px rgba(248,180,200,0.85));">
      <path fill="${fill}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;

  Object.assign(heart.style, {
    position: 'fixed',
    left: (x - size / 2) + 'px',
    top: (y - size / 2) + 'px',
    pointerEvents: 'none',
    zIndex: '99999',
    transform: `rotate(${rot}deg) scale(0)`,
    opacity: '1',
  });

  document.body.appendChild(heart);

  // GSAP pop and float animation
  const duration = 1.0 + Math.random() * 0.4;
  gsapRef.timeline({ onComplete: () => heart.remove() })
    .to(heart, {
      scale: 1.25,
      duration: 0.22,
      ease: 'back.out(2.2)',
    })
    .to(heart, {
      scale: 1,
      y: yOffset * 0.4,
      x: xOffset * 0.4,
      duration: 0.28,
      ease: 'power1.out',
    })
    .to(heart, {
      y: yOffset,
      x: xOffset,
      opacity: 0,
      scale: 0.7,
      duration: duration - 0.5,
      ease: 'power2.in',
    });

  // 3 mini gold sparkles bursting around click position
  for (let i = 0; i < 3; i++) {
    const mini = document.createElement('div');
    const miniSize = Math.random() * 4 + 3;
    const miniAngle = Math.random() * Math.PI * 2;
    const miniDist = Math.random() * 35 + 15;

    Object.assign(mini.style, {
      position: 'fixed',
      left: x + 'px',
      top: y + 'px',
      width: miniSize + 'px',
      height: miniSize + 'px',
      borderRadius: '50%',
      background: '#FFD700',
      boxShadow: '0 0 8px #FFD700',
      pointerEvents: 'none',
      zIndex: '99998',
    });

    document.body.appendChild(mini);

    gsapRef.to(mini, {
      x: Math.cos(miniAngle) * miniDist,
      y: Math.sin(miniAngle) * miniDist - 20,
      opacity: 0,
      scale: 0,
      duration: 0.7 + Math.random() * 0.3,
      ease: 'power2.out',
      onComplete: () => mini.remove(),
    });
  }
}

/**
 * Elastic pop-in animation
 */
export function elasticPop(el, scale = 1.15) {
  return gsapRef.fromTo(el,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' }
  );
}

/**
 * Cinematic scene transition
 * Fades out the "from" scene and fades in the "to" scene
 */
export function cinematicTransition(fromId, toId, options = {}) {
  const { duration = 1.2, useBloom = true } = options;

  return new Promise(async (resolve) => {
    const fromScene = document.getElementById(fromId);
    const toScene = document.getElementById(toId);

    if (!fromScene || !toScene) { resolve(); return; }

    // Start bloom flash in parallel with fade
    if (useBloom) {
      bloomFlash(duration);
    }

    // Fade out current scene
    await new Promise(r => {
      gsapRef.to(fromScene, {
        opacity: 0,
        duration: duration * 0.4,
        ease: 'power2.in',
        onComplete: () => {
          fromScene.classList.remove('active');
          fromScene.style.display = 'none';
          r();
        }
      });
    });

    // Prepare and show next scene
    toScene.style.display = 'flex';
    toScene.classList.add('active');
    gsapRef.fromTo(toScene,
      { opacity: 0 },
      {
        opacity: 1,
        duration: duration * 0.6,
        ease: 'power2.out',
        onComplete: resolve,
      }
    );
  });
}

/**
 * Initialize mouse parallax tracking on elements
 * Elements should have data-parallax-strength attribute
 */
export function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function updateParallax() {
    parallaxElements.forEach(el => {
      const strength = parseFloat(el.dataset.parallax) || 10;
      gsapRef.to(el, {
        x: mouseX * strength,
        y: mouseY * strength,
        duration: 0.6,
        ease: 'power2.out',
      });
    });
    requestAnimationFrame(updateParallax);
  }

  updateParallax();
}
