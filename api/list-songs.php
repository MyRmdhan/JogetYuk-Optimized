<?php
/**
 * api/list-songs.php
 *
 * Scan folder assets/audio/songs/ secara real-time tiap kali dipanggil, cari
 * semua file .mp3, dan kembalikan daftarnya sebagai JSON. Ini yang bikin
 * dropdown lagu di frontend "otomatis" - taruh file mp3 baru di folder itu,
 * refresh browser, langsung muncul, tanpa perlu edit index.html atau kode apapun.
 *
 * Musik menu (backsounds.mp3) & sfx sekarang hidup di folder terpisah
 * (assets/audio/backsounds.mp3, assets/audio/sfx/), jadi tidak perlu lagi
 * exclusion list manual seperti sebelumnya - pemisahan foldernya sendiri
 * yang menjamin cuma lagu asli yang ke-scan di sini.
 */

header("Content-Type: application/json; charset=utf-8");

$songsDir = __DIR__ . "/../assets/audio/songs";

$songs = [];

if (is_dir($songsDir)) {
    $files = scandir($songsDir);

    foreach ($files as $file) {
        if (!is_file($songsDir . "/" . $file)) continue;
        if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== "mp3") continue;

        $nameWithoutExt = pathinfo($file, PATHINFO_FILENAME);

        $songs[] = [
            // "value" harus persis sama format yang dipakai js/beatSync.js
            "value" => "assets/audio/songs/" . $file,
            // "label" buat ditampilkan di dropdown - default-nya nama file apa adanya
            "label" => $nameWithoutExt,
        ];
    }
}

// Urutkan alfabetis biar rapi & konsisten tiap refresh
usort($songs, function ($a, $b) {
    return strcasecmp($a["label"], $b["label"]);
});

echo json_encode([
    "songs" => $songs,
]);
