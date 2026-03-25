const LOG_URL = "./travel-log.md";

const listEl = document.getElementById("list");
const qEl = document.getElementById("q");
const metaEl = document.getElementById("meta");
const printBtn = document.getElementById("printBtn");
const rawWrap = document.getElementById("rawWrap");
const rawEl = document.getElementById("raw");

printBtn?.addEventListener("click", () => window.print());

function escapeHtml(s=""){
  return s.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function parseEntries(md){
  // Split by "## " headings
  const parts = md.split(/\n(?=##\s)/g).filter(p => p.trim().startsWith("## "));
  const entries = parts.map(block => {
    const lines = block.trim().split("\n");
    const header = lines.shift().replace(/^##\s*/, "").trim(); // "YYYY-MM-DD — Ort"
    const [datePart, ...rest] = header.split("—");
    const date = (datePart || "").trim();
    const ort = (rest.join("—") || "").trim();

    const fields = {};
    for (const line of lines){
      const m = line.match(/^([A-Za-zÄÖÜäöüß]+)\s*:\s*(.*)$/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      fields[key] = (m[2] || "").trim();
    }

    // Normalize expected keys
    return {
      date,
      ort,
      wetter: fields["wetter"] || "",
      stimmung: fields["stimmung"] || "",
      kaffee: fields["kaffee"] || "",
      kulinarik: fields["kulinarik"] || "",
      highlight: fields["highlight"] || "",
      lowlight: fields["lowlight"] || "",
      km,
      hm,
      kommentar
      _text: block.toLowerCase()
    };
  });

  // Newest first (assuming ISO date)
  entries.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  return entries;
}

function render(entries){
  listEl.innerHTML = "";

  if (!entries.length){
    listEl.innerHTML = `<div class="panel muted">Keine Einträge gefunden.</div>`;
    return;
  }

  for (const e of entries){
    const badges = [];
    if (e.wetter) badges.push(`Wetter: ${escapeHtml(e.wetter)}`);
    if (e.stimmung) badges.push(`Stimmung: ${escapeHtml(e.stimmung)}`);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="cardHeader">
        <h3 class="h2">${escapeHtml(e.ort || "Ort fehlt")}</h3>
        <div class="date">${escapeHtml(e.date)}</div>
      </div>

      <div class="badges">
        ${badges.map(b => `<span class="badge">${b}</span>`).join("")}
      </div>

      <div class="grid">
        <div class="field"><div class="label">Wetter</div><div class="value">${escapeHtml(e.wetter || "—")}</div></div>
        <div class="field"><div class="label">Stimmung</div><div class="value">${escapeHtml(e.stimmung || "—")}</div></div>
        <div class="field"><div class="label">Kaffee</div><div class="value">${escapeHtml(e.kaffee || "—")}</div></div>
        <div class="field"><div class="label">Kulinarik</div><div class="value">${escapeHtml(e.kulinarik || "—")}</div></div>
        <div class="field"><div class="label">Highlight</div><div class="value">${escapeHtml(e.highlight || "—")}</div></div>
        <div class="field"><div class="label">Lowlight</div><div class="value">${escapeHtml(e.lowlight || "—")}</div></div>
        <div class="field"><div class="label">Lowlight</div><div class="value">${escapeHtml(e.km || "—")}</div></div>
        <div class="field"><div class="label">Lowlight</div><div class="value">${escapeHtml(e.hm || "—")}</div></div>
        <div class="field"><div class="label">Lowlight</div><div class="value">${escapeHtml(e.kommentar || "—")}</div></div>
      </div>
    `;
    listEl.appendChild(card);
  }
}

async function load(){
  const res = await fetch(LOG_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Konnte Log nicht laden (${res.status})`);
  const md = await res.text();

  // Optional raw
  rawWrap.hidden = false;
  rawEl.textContent = md;

  const entries = parseEntries(md);

  // Meta info
  const total = entries.length;
  const newest = entries[0]?.date ? `Neuester Eintrag: ${entries[0].date}` : "—";
  metaEl.textContent = `${total} Einträge · ${newest}`;

  // Search
  const applyFilter = () => {
    const q = (qEl.value || "").trim().toLowerCase();
    if (!q) return render(entries);
    render(entries.filter(e => e._text.includes(q)));
  };
  qEl.addEventListener("input", applyFilter);

  render(entries);
}

load().catch(err => {
  console.error(err);
  metaEl.textContent = "Fehler beim Laden";
  listEl.innerHTML = `<div class="panel muted">
    Konnte <code>${escapeHtml(LOG_URL)}</code> nicht laden.<br/>
    Prüfe, ob die Datei existiert und GitHub Pages sie ausliefert.
  </div>`;
});
