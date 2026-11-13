// ============================================================
// 🔊 ASSETS.JS — loading semua media (audio & gambar) dan fungsi pemutarannya.
// Path di sini disesuaikan dengan struktur folder baru:
//   assets/audio/backsounds.mp3, assets/audio/sfx/, assets/images/arrows/
// ============================================================

const backsound = new Audio("assets/audio/backsounds.mp3");
backsound.loop = true;
backsound.volume = 0.5;

const soundEffects = {
  button: new Audio("assets/audio/sfx/click-button.mp3"),
  hit: new Audio("assets/audio/sfx/hit1.wav"),
  miss: new Audio("assets/audio/sfx/miss.wav"),
  countdown: new Audio("assets/audio/sfx/countdown.mp3"),
  finish: new Audio("assets/audio/sfx/finish.mp3"),
};

const arrowImages = {
  "⬆️": new Image(),
  "➡️": new Image(),
  "⬅️": new Image(),
};
arrowImages["⬆️"].src = "assets/images/arrows/atas.png";
arrowImages["➡️"].src = "assets/images/arrows/kanan.png";
arrowImages["⬅️"].src = "assets/images/arrows/kiri.png";

function playSoundEffect(sound) {
  const clone = sound.cloneNode();
  clone.play();
}
