// ============================================================
// 🎵 BEATSYNC.JS — sistem beat-synced gameplay: baca file beatmap,
// bangun jadwal kapan arrow harus muncul, spawn arrow sesuai jadwal.
// ============================================================

// FIX path: sebelumnya prefix yang di-strip cuma "assets/", sekarang lagu
// pindah ke "assets/audio/songs/" jadi prefix yang di-strip ikut disesuaikan.
// Folder beatmaps/ sendiri TIDAK dipindah/direstruktur - tetap flat seperti
// sebelumnya, cuma pencocokan nama filenya yang perlu ngikutin lokasi baru mp3.
function getBeatmapPath(mp3Path) {
  const fileName = mp3Path.replace(/^assets\/audio\/songs\//, "").replace(/\.mp3$/i, ".json");
  return "beatmaps/" + fileName;
}

// Format ASLI dari tool tap kamu: JSON { song, beats: [{ timestamp, direction }] }.
// direction sudah otomatis cocok sama nama internal kita (kiri/atas/kanan),
// jadi tidak perlu translasi apapun.
function parseBeatmap(rawText) {
  if (!rawText) return [];

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.warn("Gagal parse beatmap JSON:", e);
    return [];
  }

  if (!data || !Array.isArray(data.beats)) return [];

  const validDirections = new Set(POSE_DIRECTIONS);

  return data.beats
    .filter((b) => {
      const validTime = typeof b.timestamp === "number" && !Number.isNaN(b.timestamp);
      const validDir = validDirections.has(b.direction);
      if (!validTime || !validDir) {
        console.warn("Beat tidak valid dilewati:", b);
      }
      return validTime && validDir;
    })
    .map((b) => ({ time: b.timestamp, direction: b.direction }))
    .sort((a, b) => a.time - b.time);
}

async function checkAllSongAvailability() {
  const options = Array.from(document.querySelectorAll("#music-select option"));

  await Promise.all(
    options.map(async (opt) => {
      const mp3Path = opt.value;
      const beatmapPath = getBeatmapPath(mp3Path);
      try {
        const res = await fetch(encodeURI(beatmapPath));
        if (!res.ok) throw new Error("Beatmap tidak ditemukan");
        const text = await res.text();
        songAvailability[mp3Path] = true;
        songBeatmapTextCache[mp3Path] = text;
      } catch (e) {
        songAvailability[mp3Path] = false;
      }
    })
  );

  options.forEach((opt) => {
    if (songAvailability[opt.value] === false && !opt.textContent.includes("belum tersedia")) {
      opt.textContent += " (belum tersedia)";
    }
  });

  updateSongAvailabilityUI();
}

function updateSongAvailabilityUI() {
  const select = document.getElementById("music-select");
  const selected = select.value;
  songUnavailable = songAvailability[selected] !== true;

  const startBtn = document.getElementById("start-btn");
  if (startBtn) startBtn.disabled = songUnavailable;
}

function buildBeatSchedule(mp3Path) {
  const rawText = songBeatmapTextCache[mp3Path];
  const fullBeats = parseBeatmap(rawText); // [{ time, direction }]

  const thinningFactor = DIFFICULTY_THINNING[currentDifficulty] || 1;
  const thinnedBeats = fullBeats.filter((_, i) => i % thinningFactor === 0);

  const travelDistance = gameCanvas.height - targetY;
  const travelTimeSec = travelDistance / ARROW_SPEED_PX_PER_SEC;

  beatSchedule = thinnedBeats
    .map((b) => ({
      beatTime: b.time,
      spawnTime: b.time - travelTimeSec,
      direction: b.direction,
    }))
    .sort((a, b) => a.spawnTime - b.spawnTime);

  nextBeatIndex = 0;
}

// FIX: arah sekarang diambil LANGSUNG dari data chart (hasil tap manual kamu),
// bukan digenerate acak lagi. Logic anti-3x-beruntun yang dulu dihapus total,
// karena kalau chart-nya memang sengaja didesain 2-3 arah sama beruntun
// (lihat contoh nyata di file Fortune Cookie: "atas","atas" beruntun),
// logic lama itu justru akan MEMAKSA UBAH arah yang sudah kamu tentukan sendiri.
function spawnArrowForBeat(beatTime, direction) {
  const symbol = DIRECTION_TO_SYMBOL[direction];
  if (!symbol) {
    console.warn(`Arah "${direction}" tidak dikenali, beat dilewati.`);
    return;
  }

  const x = directionX[symbol];
  arrows.push({ symbol, x, y: gameCanvas.height, beatTime, judged: false });
}

function updateBeatSpawner() {
  if (!gameStarted || gameEnded || !currentAudio) return;

  const t = currentAudio.currentTime;
  while (nextBeatIndex < beatSchedule.length && beatSchedule[nextBeatIndex].spawnTime <= t) {
    const beat = beatSchedule[nextBeatIndex];
    spawnArrowForBeat(beat.beatTime, beat.direction);
    nextBeatIndex++;
  }
}

// Ambil daftar lagu dari endpoint PHP yang scan folder assets/audio/songs/
// secara real-time. Taruh mp3 baru di folder itu, refresh browser, langsung
// muncul di dropdown - tidak perlu edit index.html atau kode apapun.
async function loadSongList() {
  const select = document.getElementById("music-select");
  try {
    const res = await fetch("api/list-songs.php");
    if (!res.ok) throw new Error("Gagal memuat daftar lagu dari server");
    const data = await res.json();

    select.innerHTML = "";
    if (!data.songs || data.songs.length === 0) {
      select.innerHTML = '<option value="">Tidak ada lagu ditemukan</option>';
      return;
    }

    data.songs.forEach((song) => {
      const opt = document.createElement("option");
      opt.value = song.value;
      opt.textContent = song.label;
      select.appendChild(opt);
    });
  } catch (e) {
    console.warn("loadSongList gagal, pastikan dijalankan lewat server PHP:", e);
    select.innerHTML = '<option value="">Gagal memuat daftar lagu (butuh server PHP)</option>';
  }
}
