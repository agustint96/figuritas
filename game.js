// ------------------------------------------------------------
// SUPABASE CONFIG
// ------------------------------------------------------------
const SUPABASE_URL = "https://nlvxhrrdffpajtffqksk.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdnhocnJkZmZwYWp0ZmZxa3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjcyNTEsImV4cCI6MjA5NjEwMzI1MX0.yngXa3me5TCuKgSqksy5ueqG-piV-hJGzn6AZbpIB30";
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  { id: "medina", name: "F. Medina", img: "img/FACUNDO-MEDINA-FRENTE.png" },
  { id: "depaul", name: "De Paul", img: "img/DE-PAUL-FRENTE.png" },
  { id: "enzo", name: "Enzo", img: "img/ENZO-FERNANDEZ-FRENTE.png" },
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
  { id: "julian", name: "J. Álvarez", img: "img/JULIAN-ALVAREZ-FRENTE.png" },
  {
    id: "nicogonzalez",
    name: "N. González",
    img: "img/NICO-GONZALEZ-FRENTE.png",
  },
  { id: "flaco", name: "Flaco López", img: "img/FLACO-LOPEZ-FRENTE.png" },
  { id: "simeone", name: "Simeone", img: "img/GIULIANO-SIMEONE-FRENTE.png" },
  { id: "nicopaz", name: "Nico Paz", img: "img/NICO-PAZ-FRENTE.png" },
  { id: "almada", name: "Almada", img: "img/THIAGO-ALMADA-FRENTE.png" },
  { id: "barco", name: "Barco", img: "img/VALENTIN-BARCO-FRENTE.png" },
];

if (PLAYERS.length !== 26)
  console.warn("Cantidad de jugadores:", PLAYERS.length);

// Variables globales del juego
let cards = [];
let flipped = [];
let matched = 0;
let tries = 0;
let locked = false;
let timeouts = [];

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

    matched++;
    document.getElementById("pairs").textContent = matched;
    flipped = [];
    locked = false;

    if (matched === 9) {
      showWinModal();
    }
  }, 300);

  timeouts.push(timeoutId);
}

function handleMismatch(aWrap, bWrap) {
  const timeoutId = setTimeout(() => {
    if (aWrap && aWrap.classList) aWrap.classList.remove("flipped");
    if (bWrap && bWrap.classList) bWrap.classList.remove("flipped");
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
  document.getElementById("win-score-text").textContent =
    `Lo lograste en ${tries} intento${tries !== 1 ? "s" : ""}. ¡Guardá tu puntaje!`;
  document.getElementById("player-name").value = "";
  document.getElementById("save-feedback").textContent = "";
  document.getElementById("win-overlay").style.display = "flex";
  setTimeout(() => document.getElementById("player-name").focus(), 100);
}

window.closeWinModal = function () {
  document.getElementById("win-overlay").style.display = "none";
  initGame();
};

window.saveScore = async function () {
  const nombre = document.getElementById("player-name").value.trim();
  if (!nombre) {
    document.getElementById("save-feedback").textContent =
      "Escribí tu nombre primero.";
    return;
  }

  const btn = document.getElementById("btn-save-score");
  btn.disabled = true;
  document.getElementById("save-feedback").textContent = "Guardando...";

  const { error } = await supabase
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

  const { data, error } = await supabase
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
      "<p>Aún no hay puntajes. ¡Sé el primero!</p>";
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
