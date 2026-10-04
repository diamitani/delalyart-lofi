/* Delaly Art Lofi player. Vanilla JS, no dependencies.
 * - First visit: full-screen overlay; a tap starts the vibe (browser autoplay policy).
 * - Persists playing state, volume, and position in localStorage so the music
 *   resumes (from the saved position) when navigating between pages.
 * - Plays every track in window.LOFI_TRACKS in order, then loops the list.
 */
(function () {
  'use strict';

  var LS_PLAYING = 'lofi_playing';
  var LS_VOLUME = 'lofi_volume';
  var LS_TIME = 'lofi_time';
  var LS_TRACK = 'lofi_track';

  var tracks = window.LOFI_TRACKS || [];
  if (!tracks.length) return;

  var audio = document.getElementById('lofi-audio');
  var overlay = document.getElementById('vibe-overlay');
  var startBtn = document.getElementById('vibe-start');
  var playBtn = document.getElementById('play-btn');
  var iconPlay = document.getElementById('icon-play');
  var iconPause = document.getElementById('icon-pause');
  var vol = document.getElementById('vol');
  var trackTitle = document.getElementById('track-title');
  var trackSub = document.getElementById('track-sub');
  var playerBar = document.getElementById('player-bar');

  var current = parseInt(localStorage.getItem(LS_TRACK) || '0', 10);
  if (isNaN(current) || current < 0 || current >= tracks.length) current = 0;

  function setSources(i) {
    // clear old sources
    while (audio.firstChild) audio.removeChild(audio.firstChild);
    var t = tracks[i];
    [['mp3', 'audio/mpeg'], ['ogg', 'audio/ogg'], ['wav', 'audio/wav']].forEach(function (pair) {
      var key = pair[0], mime = pair[1];
      if (t.files[key]) {
        var s = document.createElement('source');
        s.src = t.files[key];
        s.type = mime;
        audio.appendChild(s);
      }
    });
    audio.load();
  }

  function renderTrack() {
    var t = tracks[current];
    trackTitle.textContent = t.title;
    trackSub.textContent = t.artist + ' · track ' + (current + 1) + ' of ' + tracks.length;
  }

  function markPlayingUI(isPlaying) {
    playerBar.classList.toggle('playing', isPlaying);
    iconPlay.style.display = isPlaying ? 'none' : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }
  function showOverlay(resume) {
    if (resume) {
      var h = overlay.querySelector('h1');
      if (h) h.textContent = 'Tap to resume the vibe';
    }
    overlay.classList.remove('hidden');
  }

  function persist() {
    try {
      localStorage.setItem(LS_TIME, String(audio.currentTime || 0));
      localStorage.setItem(LS_TRACK, String(current));
    } catch (e) { /* storage unavailable */ }
  }

  var saveTimer = null;
  function schedulePersist() {
    if (saveTimer) return;
    saveTimer = setTimeout(function () { saveTimer = null; persist(); }, 4000);
  }

  function play() {
    var p = audio.play();
    if (p && p.catch) {
      p.then(function () {
        localStorage.setItem(LS_PLAYING, '1');
        markPlayingUI(true);
        hideOverlay();
      }).catch(function () {
        // Autoplay blocked: ask for a tap.
        showOverlay(true);
        markPlayingUI(false);
      });
    } else {
      localStorage.setItem(LS_PLAYING, '1');
      markPlayingUI(true);
      hideOverlay();
    }
  }

  function pause() {
    audio.pause();
    localStorage.setItem(LS_PLAYING, '0');
    markPlayingUI(false);
    persist();
  }

  function nextTrack() {
    current = (current + 1) % tracks.length;
    var wasPlaying = !audio.paused;
    setSources(current);
    renderTrack();
    persist();
    if (wasPlaying || localStorage.getItem(LS_PLAYING) === '1') play();
  }

  // ---- wire up ----
  setSources(current);
  renderTrack();

  var savedVol = parseFloat(localStorage.getItem(LS_VOLUME));
  audio.volume = isNaN(savedVol) ? 0.8 : Math.min(1, Math.max(0, savedVol));
  vol.value = Math.round(audio.volume * 100);

  var savedTime = parseFloat(localStorage.getItem(LS_TIME));
  if (!isNaN(savedTime) && savedTime > 0) {
    try { audio.currentTime = savedTime; } catch (e) { /* not ready yet */ }
  }

  startBtn.addEventListener('click', function () { play(); });
  playBtn.addEventListener('click', function () {
    if (audio.paused) play(); else pause();
  });
  vol.addEventListener('input', function () {
    audio.volume = vol.value / 100;
    localStorage.setItem(LS_VOLUME, String(audio.volume));
  });
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('timeupdate', schedulePersist);
  window.addEventListener('beforeunload', persist);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) persist();
  });

  // ---- initial state ----
  if (localStorage.getItem(LS_PLAYING) === '1') {
    // Returning visitor with music on: try to resume silently, no overlay.
    hideOverlay();
    play(); // falls back to overlay if the browser blocks it
  } else {
    markPlayingUI(false);
  }
})();
