const KEYBOARD = "qwertyuiop asdfghjkl zxcvbnm";

const keyboard = document.querySelector("#keyboard");
const help = document.querySelector("#help");
const scoreEl = document.querySelector("#score");
const streakEl = document.querySelector("#streak");
const summary = document.querySelector("#summary");
const mute = document.querySelector("#mute");
const diffLvlEasy = document.querySelector("#difficultyLevel__easy");
const diffLvlMedium = document.querySelector("#difficultyLevel__medium");
const diffLvlHard = document.querySelector("#difficultyLevel__hard");
const diffIndicator = document.querySelector("#difficultyIndicator");
const diffLvlEl = document.querySelector("#difficultyLevel");

const controls = document.createElement("div");
controls.classList.add("controls");
controls.innerHTML = "<p>Press <span class='controlsKey'>space</span> to stop.</p>";

let totalActives = 0;
let score = 0;
let prevScore = 0;
let streak = 0;
let bestStreak = 0;
let trials = 0;
let missed = 0;
let hitted = 0;
let highscore = window.localStorage.getItem("highscore") || 0;
let highestBestStreak = window.localStorage.getItem("beststreak") || 0;
let startTimer;
let endTimer;
let isMute = window.localStorage.getItem("isMute") == "true" || false;
if (isMute) mute.classList.add("muted");
else mute.classList.remove("muted");
let difficultyLevel = window.localStorage.getItem("difficulty") || "medium";
diffIndicator.className = `difficultyIndicator difficultyIndicator--${difficultyLevel}`;

function changeDifficulty(level) {
  difficultyLevel = level;
  window.localStorage.setItem("difficulty", level);
  diffIndicator.className = `difficultyIndicator difficultyIndicator--${level}`;
}
diffLvlEasy.addEventListener("click", () => changeDifficulty("easy"));
diffLvlMedium.addEventListener("click", () => changeDifficulty("medium"));
diffLvlHard.addEventListener("click", () => changeDifficulty("hard"));

function handleToggleMute() {
  isMute = !isMute;
  window.localStorage.setItem("isMute", isMute);
  if (isMute) mute.classList.add("muted");
  else mute.classList.remove("muted");
}
mute.addEventListener("click", handleToggleMute);

function playSound() {
  if (!isMute) {
    const audio = new Audio(`sounds/sound${Math.floor(Math.random() * 5) + 1}.mp3`);
    audio.play();
  }
}

function msToTime(duration) {
  var seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return `${hours > 0 ? `${hours}:` : ""}${minutes}:${seconds}`;
}

function updateScore() {
  if (prevScore < score) {
    scoreEl.classList.add("good--text");
  } else if (prevScore > score) {
    scoreEl.classList.add("bad--text");
  }

  scoreEl.textContent = score;
  streakEl.textContent = streak;

  prevScore = score;

  setTimeout(() => {
    scoreEl.classList.remove("good--text");
    scoreEl.classList.remove("bad--text");
  }, 100);

  if (score > highscore) {
    highscore = score;
    window.localStorage.setItem("highscore", highscore);
  }

  if (bestStreak > highestBestStreak) {
    highestBestStreak = bestStreak;
    window.localStorage.setItem("beststreak", highestBestStreak);
  }
}

function start() {
  startTimer = new Date().getTime();
  const keys = document.querySelectorAll(".key");

  let interval;
  if (difficultyLevel === "easy") interval = 1000;
  else if (difficultyLevel === "medium") interval = 500;
  else if (difficultyLevel === "hard") interval = 250;

  let tick = 0;

  const game = setInterval(() => {
    if (totalActives >= 5) {
      tick++;

      if (difficultyLevel === "easy") {
        score--;
      } else if (difficultyLevel === "medium") {
        if (tick === 2) {
          score--;
          tick = 0;
        }
      } else if (difficultyLevel === "hard") {
        if (tick === 3) {
          score--;
          tick = 0;
        }
      }

      updateScore();
      return;
    }

    let rng = Math.floor(Math.random() * keys.length);

    let i = 0;
    while (keys[rng].classList.contains("active")) {
      rng = Math.floor(Math.random() * keys.length);
      i++;
      if (i >= keys.length) break;
    }

    keys[rng].classList.add("active");
    totalActives++;
  }, interval);

  const handleKeyPress = (e) => {
    if (KEYBOARD.replace(" ", "").replace(" ", "").includes(e.key)) {
      playSound();
      const target = document.querySelector(`#key_${e.key}`);
      trials++;

      if (target.classList.contains("active")) {
        score++;
        streak++;
        hitted++;
        totalActives--;
        if (bestStreak < streak) bestStreak = streak;
        target.classList.add("good");
      } else {
        score--;
        missed++;
        streak = 0;
        target.classList.add("bad");
        target.classList.add("active");
      }

      setTimeout(() => {
        target.classList.remove("good");
        target.classList.remove("bad");
        target.classList.remove("active");
      }, 100);

      updateScore();
    } else if (e.key === " ") {
      playSound();
      endTimer = new Date().getTime();

      document.removeEventListener("keypress", handleKeyPress);
      clearInterval(game);

      let accuracy = (hitted / trials) * 100;
      if (trials <= 0) accuracy = 0;
      accuracy = accuracy.toFixed(2);

      const timeDiff = endTimer - startTimer;

      summary.innerHTML = `
<div>
    <p><span>Score:</span><span>${score}</span></p>
    <p><span>Best streak:</span><span>${bestStreak}</span></p>
    <p><span>Accuracy:</span><span>${accuracy}%</span></p>
    <p><span>Time:</span><span>${msToTime(timeDiff)}</span></p>
</div>
<div>
    <p><span>Score:</span><span>${highscore}${score === highscore ? " - NEW BEST!" : ""}</span></p>
    <p><span>Best streak:</span><span>${highestBestStreak}${bestStreak === highestBestStreak ? " - NEW BEST!" : ""}</span></p>
</div>

      `;
      summary.classList.remove("hidden");
    }
  };

  document.addEventListener("keypress", handleKeyPress);
}

function fadeOut(el) {
  el.classList.add("fadeOut");
}

function displayHelp() {
  help.innerHTML = "Press <span class='controlsKey--big'>F</span> and <span class='controlsKey--big'>J</span> to start";
  const fKey = document.querySelector("#key_f");
  const jKey = document.querySelector("#key_j");
  fKey.classList.add("active");
  jKey.classList.add("active");

  let isFKey = true;
  let isJKey = true;

  const handlePress = (e) => {
    // if (multiplayerCodeInput === document.activeElement) {
    //   return;
    // }

    if (e.key === "f" && isFKey) {
      playSound();
      fKey.classList.add("good");
      isFKey = false;

      setTimeout(() => {
        fKey.classList.remove("good");
        fKey.classList.remove("active");
      }, 100);
    } else if (e.key === "j" && isJKey) {
      playSound();
      jKey.classList.add("good");
      isJKey = false;

      setTimeout(() => {
        jKey.classList.remove("good");
        jKey.classList.remove("active");
      }, 100);
    } else if (e.key === "1" && difficultyLevel !== "easy") {
      playSound();
      changeDifficulty("easy");
    } else if (e.key === "2" && difficultyLevel !== "medium") {
      playSound();
      changeDifficulty("medium");
    } else if (e.key === "3" && difficultyLevel !== "hard") {
      playSound();
      changeDifficulty("hard");
    } else if (e.key === "m") {
      playSound();
      handleToggleMute();
    }

    if (!isFKey && isJKey) {
      help.innerHTML = "Press <span class='controlsKey--big'>J</span> to start";
    } else if (isFKey && !isJKey) {
      help.innerHTML = "Press <span class='controlsKey--big'>F</span> to start";
    }

    if (!isFKey && !isJKey) {
      document.removeEventListener("keypress", handlePress);
      document.body.appendChild(controls);
      document.querySelector(".score").classList.remove("hidden");
      // multiplayerInvite.classList.add("fadeOut");

      if (difficultyLevel !== "easy") fadeOut(diffLvlEasy.parentElement);
      if (difficultyLevel !== "medium") fadeOut(diffLvlMedium.parentElement);
      if (difficultyLevel !== "hard") fadeOut(diffLvlHard.parentElement);
      document.querySelector(`#difficultyLevel__${difficultyLevel}`).style.cursor = "default";
      document.querySelector(`#difficultyLevel__${difficultyLevel}`).style.borderRadius = "8px";
      document.querySelector(`#difficultyLevel__${difficultyLevel}`).parentElement.children[1].classList.add("fadeOut");
      diffLvlEl.style.backgroundColor = "transparent";
      diffIndicator.style.backgroundColor = "transparent";
      if (difficultyLevel === "easy") {
        diffLvlEasy.parentElement.style.transform = "translateX(89px)";
      } else if (difficultyLevel === "hard") {
        diffLvlHard.parentElement.style.transform = "translateX(-89px)";
      }
      diffIndicator.style.transform = "translateX(89px)";

      help.textContent = "3";

      setTimeout(() => {
        help.textContent = "2";

        setTimeout(() => {
          help.textContent = "1";

          setTimeout(() => {
            help.textContent = "GO!";

            setTimeout(() => {
              help.textContent = "";
              start();
            }, 500);
          }, 1000);
        }, 1000);
      }, 1000);
    }
  };

  document.addEventListener("keypress", handlePress);
}

function init() {
  KEYBOARD.split(" ").forEach((row) => {
    const el = document.createElement("div");
    el.classList.add("row");

    row.split("").forEach((letter) => {
      const key = document.createElement("span");
      key.classList.add("key");
      key.setAttribute("id", `key_${letter}`);
      key.textContent = letter;

      el.appendChild(key);
    });

    keyboard.appendChild(el);
  });

  displayHelp();
}
init();
