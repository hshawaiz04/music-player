# 🎵 My Music Player

A **modern, responsive music player** built with **HTML, Tailwind CSS, and Vanilla JavaScript** — featuring reactive audio visualizations, automatic album art from the **iTunes API**, a neon-themed dark mode, and smooth playback controls.

![Music Player Preview](assets/cover1.jpg)

---

## ✨ Features

### 🎧 Core Player
- Play / Pause / Next / Previous
- Adjustable **volume** and **playback speed**
- Displays **current time** and **duration**
- **Shuffle** and **Repeat** modes
- Add & play **local MP3 files**

### 🖼️ Smart Album Art
- Automatically fetches high-quality album covers and artist names from the **iTunes API**
- Uses a fallback placeholder image if no data is found

### 💡 Reactive Visualizer
- Real-time audio visualization using the **Web Audio API**
- Bass-driven **glow animation** that reacts dynamically to music intensity
- Smooth transitions for glow and scale effects

### 🌗 Themes & Design
- **Responsive** layout for desktop, tablet, and mobile
- **Two elegant themes:**
  - 🎨 *Default Mode:* Purple & white gradient
  - 🌈 *Neon Mode:* Black background with vibrant pink highlights
- Volume slider uses **accent color trail fill** (Spotify-style)
- Smooth animations on all UI components

### 🧠 Extras
- Keyboard shortcuts:
  - `Space` → Play / Pause  
  - `→` → Next Track  
  - `←` → Previous Track
- Persistent **favorites list** (stored locally)
- Search and filter songs in the playlist
- Simple export and import options for playlists

---

## 🛠️ Tech Stack

| Category | Tools |
|-----------|-------|
| Frontend | HTML5, Tailwind CSS |
| Logic & Audio | JavaScript (ES6+), Web Audio API |
| API Integration | iTunes Search API |
| Storage | LocalStorage (Favorites) |
| Hosting | Local / GitHub Pages |

---

## 🚀 Getting Started

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<yourusername>/music-player.git
cd music-player
```

### 2️⃣ Start a local server
You can use Python or VSCode Live Server:

```bash
python -m http.server 8000
```

Then open:
```
http://localhost:8000
```

> ⚠️ The iTunes API requires an internet connection and won’t work over `file://`.  
> Always serve it over a local server.

### 3️⃣ Add your music
Drop `.mp3` files using the “Choose Files” button —  
the player will automatically fetch cover art and display them in the playlist.

---

## 📸 Screenshots

| Default Mode | Neon Mode |
|---------------|------------|
| ![Default](assets/screenshot-default.png) | ![Neon](assets/screenshot-neon.png) |

---

## ⚙️ Folder Structure

```
music-player/
├── assets/
│   ├── cover1.jpg
│   ├── cover2.jpg
│   ├── placeholder.jpg
│   └── icons/...
├── songs/
│   ├── demo1.wav
│   ├── demo2.wav
│   └── demo3.wav
├── index.html
├── script.js
├── README.md
└── style.css (optional, generated from Tailwind CDN)
```

---

## 🧩 Future Enhancements
- 🎛️ Playlist export/import as `.json`
- 🎤 Lyrics sync (via Musixmatch or Genius API)
- 🎨 Animated canvas backgrounds
- 📀 Drag-and-drop file upload
- 📱 Compact mobile mini-player

---

## 🤝 Contributing
Pull requests are welcome!  
If you find a bug or have an idea for a new feature, feel free to open an issue.

---

## 📜 License
This project is licensed under the [MIT License](LICENSE).

---

## 💬 Acknowledgements
- [Tailwind CSS](https://tailwindcss.com/)
- [Apple iTunes API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
