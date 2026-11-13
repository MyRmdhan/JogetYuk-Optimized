// ============================================================
// 🏆 LEADERBOARD.JS — localStorage save/get (siap migrasi ke backend
// nanti) + render tampilan tabel. Logic simpan/ambil TIDAK BERUBAH.
// ============================================================

const LEADERBOARD_PREFIX = "jogetyuk_leaderboard::";

function getLeaderboardKey(songValue, difficulty) {
  return `${LEADERBOARD_PREFIX}${songValue}::${difficulty}`;
}

// GANTI ISI 2 FUNGSI INI SAJA kalau nanti mau pindah ke backend/MySQL -
// bagian lain di game tidak perlu disentuh sama sekali.
function saveScoreToLeaderboard(songValue, difficulty, name, scoreValue) {
  const key = getLeaderboardKey(songValue, difficulty);
  let list = getLeaderboard(songValue, difficulty);
  list.push({ name, score: scoreValue, date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  list = list.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(list));
  return list;
}

function getLeaderboard(songValue, difficulty) {
  const key = getLeaderboardKey(songValue, difficulty);
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

// Kumpulkan semua entri dari semua key localStorage kita, buat mode "Top 5 Global"
function getAllLeaderboardEntries(difficultyFilter) {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(LEADERBOARD_PREFIX)) continue;

    const parts = key.slice(LEADERBOARD_PREFIX.length).split("::");
    const song = parts[0];
    const difficulty = parts[1];
    if (difficultyFilter && difficulty !== difficultyFilter) continue;

    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      list = [];
    }
    list.forEach((entry) => entries.push({ ...entry, song, difficulty }));
  }
  return entries;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getSongDisplayName(mp3Path) {
  const opt = document.querySelector(
    `#music-select option[value="${CSS.escape(mp3Path)}"]`
  );
  return opt ? opt.textContent.replace(" (belum tersedia)", "") : mp3Path;
}

function renderLeaderboardTableHTML(title, records) {
  let html = `<h2>${escapeHtml(title)}</h2>`;
  if (records.length === 0) {
    html += "<p>Belum ada skor tercatat untuk kombinasi ini.</p>";
    return html;
  }
  html +=
    "<table><thead><tr><th>Rank</th><th>Nama</th><th>Skor</th><th>Lagu</th><th>Kesulitan</th></tr></thead><tbody>";
  records.forEach((r, i) => {
    html += `<tr><td>#${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.score}</td><td>${escapeHtml(
      getSongDisplayName(r.song)
    )}</td><td>${escapeHtml(r.difficulty)}</td></tr>`;
  });
  html += "</tbody></table>";
  return html;
}

function populateLeaderboardSongSelect() {
  const target = document.getElementById("leaderboard-song-select");
  const currentValue = target.value;
  target.innerHTML = '<option value="">- Semua Lagu -</option>';
  document.querySelectorAll("#music-select option").forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.textContent.replace(" (belum tersedia)", "");
    target.appendChild(o);
  });
  target.value = currentValue || "";
}

function renderLeaderboardPage() {
  const songFilter = document.getElementById("leaderboard-song-select").value;
  const difficultyFilter = document.getElementById("leaderboard-difficulty-select").value;
  const container = document.getElementById("leaderboard-container");

  let entries = getAllLeaderboardEntries(difficultyFilter || null);
  if (songFilter) entries = entries.filter((e) => e.song === songFilter);
  entries.sort((a, b) => b.score - a.score);

  let title;
  if (!songFilter) {
    title = "Top 5 Pemain Terbaik Sepanjang Masa";
    entries = entries.slice(0, 5);
  } else {
    title = `Leaderboard: ${getSongDisplayName(songFilter)}`;
    entries = entries.slice(0, 10);
  }
  if (difficultyFilter) title += ` - ${difficultyFilter}`;

  container.innerHTML = renderLeaderboardTableHTML(title, entries);
}
