// DEBUG: ver si supabase ya existe
console.log("supabase ya existe?", typeof supabase);
console.log("window.supabase ya existe?", typeof window.supabase);
//

const SUPABASE_URL = "https://nlvxhrrdffpajtffqksk.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdnhocnJkZmZwYWp0ZmZxa3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjcyNTEsImV4cCI6MjA5NjEwMzI1MX0.yngXa3me5TCuKgSqksy5ueqG-piV-hJGzn6AZbpIB30";
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------------------------------------------------
// IMAGENES Y RECURSOS
// ------------------------------------------------------------
const DORSO = "img/DORSO.png";

const PLAYERS = [
  { id: "tagli", name: "Tagliafico", img: "img/TAGLIAFICO-FRENTE.png" },
  { id: "dibu", name: "Dibu", img: "img/DIBU-FRENTE.png" },
  { id: "rulli", name: "Rulli", img: "img/RULLI-FRENTE.png" },
  { id: "musso", name: "Musso", img: "img/JUAN-MUSSO-FRENTE.png" },
  { id: "molina", name: "Molina", img: "img/MOLINA-FRENTE.png" },
  { id: "montiel", name: "Montiel", img: "img/MONTIEL-FRENTE.png" },
  { id: "cuti", name: "Cuti", img: "img/CUTI-FRENTE.png" },
  { id: "otamendi", name: "Otamendi", img: "img/OTAMENDI-FRENTE.png" },
  {
    id: "lisandro",
    name: "L. Martínez",
    img: "img/LISANDRO-MARTINEZ-FRENTE.png",
  },
  { id: "balerdi", name: "Balerdi", img: "img/BALERDI-FRENTE.png" },
  {
    id: "medina",
    name: "Facundo Medina",
    img: "img/FACUNDO-MEDINA-FRENTE.png",
  },
  { id: "depaul", name: "De Paul", img: "img/DE-PAUL-FRENTE.png" },
  { id: "enzo", name: "Enzo Fernández", img: "img/ENZO-FERNANDEZ-FRENTE.png" },
  {
    id: "macallister",
    name: "Mac Allister",
    img: "img/Alexis-MacAllister-FRENTE.png",
  },
  { id: "locelso", name: "Lo Celso", img: "img/LO-CELSO-FRENTE.png" },
  { id: "palacios", name: "Palacios", img: "img/EXEQUIEL-PALACIOS-FRENTE.png" },
  { id: "paredes", name: "Paredes", img: "img/PAREDES-FRENTE.png" },
  { id: "messi", name: "Messi", img: "img/MESSI-FRENTE.png" },
  { id: "lautaro", name: "Lautaro", img: "img/LAUTARO-MARTINEZ-FRENTE.png" },
  {
    id: "julian",
    name: "Julián Álvarez",
    img: "img/JULIAN-ALVAREZ-FRENTE.png",
  },
  {
    id: "nicogonzalez",
    name: "Nicolás González",
    img: "img/NICO-GONZALEZ-FRENTE.png",
  },
  { id: "flaco", name: "Flaco López", img: "img/FLACO-LOPEZ-FRENTE.png" },
  { id: "simeone", name: "Simeone", img: "img/GIULIANO-SIMEONE-FRENTE.png" },
  { id: "nicopaz", name: "Nico Paz", img: "img/NICO-PAZ-FRENTE.png" },
  { id: "almada", name: "Thiago Almada", img: "img/THIAGO-ALMADA-FRENTE.png" },
  { id: "barco", name: "Valentín Barco", img: "img/VALENTIN-BARCO-FRENTE.png" },
];

if (PLAYERS.length !== 26)
  console.warn("Cantidad de jugadores:", PLAYERS.length);

// Variables globales del juego
let cards = [];
let flipped = [];
let matched = 0;
let tries = 0;
let misses = 0;
let timeouts = [];

// ------------------------------------------------------------
// SONIDOS
// ------------------------------------------------------------
let audioStarted = false;

async function startAudio() {
  if (!audioStarted) {
    await Tone.start();
    audioStarted = true;
  }
}

// Vibráfono sintético compartido
let _piano = null;

async function getPiano() {
  await startAudio();
  if (!_piano) {
    const vibrato = new Tone.Vibrato({
      frequency: 4,
      depth: 0.1,
    }).toDestination();
    _piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 0.6 },
      volume: -31,
    }).connect(vibrato);
  }
  return _piano;
}

// Dar vuelta carta: primera carta = C5, segunda carta = B4
function playFlip(note) {
  getPiano().then((piano) => {
    piano.triggerAttackRelease(note, "16n");
  });
}

// Pareja encontrada: alterna entre terminar en C5 y D5
function playMatch() {
  const lastNote = matched % 2 === 0 ? "C5" : "D5";
  getPiano().then((piano) => {
    [
      { note: "C5", delay: 0 },
      { note: "B4", delay: 220 },
      { note: "C5", delay: 440 },
      { note: "B4", delay: 660 },
      { note: lastNote, delay: 980 },
    ].forEach(({ note, delay }) =>
      setTimeout(() => piano.triggerAttackRelease(note, "32n"), delay),
    );
  });
}

// No coinciden: ciclo Am Am Dm Dm Am E (se repite)
function playMismatch() {
  const chords = [
    ["A3", "C4", "E4"], // Am grave
    ["A3", "C4", "E4"], // Am grave
    ["D4", "F4", "A4"], // Dm octava 4
    ["D4", "F4", "A4"], // Dm octava 4
    ["B3", "D3", "F3", "A4"], // B semidisminuido
    ["E3", "G#3", "B3", "D4"], // E mayor
    ["A3", "C4", "E4", "A4"], // Am
  ];
  const chord = chords[misses % chords.length];
  misses++;
  getPiano().then((piano) => {
    chord.forEach((note, i) =>
      setTimeout(() => piano.triggerAttackRelease(note, "32n"), i * 30),
    );
  });
}

// Ganar partida: E F E D C B A
function playWin() {
  getPiano().then((piano) => {
    [
      { note: "E4", delay: 0 },
      { note: "F4", delay: 160 },
      { note: "E4", delay: 320 },
      { note: "D4", delay: 480 },
      { note: "C4", delay: 680 },
      { note: "B3", delay: 900 },
      { note: "A3", delay: 1140 },
    ].forEach(({ note, delay }) =>
      setTimeout(() => piano.triggerAttackRelease(note, "32n"), delay),
    );
  });
}

function clearTimeouts() {
  for (let id of timeouts) clearTimeout(id);
  timeouts = [];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

window.initGame = function () {
  clearTimeouts();
  locked = false;
  misses = 0;
  matched = 0;
  tries = 0;
  flipped = [];

  document.getElementById("tries").textContent = "0";
  document.getElementById("pairs").textContent = "0";

  // Ocultar modales
  document.getElementById("win-overlay").style.display = "none";
  document.getElementById("ranking-overlay").style.display = "none";

  const selectedPlayers = shuffleArray([...PLAYERS]).slice(0, 9);
  const deckRaw = [...selectedPlayers, ...selectedPlayers];
  cards = shuffleArray(deckRaw.map((player, idx) => ({ ...player, uid: idx })));

  const gridContainer = document.getElementById("grid");
  if (!gridContainer) return;
  gridContainer.innerHTML = "";

  cards.forEach((card, positionIdx) => {
    const slotDiv = document.createElement("div");
    slotDiv.className = "card-slot";

    const wrapDiv = document.createElement("div");
    const rot = (Math.random() * 10 - 5).toFixed(2);
    wrapDiv.className = "card-wrap";
    wrapDiv.style.setProperty("--rot", rot + "deg");
    wrapDiv.setAttribute("data-idx", positionIdx);
    wrapDiv.innerHTML = `
      <div class="card-inner">
        <div class="face face-back"><img src="${DORSO}" alt="dorso" loading="lazy"></div>
        <div class="face face-front"><img src="${card.img}" alt="${card.name}" loading="lazy"></div>
      </div>
    `;

    wrapDiv.addEventListener("click", (e) => {
      e.stopPropagation();
      onCardClick(wrapDiv, positionIdx);
    });

    wrapDiv.addEventListener("mouseenter", () => {
      if (!wrapDiv.classList.contains("matched"))
        wrapDiv.classList.add("hovered");
    });
    wrapDiv.addEventListener("mouseleave", () => {
      wrapDiv.classList.remove("hovered");
    });

    slotDiv.appendChild(wrapDiv);
    gridContainer.appendChild(slotDiv);
  });

  animateShuffle(gridContainer);
};

function animateShuffle(container) {
  locked = true;
  const rounds = 3;
  let round = 0;

  function doRound() {
    if (round >= rounds) {
      setTimeout(() => {
        locked = false;
      }, 100);
      return;
    }

    const wraps = Array.from(container.querySelectorAll(".card-wrap"));
    const slots = wraps.map((w) => w.parentNode);
    const total = wraps.length;
    const rects = wraps.map((w) => w.getBoundingClientRect());
    const order = shuffleArray([...Array(total).keys()]);

    wraps.forEach((wrap, i) => {
      const dest = rects[order[i]];
      const src = rects[i];
      const dx = dest.left - src.left;
      const dy = dest.top - src.top;
      wrap.style.transition = "none";
      wrap.style.transform = `rotate(var(--rot,0deg))`;
      wrap.style.zIndex = "20";
      wrap.getBoundingClientRect();
      wrap.style.transition = "transform 0.35s cubic-bezier(0.4,0,0.2,1)";
      wrap.style.transform = `translate(${dx}px,${dy}px) rotate(var(--rot,0deg))`;
    });

    setTimeout(() => {
      wraps.forEach((wrap) => {
        wrap.style.transition = "none";
        wrap.style.transform = `rotate(var(--rot,0deg))`;
        wrap.style.zIndex = "";
      });
      const wrapsCopy = [...wraps];
      order.forEach((destIdx, srcIdx) => {
        slots[destIdx].appendChild(wrapsCopy[srcIdx]);
      });
      round++;
      setTimeout(doRound, 80);
    }, 370);
  }

  doRound();
}

function handleMatch(aWrap, bWrap, aIdx, bIdx) {
  const timeoutId = setTimeout(() => {
    aWrap.classList.add("matched");
    bWrap.classList.add("matched");
    playMatch();

    matched++;
    document.getElementById("pairs").textContent = matched;
    flipped = [];
    locked = false;

    const playerName = cards[aIdx].name;
    const footer = document.getElementById("match-footer");
    footer.innerHTML = "";

    if (window._matchTyped) {
      window._matchTyped.destroy();
    }

    window._matchTyped = new Typed(footer, {
      strings: [`Encontraste a ${playerName} :)`],
      typeSpeed: 38,
      showCursor: false,
      onComplete: () => {
        setTimeout(() => {
          footer.style.transition = "opacity 0.6s";
          footer.style.opacity = "0";
          setTimeout(() => {
            footer.style.opacity = "";
            footer.style.transition = "";
            footer.innerHTML = "";
          }, 650);
        }, 2200);
      },
    });

    if (matched === 9) {
      setTimeout(showWinModal, 500);
    }
  }, 300);

  timeouts.push(timeoutId);
}

function handleMismatch(aWrap, bWrap) {
  const timeoutId = setTimeout(() => {
    if (aWrap && aWrap.classList) aWrap.classList.remove("flipped");
    if (bWrap && bWrap.classList) bWrap.classList.remove("flipped");
    playMismatch();
    flipped = [];
    locked = false;
  }, 850);
  timeouts.push(timeoutId);
}

function onCardClick(wrapElement, idx) {
  if (locked) return;
  if (!wrapElement || !wrapElement.parentNode) return;
  if (wrapElement.classList.contains("flipped")) return;
  if (wrapElement.classList.contains("match-anim")) return;
  if (flipped.length >= 2) return;

  wrapElement.classList.add("flipped");
  playFlip(flipped.length === 0 ? "C5" : "B4");
  flipped.push({ wrap: wrapElement, idx: idx });

  if (flipped.length === 2) {
    locked = true;
    tries++;
    document.getElementById("tries").textContent = tries;

    const cardA = cards[flipped[0].idx];
    const cardB = cards[flipped[1].idx];
    const wrapA = flipped[0].wrap;
    const wrapB = flipped[1].wrap;

    if (cardA.id === cardB.id) {
      handleMatch(wrapA, wrapB, flipped[0].idx, flipped[1].idx);
    } else {
      handleMismatch(wrapA, wrapB);
    }
  }
}

// ------------------------------------------------------------
// SCORE / RANKING
// ------------------------------------------------------------

function showWinModal() {
  playWin();
  document.getElementById("win-score-text").textContent =
    `Lo lograste en ${tries} intento${tries !== 1 ? "s" : ""}. ¡Guardá tu puntaje!`;
  document.getElementById("player-name").value = "";
  document.getElementById("save-feedback").textContent = "";
  document.getElementById("win-overlay").style.display = "flex";
  setTimeout(() => document.getElementById("player-name").focus(), 100);
}

window.closeWinModal = function () {
  document.getElementById("win-overlay").style.display = "none";
  // Mostrar todas las cartas dadas vuelta y grises
  const wraps = document.querySelectorAll(".card-wrap");
  wraps.forEach((w) => {
    w.classList.add("flipped");
    w.classList.add("matched");
  });
};

window.saveScore = async function () {
  const nombre = document.getElementById("player-name").value.trim();
  if (!nombre) {
    document.getElementById("save-feedback").textContent =
      "Escribí tu nombre primero.";
    return;
  }

  // Validación anti-trampa: mínimo teórico = 9 pares, máximo razonable = 999
  const MIN_TRIES = 9; // imposible ganar en menos de 9 intentos (9 pares)
  const MAX_TRIES = 999;
  if (tries < MIN_TRIES || tries > MAX_TRIES || !Number.isInteger(tries)) {
    document.getElementById("save-feedback").textContent = "Puntaje inválido.";
    return;
  }

  // Verificar que realmente se ganó la partida (9 parejas encontradas)
  if (matched !== 9) {
    document.getElementById("save-feedback").textContent = "Puntaje inválido.";
    return;
  }

  const btn = document.getElementById("btn-save-score");
  btn.disabled = true;
  document.getElementById("save-feedback").textContent = "Guardando...";

  const { error } = await sbClient
    .from("scores")
    .insert([{ nombre, intentos: tries }]);

  if (error) {
    document.getElementById("save-feedback").textContent =
      "Error al guardar. Intentá de nuevo.";
    btn.disabled = false;
    console.error(error);
  } else {
    document.getElementById("save-feedback").textContent =
      "✅ ¡Puntaje guardado!";
    setTimeout(() => {
      document.getElementById("win-overlay").style.display = "none";
      showRanking();
    }, 1200);
  }
};

window.showRanking = async function () {
  document.getElementById("ranking-overlay").style.display = "flex";
  document.getElementById("ranking-list").innerHTML = "Cargando...";

  const { data, error } = await sbClient
    .from("scores")
    .select("nombre, intentos, created_at")
    .order("intentos", { ascending: true })
    .limit(15);

  if (error || !data) {
    document.getElementById("ranking-list").innerHTML =
      "No se pudo cargar el ranking.";
    return;
  }

  if (data.length === 0) {
    document.getElementById("ranking-list").innerHTML =
      "<p style='color: #fefdfe;'>Aún no hay puntajes. ¡Sé el primero!</p>";
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const rows = data
    .map((row, i) => {
      const medal = medals[i] || `${i + 1}.`;
      const fecha = new Date(row.created_at).toLocaleDateString("es-AR");
      return `<div class="rank-row">
      <span class="rank-pos">${medal}</span>
      <span class="rank-name">${escapeHtml(row.nombre)}</span>
      <span class="rank-score">${row.intentos} intentos</span>
      <span class="rank-date">${fecha}</span>
    </div>`;
    })
    .join("");

  document.getElementById("ranking-list").innerHTML = rows;
};

window.closeRanking = function () {
  document.getElementById("ranking-overlay").style.display = "none";
};

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  initGame();
});

document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      const img = e.target;
      if (img.src && !img.src.includes("DORSO")) {
        img.style.objectFit = "contain";
        img.style.background = "#2c3e44";
      }
    }
  },
  true,
);
