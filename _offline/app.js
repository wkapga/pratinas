// ====== 1) "Leichtes" Passwort-Gate ======
// Setze hier euer gemeinsames Codewort.
// Tipp: lieber ein Satz + Zahl (leicht zu merken): "Gyros-2026!"
const PASSWORD = "Franzbranntwein";

// Optional: bruteforce bremsen (nur UX)
const MIN_DELAY_MS = 600;

const app = document.getElementById("app");
const lockscreen = document.getElementById("lockscreen");
const pw = document.getElementById("pw");
const unlockBtn = document.getElementById("unlock");
const lockBtn = document.getElementById("lockBtn");
const hint = document.getElementById("lockHint");
const syncState = document.getElementById("syncState");

function setUnlocked(isUnlocked) {
  localStorage.setItem("offline_unlocked", isUnlocked ? "1" : "0");
  lockscreen.style.display = isUnlocked ? "none" : "flex";
  app.hidden = !isUnlocked;
  lockBtn.textContent = isUnlocked ? "🔓" : "🔒";
}

function isUnlocked() {
  return localStorage.getItem("offline_unlocked") === "1";
}

async function tryUnlock() {
  const entered = (pw.value || "").trim();
  hint.textContent = "";
  await new Promise(r => setTimeout(r, MIN_DELAY_MS));

  if (entered === PASSWORD) {
    pw.value = "";
    setUnlocked(true);
  } else {
    hint.textContent = "Falsch. Tipp: Achtung Groß/Kleinschreibung.";
    pw.select();
    pw.focus();
  }
}

unlockBtn.addEventListener("click", tryUnlock);
pw.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryUnlock();
});

lockBtn.addEventListener("click", () => {
  setUnlocked(!isUnlocked());
});

// Beim Start: standardmäßig gesperrt
setUnlocked(isUnlocked());


// ====== 2) Service Worker registrieren (Offline-Cache) ======
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/_offline/sw.js");
      syncState.textContent = navigator.onLine ? "Status: online (Cache aktiv)" : "Status: offline";
      // Optional: sofort nach Update suchen
      reg.update().catch(() => {});
    } catch (e) {
      syncState.textContent = "Status: SW nicht aktiv";
    }
  });
} else {
  syncState.textContent = "Status: Offline-Modus nicht unterstützt";
}

// Online/Offline Anzeige
window.addEventListener("online", () => (syncState.textContent = "Status: online (Cache aktiv)"));
window.addEventListener("offline", () => (syncState.textContent = "Status: offline"));
