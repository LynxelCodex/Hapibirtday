/* =============================================================
   LETTER.JS — Scene 3: Envelope & Love Letter
   ============================================================= */

import { typeText, fadeIn } from './animations.js';

const gsapRef = window.gsap;

/* ---- Letter Content ---- */
const LETTER_LINES = [
  'Happy 19th Birthday po hehe',
  '',
  '',
  'This is a short message lng but I wanna say that.',
  'Thank you for always staying and accepting me.',
  'I dont have anything to give for now but I hope youll.',
  'love this cute little surprise, I want you to know that.',
  'I love you more than words can ever express.',
  'I wish you a good health po and more strenght and',
  'wisdom para ma overcome mo pa ang mga pagsubok.',
  'I cant wait for you to reached your goals in life and',
  'Im always here to support you no matter what happens.',
  'Be confident po and believe in yourself just like how I believe in you.',
  'I want you to know that Im so proud of you.',
  'again happy birthday and more birthdays to come',
  '',
  'Happy Birthday,I hope you like it hehe.    ',
  'sincerly yours:)',
  'Paul',
];

/* ---- Module State ---- */
let isOpened = false;

/* ---- Public: Initialize Letter Scene ---- */

export function initLetter() {
  const envelope = document.getElementById('envelope');
  const waxSeal = document.getElementById('wax-seal');

  if (!envelope) return;

  // Click handler
  envelope.addEventListener('click', handleEnvelopeClick);
  waxSeal?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleEnvelopeClick();
  });
}

/* ---- Envelope Click Handler ---- */

async function handleEnvelopeClick() {
  if (isOpened) return;
  isOpened = true;

  const envelope = document.getElementById('envelope');
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const flap = document.getElementById('envelope-flap');
  const waxSeal = document.getElementById('wax-seal');
  const letterPaper = document.getElementById('letter-paper');
  const letterBody = document.getElementById('letter-body');
  const instruction = document.getElementById('letter-instruction');
  const continueBtn = document.getElementById('letter-continue-btn');

  // Remove cursor pointer
  envelope.style.cursor = 'default';

  // Build opening timeline
  const tl = gsapRef.timeline();

  // 1. Hide instruction text
  tl.to(instruction, {
    opacity: 0,
    y: -10,
    duration: 0.3,
    ease: 'power2.in',
  });

  // 2. Wax seal breaks (scale up + fade)
  tl.to(waxSeal, {
    scale: 1.5,
    opacity: 0,
    rotation: 15,
    duration: 0.5,
    ease: 'power2.out',
    onStart: () => waxSeal.classList.add('broken'),
  });

  // 3. Envelope flap opens
  tl.add(() => {
    flap.classList.add('open');
  }, '-=0.2');

  // 4. Wait for flap animation
  tl.to({}, { duration: 0.8 });

  // 5. Hide instruction completely
  tl.set(instruction, { display: 'none' });

  // 6. Move envelope up and shrink to make room for letter
  tl.to(envelopeWrapper, {
    y: -30,
    scale: 0.55,
    opacity: 0.4,
    duration: 0.8,
    ease: 'power2.inOut',
  });

  // 6. Show letter paper
  tl.add(() => {
    letterPaper.classList.add('visible');
  }, '-=0.4');

  // 7. Wait for paper unfold animation
  tl.to({}, { duration: 0.6 });

  // 8. Type the letter text
  tl.add(async () => {
    await typeText(letterBody, LETTER_LINES, 30, 500);

    // Smoothly scroll back to the top so she can read it from the beginning
    setTimeout(() => {
      letterPaper?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);

    // Show continue button after typing is done
    if (continueBtn) {
      continueBtn.style.display = 'inline-flex';
      fadeIn(continueBtn, 0.8, 0.3);
    }
  });
}

/* ---- Public: Reset letter state (if needed) ---- */

export function resetLetter() {
  isOpened = false;

  const flap = document.getElementById('envelope-flap');
  const waxSeal = document.getElementById('wax-seal');
  const letterPaper = document.getElementById('letter-paper');
  const letterBody = document.getElementById('letter-body');
  const instruction = document.getElementById('letter-instruction');
  const continueBtn = document.getElementById('letter-continue-btn');
  const envelopeWrapper = document.getElementById('envelope-wrapper');

  if (flap) flap.classList.remove('open');
  if (waxSeal) {
    waxSeal.classList.remove('broken');
    gsapRef.set(waxSeal, { scale: 1, opacity: 1, rotation: 0 });
  }
  if (letterPaper) {
    letterPaper.classList.remove('visible');
    letterPaper.scrollTop = 0;
  }
  if (letterBody) letterBody.innerHTML = '';
  if (instruction) gsapRef.set(instruction, { opacity: 0.8, y: 0 });
  if (continueBtn) continueBtn.style.display = 'none';
  if (envelopeWrapper) gsapRef.set(envelopeWrapper, { y: 0, scale: 1, opacity: 1 });
}
