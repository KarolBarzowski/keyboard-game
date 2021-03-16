const multiplayerInvite = document.querySelector("#multiplayerInvite");
const multiplayerCodeInput = document.querySelector("#multiplayerCodeInput");
const multiplayerJoinBtn = document.querySelector("#multiplayerJoinBtn");
const multiplayerEl = document.querySelector("#multiplayer");
const multiplayerScoreboard = document.querySelector("#multiplayer__scoreboard");
const multiplayerScreens = document.querySelector("#multiplayer__screens");

const STATUSES = {
  preparing: "preparing",
  waiting: "waiting",
  start: "start",
};

let USER = {};
let code;
let keys;

multiplayerCodeInput.addEventListener("keyup", (e) => {
  if (e.target.value.length > 0) {
    multiplayerJoinBtn.classList.remove("multiplayerJoinBtn--hide");
  } else {
    multiplayerJoinBtn.classList.add("multiplayerJoinBtn--hide");
  }
});

function addPlayer(data) {
  multiplayerScoreboard.innerHTML += `
<div id="multiplayer__score__${data.val()}">
    <p>${data.val()} ${USER.nickname === data.val() ? "(You)" : ""}</p>
    <p>0</p>
</div>`;

  const main = document.createElement("div");
  const kb = document.createElement("div");
  KEYBOARD.split(" ").forEach((row) => {
    const el = document.createElement("div");
    el.classList.add("row");

    row.split("").forEach((letter) => {
      const key = document.createElement("span");
      key.classList.add("key");
      if (data.val() === USER.nickname) {
        key.setAttribute("id", `key_${letter}`);
        key.classList.add("userKey");
      }
      key.textContent = letter;

      el.appendChild(key);
    });

    kb.appendChild(el);
  });

  main.innerHTML += `
  <p class="help--multiplayer" id="help--${data.val()}">Press <span class="controlsKey--big">R</span> if you are ready!</p>
  `;
  main.appendChild(kb);
  multiplayerScreens.appendChild(main);

  const rKey = document.querySelector("#key_r");
  rKey.classList.add("active");

  const handlePress = (e) => {
    if (e.key === "r") {
      document.removeEventListener("keypress", handlePress);

      playSound();
      rKey.classList.add("good");

      setTimeout(() => {
        rKey.classList.remove("good");
        rKey.classList.remove("active");
      }, 100);

      database.ref(`keyboard-game/games/${code}/ready`).update({
        [USER.nickname]: true,
      });
    }
  };

  document.addEventListener("keypress", handlePress);
}

function updateMultiplayerScores(data) {
  const target = document.querySelector(`#multiplayer__score__${data.key}`);

  if (target) target.children[1].textContent = data.val();
}

function removePlayer(data) {
  const targetScore = document.querySelector(`#multiplayer__score__${data.val()}`);

  if (targetScore) targetScore.parentElement.removeChild(targetScore);
}

function checkReady() {
  let isFalse = false;

  const readyRef = database.ref(`keyboard-game/games/${code}/ready`);
  readyRef.once("value").then((snapshot) => {
    snapshot.forEach((snap) => {
      if (!snap.val()) {
        isFalse = true;
      }
    });

    if (!isFalse) {
      database.ref(`keyboard-game/games/${code}`).update({
        status: STATUSES.preparing,
      });
    }
  });
}

function updateReadyState(data) {
  const target = document.querySelector(`#help--${data.key}`);
  if (data.val()) {
    target.textContent = "Ready!";
  }

  checkReady();
}

function updateStatus(data) {
  if (data.val() === STATUSES.preparing) {
    // countdown
    document.querySelector(`#help--${USER.nickname}`).textContent = 3;

    setTimeout(() => {
      document.querySelector(`#help--${USER.nickname}`).textContent = 2;

      setTimeout(() => {
        document.querySelector(`#help--${USER.nickname}`).textContent = 1;

        setTimeout(() => {
          document.querySelector(`#help--${USER.nickname}`).textContent = "GO!";

          database.ref(`keyboard-game/games/${code}`).update({
            status: STATUSES.start,
          });
        }, 1000);
      }, 1000);
    }, 1000);
  } else if (data.val() === STATUSES.start) {
    document.querySelector(".help--multiplayer").parentElement.removeChild(document.querySelector(".help--multiplayer"));
    document.querySelector(".help--multiplayer").parentElement.removeChild(document.querySelector(".help--multiplayer"));

    keys = Array.from(document.querySelectorAll(".userKey"));
  }
}

function activateKey(data) {}

function databaseListeners() {
  database
    .ref(`keyboard-game/games/${code}`)
    .child("players")
    .on("child_added", (data) => {
      addPlayer(data);
    });

  database
    .ref(`keyboard-game/games/${code}`)
    .child("scores")
    .on("child_changed", (data) => {
      updateMultiplayerScores(data);
    });

  database
    .ref(`keyboard-game/games/${code}`)
    .child("players")
    .on("child_removed", (data) => {
      removePlayer(data);
    });

  database
    .ref(`keyboard-game/games/${code}`)
    .child("ready")
    .on("child_changed", (data) => {
      updateReadyState(data);
    });

  database
    .ref(`keyboard-game/games/${code}`)
    .child("status")
    .on("value", (data) => {
      updateStatus(data);
    });

  database
    .ref(`keyboard-game/games/${code}`)
    .child("player1Active")
    .on("value", (data) => {
      activateKey(data);
    });
}

function setDataToLocalStorage() {
  window.localStorage.setItem("gameId", code);
  window.localStorage.setItem("nickname", USER.nickname);
}

function handleJoin(newCode) {
  if (newCode) code = newCode;
  else code = multiplayerCodeInput.value;

  multiplayerJoinBtn.setAttribute("disabled", "true");

  const gameRef = database.ref(`keyboard-game/games/${code}`);
  gameRef.once("value").then((snap) => {
    let exists = true;
    let nickname = NAMES[Math.floor(Math.random() * NAMES.length)];

    if (snap.hasChild("players")) {
      while (exists) {
        Object.keys(snap.val().players).forEach((key) => {
          if (snap.val().players[key] !== nickname) {
            exists = false;
          }
        });
        nickname = NAMES[Math.floor(Math.random() * NAMES.length)];
      }
    }

    USER.nickname = nickname;

    if (snap.exists()) {
      Object.keys(snap.val().players).forEach((key) => {
        if (snap.val().players[key] === window.localStorage.getItem("nickname")) {
          USER.nickname = window.localStorage.getItem("nickname");
          multiplayerEl.classList.remove("hidden");
          multiplayerEl.classList.add("slideInRight");
          keyboard.parentElement.removeChild(keyboard);

          databaseListeners();
          return;
        }
      });

      if (Object.keys(snap.val().players).length < 2) {
        gameRef.child("players").push(nickname);
        gameRef.child("scores").update({
          [nickname]: 0,
        });
        gameRef.child("ready").update({
          [nickname]: false,
        });
        multiplayerEl.classList.remove("hidden");
        multiplayerEl.classList.add("slideInRight");
        keyboard.parentElement.removeChild(keyboard);

        setDataToLocalStorage();
        databaseListeners();
      } else {
        multiplayerJoinBtn.removeAttribute("disabled");
        multiplayerJoinBtn.classList.add("error");
        setTimeout(() => {
          multiplayerJoinBtn.classList.remove("error");
        }, 600);
      }
    } else {
      gameRef.child("players").push(nickname);
      gameRef.child("scores").update({
        [nickname]: 0,
      });
      gameRef.child("ready").update({
        [nickname]: false,
      });
      gameRef.update({
        status: STATUSES.waiting,
      });
      multiplayerEl.classList.remove("hidden");
      multiplayerEl.classList.add("slideInRight");
      keyboard.parentElement.removeChild(keyboard);

      setDataToLocalStorage();
      databaseListeners();
    }
  });
}

multiplayerJoinBtn.addEventListener("click", () => handleJoin());

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("game");
if (gameId) {
  handleJoin(gameId);
}
