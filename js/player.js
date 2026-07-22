/* =============================================================
   PLAYER.JS — Scene 4: Music Player & Video Player
   ============================================================= */

const gsapRef = window.gsap;

/* ---- Playlist Configuration ---- */
const PLAYLIST = [
  { title: 'Who Knows', artist: 'Daniel Caesar', src: 'assets/music/song1.mp3', cover: 'assets/images/memories/memory1.jpg' },
  { title: 'Seasons', artist: 'Wave to earth', src: 'assets/music/song2.mp3', cover: 'assets/images/memories/memory2.jpg' },
  { title: 'Sagip', artist: 'Jan Roberts', src: 'assets/music/song3.mp3', cover: 'assets/images/memories/memory3.jpg' },
  { title: 'Janice', artist: 'Dilaw', src: 'assets/music/song4.mp3', cover: 'assets/images/memories/memory4.jpg' },
  { title: 'The Night We Met', artist: 'Lord Huron', src: 'assets/music/song5.mp3', cover: 'assets/images/memories/memory5.jpg' }
];

/* ---- Module State ---- */
let audioEl;
let currentTrack = 0;
let isPlaying = false;
let isLooping = false;
let progressDragging = false;

/* ==================== MUSIC PLAYER ==================== */

export function initMusicPlayer() {
  audioEl = document.getElementById('music-audio');
  if (!audioEl) return;

  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const loopBtn = document.getElementById('loop-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const progressContainer = document.getElementById('progress-container');
  const playlistToggle = document.getElementById('playlist-toggle-btn');

  // Set initial volume
  audioEl.volume = 0.8;

  // Play / Pause
  playBtn?.addEventListener('click', togglePlay);

  // Previous / Next
  prevBtn?.addEventListener('click', () => changeTrack(-1));
  nextBtn?.addEventListener('click', () => changeTrack(1));

  // Loop
  loopBtn?.addEventListener('click', toggleLoop);

  // Volume
  volumeSlider?.addEventListener('input', (e) => {
    audioEl.volume = e.target.value / 100;
  });

  // Progress bar click to seek
  progressContainer?.addEventListener('click', (e) => {
    if (!audioEl.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioEl.currentTime = ratio * audioEl.duration;
  });

  // Time update
  audioEl.addEventListener('timeupdate', updateProgress);
  audioEl.addEventListener('loadedmetadata', updateTotalTime);
  audioEl.addEventListener('ended', onTrackEnd);

  // Playlist toggle
  playlistToggle?.addEventListener('click', togglePlaylist);

  // Build playlist UI
  buildPlaylistUI();

  // Load first track
  loadTrack(0);
}

/* ---- Play / Pause ---- */

function togglePlay() {
  if (!audioEl) return;

  if (isPlaying) {
    audioEl.pause();
  } else {
    audioEl.play().catch(() => { });
  }
  isPlaying = !isPlaying;
  updatePlayButton();
  updateEqualizer();
  updateAlbumSpin();
}

function updatePlayButton() {
  const playIcon = document.querySelector('.play-icon');
  const pauseIcon = document.querySelector('.pause-icon');
  if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
  if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
}

/* ---- Track Management ---- */

function loadTrack(index) {
  if (index < 0 || index >= PLAYLIST.length) return;

  currentTrack = index;
  const track = PLAYLIST[currentTrack];

  audioEl.src = track.src;

  // Update UI
  const titleEl = document.getElementById('song-title');
  const artistEl = document.getElementById('song-artist');
  const coverEl = document.getElementById('album-cover-img');

  if (titleEl) titleEl.textContent = track.title;
  if (artistEl) artistEl.textContent = track.artist;
  if (coverEl && track.cover) coverEl.src = track.cover;

  // Update progress
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) progressBar.style.width = '0%';

  const currentTime = document.getElementById('current-time');
  if (currentTime) currentTime.textContent = '0:00';

  // Update playlist active state
  document.querySelectorAll('.playlist-list li').forEach((li, i) => {
    li.classList.toggle('active', i === currentTrack);
  });

  // If was playing, continue playing
  if (isPlaying) {
    audioEl.play().catch(() => { });
  }
}

function changeTrack(direction) {
  let next = currentTrack + direction;
  if (next >= PLAYLIST.length) next = 0;
  if (next < 0) next = PLAYLIST.length - 1;
  loadTrack(next);
}

function onTrackEnd() {
  if (isLooping) {
    audioEl.currentTime = 0;
    audioEl.play().catch(() => { });
  } else {
    changeTrack(1);
  }
}

/* ---- Loop Toggle ---- */

function toggleLoop() {
  isLooping = !isLooping;
  const loopBtn = document.getElementById('loop-btn');
  if (loopBtn) loopBtn.classList.toggle('active', isLooping);
}

/* ---- Progress Updates ---- */

function updateProgress() {
  if (!audioEl || !audioEl.duration || progressDragging) return;

  const ratio = audioEl.currentTime / audioEl.duration;
  const progressBar = document.getElementById('progress-bar');
  const currentTimeEl = document.getElementById('current-time');

  if (progressBar) progressBar.style.width = (ratio * 100) + '%';
  if (currentTimeEl) currentTimeEl.textContent = formatTime(audioEl.currentTime);
}

function updateTotalTime() {
  const totalTimeEl = document.getElementById('total-time');
  if (totalTimeEl && audioEl.duration) {
    totalTimeEl.textContent = formatTime(audioEl.duration);
  }
}

/* ---- Equalizer ---- */

function updateEqualizer() {
  const eq = document.getElementById('equalizer');
  if (eq) eq.classList.toggle('active', isPlaying);
}

/* ---- Album Art Spin ---- */

function updateAlbumSpin() {
  const art = document.getElementById('album-art');
  if (art) art.classList.toggle('spinning', isPlaying);
}

/* ---- Playlist UI ---- */

function buildPlaylistUI() {
  const list = document.getElementById('playlist-list');
  if (!list) return;

  list.innerHTML = '';
  PLAYLIST.forEach((track, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="pl-num">${i + 1}</span>${track.title}`;
    li.classList.toggle('active', i === currentTrack);
    li.addEventListener('click', () => {
      loadTrack(i);
      if (!isPlaying) togglePlay();
    });
    list.appendChild(li);
  });
}

function togglePlaylist() {
  const panel = document.getElementById('playlist-panel');
  if (panel) panel.classList.toggle('visible');
}


/* ==================== VIDEO PLAYER ==================== */

export function initVideoPlayer() {
  const video = document.getElementById('main-video');
  if (!video) return;

  const playBtn = document.getElementById('video-play-btn');
  const playOverlay = document.getElementById('video-play-overlay');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const progressWrap = document.getElementById('video-progress-wrap');

  let videoPlaying = false;

  // Play / Pause via button
  playBtn?.addEventListener('click', () => toggleVideo());

  // Play via overlay click
  playOverlay?.addEventListener('click', () => toggleVideo());

  // Fullscreen
  fullscreenBtn?.addEventListener('click', () => {
    const wrapper = document.querySelector('.video-glass');
    if (wrapper) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        wrapper.requestFullscreen?.() || wrapper.webkitRequestFullscreen?.();
      }
    }
  });

  // Progress click to seek
  progressWrap?.addEventListener('click', (e) => {
    if (!video.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * video.duration;
  });

  // Time update
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const ratio = video.currentTime / video.duration;
    const progressBar = document.getElementById('video-progress');
    const timeEl = document.getElementById('video-time');

    if (progressBar) progressBar.style.width = (ratio * 100) + '%';
    if (timeEl) timeEl.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  // Video ended — dispatch custom event
  video.addEventListener('ended', () => {
    videoPlaying = false;
    updateVideoUI(false);
    document.dispatchEvent(new CustomEvent('videoEnded'));
  });

  function toggleVideo() {
    if (videoPlaying) {
      video.pause();
    } else {
      video.play().catch(() => { });
    }
    videoPlaying = !videoPlaying;
    updateVideoUI(videoPlaying);
  }

  function updateVideoUI(playing) {
    const btn = document.getElementById('video-play-btn');
    const overlay = document.getElementById('video-play-overlay');

    if (btn) btn.textContent = playing ? '⏸' : '▶';
    if (overlay) overlay.classList.toggle('hidden', playing);
  }
}


/* ==================== UTILITIES ==================== */

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
