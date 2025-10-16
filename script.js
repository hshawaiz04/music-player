
// ---------- Helpers & state ----------
function rndId() { return Math.random().toString(36).slice(2, 9); }
function log(...args) { console.log("[MP]", ...args); }

// Demo Playlist
let playlist = [

  {
    title: "That Go!",
    artist: "Young Thug",
    src: "songs/that_go.mp3",
    cover: "assets/my_cover.jpg",
    id: rndId(),
  },
  {
    title: "712pm",
    artist: "Future",
    src: "songs/712pm.mp3",
    cover: "assets/my_cover2.jpg",
    id: rndId(),
  },
  {
    title: "one of wun",
    artist: "Gunna",
    src: "songs/one_of_wun.mp3",
    cover: "assets/my_cover3.jpg",
    id: rndId(),
  },
];

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const coverEl = document.getElementById("cover");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeEl = document.getElementById("volume");
const speedEl = document.getElementById("speed");
const playlistEl = document.getElementById("playlist");
const fileAdd = document.getElementById("fileAdd");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const likeBtn = document.getElementById("like");
const searchEl = document.getElementById("search");
const themeBtn = document.getElementById("themeBtn");

let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let favorites = new Set(JSON.parse(localStorage.getItem("mp_favs") || "[]"));

// ---------- AudioContext & Visualizer (one-time safe setup) ----------
let audioCtx = null;
let analyser = null;
let dataArray = null;
let _smoothedAvg = 0;

function setupVisualizerOnce() {
  if (audioCtx && analyser && dataArray) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    src.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    // start draw loop (drawVisualizer will check analyser/dataArray)
    drawVisualizer();
    log("Visualizer initialized");
  } catch (err) {
    console.warn("setupVisualizerOnce error:", err);
  }
}

async function ensureAudioContext() {
  // create visualizer if missing (safe on first gesture)
  if (!audioCtx) setupVisualizerOnce();
  if (audioCtx && audioCtx.state === "suspended") {
    await audioCtx.resume();
    log("AudioContext resumed");
  }
}

// Draw visualizer + reactive bass-driven glow (safe checks)
function drawVisualizer() {
  const canvas = document.getElementById("visualizer");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = canvas.clientWidth);
  const H = (canvas.height = canvas.clientHeight);

  requestAnimationFrame(drawVisualizer);

  if (!analyser || !dataArray || !dataArray.length) {
    ctx.clearRect(0, 0, W, H);
    return;
  }

  analyser.getByteFrequencyData(dataArray);

  // draw bars
  ctx.clearRect(0, 0, W, H);
  const barWidth = (W / dataArray.length) * 1.4;
  let x = 0;
  const visualColor = getComputedStyle(document.documentElement).getPropertyValue('--visualizer-color') || 'rgba(139,92,246,0.8)';
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * H;
    ctx.fillStyle = visualColor.trim();
    ctx.fillRect(x, H - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }

  // bass-driven reactive glow (bonus tweak)
  const bassBins = Math.min(40, dataArray.length);
  if (bassBins <= 0) return;
  let bassSum = 0;
  for (let i = 0; i < bassBins; i++) bassSum += dataArray[i];
  const bassAvg = bassSum / bassBins;

  // smoothing (to avoid twitchiness)
  const smoothingFactor = 0.12;
  _smoothedAvg = _smoothedAvg + (bassAvg - _smoothedAvg) * smoothingFactor;

  // map smoothing -> blur/scale
  const blur = Math.min(50, Math.max(8, Math.round(_smoothedAvg / 3)));
  const scale = 1 + Math.min(0.06, _smoothedAvg / 2000);

  const accentStart = getComputedStyle(document.documentElement).getPropertyValue('--accent-start').trim() || '#7b61ff';
  const accentEnd = getComputedStyle(document.documentElement).getPropertyValue('--accent-end').trim() || '#ff6b6b';

  try {
    if (coverEl) {
      coverEl.style.boxShadow = `0 0 ${15 + blur}px ${accentStart}, 0 0 ${30 + blur * 1.5}px ${accentEnd}`;
      coverEl.style.transform = `scale(${scale})`;
    }
  } catch (e) {
    console.warn("Visualizer apply styles error:", e);
  }
}

// ensure visualizer is created on first user gesture (helps browsers' autoplay policies)
function initOnFirstGesture() {
  const init = () => {
    setupVisualizerOnce();
    window.removeEventListener('click', init);
    window.removeEventListener('keydown', init);
  };
  window.addEventListener('click', init, { once: true });
  window.addEventListener('keydown', init, { once: true });
}
initOnFirstGesture();

// ---------- iTunes API fetch (improved) ----------
async function fetchCoverFromAPI(title, artist = "") {
  try {
    const cleanTitle = String(title)
      .replace(/[_-]+/g, " ")
      .replace(/\(.*?\)/g, "")
      .replace(/\bft\.?\b/ig, "")
      .replace(/\s+/g, " ")
      .trim();
    const query = encodeURIComponent(`${cleanTitle} ${artist}`.trim());
    const url = `https://itunes.apple.com/search?term=${query}&limit=1&media=music`;
    log("Searching iTunes:", url);
    const res = await fetch(url);
    if (!res.ok) {
      log("iTunes fetch status:", res.status);
      throw new Error("iTunes fetch failed");
    }
    const data = await res.json();
    log("iTunes results:", data.resultCount);
    if (data.results && data.results.length) {
      const r = data.results[0];
      const art = r.artworkUrl100 ? r.artworkUrl100.replace("100x100bb", "500x500bb") : null;
      return { cover: art || "assets/placeholder.jpg", artist: r.artistName || artist || "Unknown Artist" };
    }
  } catch (err) {
    console.warn("fetchCoverFromAPI error:", err);
  }
  return { cover: "assets/placeholder.jpg", artist: artist || "Local Upload" };
}

// ---------- UI: render playlist ----------
function renderPlaylist(filter = "") {
  playlistEl.innerHTML = "";
  playlist.forEach((song, i) => {
    if (filter && !song.title.toLowerCase().includes(filter) && !song.artist.toLowerCase().includes(filter)) return;
    const li = document.createElement("li");
    li.dataset.index = i;
    li.className = "flex items-center gap-3 p-2 hover:bg-white/10 rounded cursor-pointer transition";
    li.innerHTML = `
      <img src="${song.cover}" class="w-12 h-12 rounded object-cover" />
      <div class="flex-1">
        <div class="font-semibold">${song.title}</div>
        <div class="text-xs text-slate-400">${song.artist}</div>
      </div>
      <div class="text-sm">${favorites.has(song.id) ? "❤️" : ""}</div>
    `;
    li.onclick = () => { loadTrack(i); playTrack(); };
    if (i === currentIndex) li.classList.add("bg-white/10");
    playlistEl.appendChild(li);
  });
}

// ---------- Load & play controls ----------
function loadTrack(index) {
  if (!playlist.length) return;
  if (index < 0) index = playlist.length - 1;
  if (index >= playlist.length) index = 0;
  currentIndex = index;
  const s = playlist[currentIndex];
  audio.src = s.src;
  audio.load();
  titleEl.textContent = s.title || "Unknown";
  artistEl.textContent = s.artist || "Unknown";
  coverEl.src = s.cover || "assets/placeholder.jpg";
  highlightActive();
  log("Loaded:", s.title);
}

async function playTrack() {
  try {
    setupVisualizerOnce();
    await ensureAudioContext();
    await audio.play();
    isPlaying = true;
    playBtn.textContent = "⏸";
    // use glow flicker animation while playing if defined in CSS
    coverEl.style.animation = "glowAlbum 4s ease-in-out infinite";
    log("Playing:", playlist[currentIndex]?.title);
  } catch (err) {
    console.warn("playTrack error:", err);
  }
}

function pauseTrack() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "▶";
  coverEl.style.animation = "none";
}

function togglePlay() { isPlaying ? pauseTrack() : playTrack(); }

function changeTrack(delta) {
  if (!playlist.length) return;
  if (isShuffle) currentIndex = Math.floor(Math.random() * playlist.length);
  else currentIndex = (currentIndex + delta + playlist.length) % playlist.length;
  loadTrack(currentIndex);
  playTrack();
}

// ---------- Progress bar ----------
audio.addEventListener("timeupdate", () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = pct + "%";
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
});

progress.addEventListener("click", (e) => {
  const r = progress.getBoundingClientRect();
  const x = e.clientX - r.left;
  audio.currentTime = (x / r.width) * audio.duration;
});

function formatTime(s) { if (!s || isNaN(s)) return "0:00"; const m = Math.floor(s / 60); const sec = Math.floor(s % 60).toString().padStart(2, '0'); return `${m}:${sec}`; }

// ---------- Shuffle / Repeat ----------
shuffleBtn.onclick = () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle("bg-purple-500", isShuffle); };
repeatBtn.onclick = () => { isRepeat = !isRepeat; repeatBtn.classList.toggle("bg-purple-500", isRepeat); };
audio.addEventListener("ended", () => { if (isRepeat) { audio.currentTime = 0; playTrack(); } else changeTrack(1); });

// ---------- Favorites ----------
likeBtn.onclick = () => {
  if (!playlist.length) return;
  const id = playlist[currentIndex].id;
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  localStorage.setItem("mp_favs", JSON.stringify([...favorites]));
  renderPlaylist(searchEl.value.toLowerCase());
};

// ---------- Search ----------
searchEl.addEventListener("input", () => renderPlaylist(searchEl.value.toLowerCase()));

// ---------- Volume & Speed + Range fill ----------
function updateRangeFill(rangeEl) {
  if (!rangeEl) return;
  const min = Number(rangeEl.min || 0);
  const max = Number(rangeEl.max || 1);
  const val = Number(rangeEl.value);
  const pct = Math.round(((val - min) / (max - min)) * 100);
  const start = getComputedStyle(document.documentElement).getPropertyValue('--accent-start')?.trim() || '#7b61ff';
  const end = getComputedStyle(document.documentElement).getPropertyValue('--accent-end')?.trim() || '#ff6b6b';
  rangeEl.style.background = `linear-gradient(90deg, ${start} 0%, ${end} ${pct}%, rgba(255,255,255,0.06) ${pct}%, rgba(255,255,255,0.06) 100%)`;
}

volumeEl.value = volumeEl.value || 0.8;
audio.volume = Number(volumeEl.value);
updateRangeFill(volumeEl);
volumeEl.addEventListener("input", () => { audio.volume = Number(volumeEl.value); updateRangeFill(volumeEl); });
speedEl.addEventListener("change", () => audio.playbackRate = Number(speedEl.value));

// ---------- Theme toggle ----------
function updateProgressAccent() {
  progressBar.style.background = getComputedStyle(document.documentElement).getPropertyValue('--fill') || '';
  updateRangeFill(volumeEl);
}
themeBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("neon");
  updateProgressAccent();
});

// ---------- File upload with iTunes integration ----------
fileAdd.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const f of files) {
    const url = URL.createObjectURL(f);
    const raw = f.name.replace(/\.[^/.]+$/, "");
    const pretty = raw.replace(/[_-]+/g, " ").trim();
    log("Upload:", f.name, "=> query:", pretty);
    const info = await fetchCoverFromAPI(pretty);
    playlist.push({ title: pretty, artist: info.artist || "Local Upload", src: url, cover: info.cover || "assets/placeholder.jpg", id: rndId() });
  }
  renderPlaylist();
  loadTrack(playlist.length - 1);
});

// ---------- Keyboard shortcuts ----------
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); togglePlay(); }
  if (e.code === "ArrowRight") changeTrack(1);
  if (e.code === "ArrowLeft") changeTrack(-1);
});

// ---------- Highlight active ----------
function highlightActive() {
  document.querySelectorAll("#playlist li").forEach(li => li.classList.remove("bg-white/10"));
  const el = document.querySelector(`#playlist li[data-index="${currentIndex}"]`);
  if (el) el.classList.add("bg-white/10");
}

// ---------- Init & event wiring ----------
renderPlaylist();
loadTrack(0);

playBtn.onclick = togglePlay;
prevBtn.onclick = () => changeTrack(-1);
nextBtn.onclick = () => changeTrack(1);

// debug
audio.addEventListener("error", (e) => console.error("Audio error:", audio.error));
audio.addEventListener("canplay", () => log("canplay"));
audio.addEventListener("loadedmetadata", () => log("metadata duration:", audio.duration));
window.addEventListener("resize", () => { const c = document.getElementById("visualizer"); if (c) c.width = c.clientWidth; });

log("Script loaded. Use a user gesture (click play) to initialize audio/visualizer.");
