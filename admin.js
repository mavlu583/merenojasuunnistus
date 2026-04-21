let KIRJAUTUNUT_ROOLI = null; // "superadmin" tai "ope"
let KIRJAUTUNUT_OPE = null;
let KOKO_LISTA = [];

// superadmin-koodi
const SUPERADMIN_KOODI = "mavlu2012";

async function haeKaikki() {
  const res = await fetch(API_URL);
  return await res.json();
}

async function tallennaLista(uusiLista) {
  await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ komento:"korvaa", data:uusiLista })
  });
}

async function kirjauduAdmin() {
  const code = document.getElementById("adminCode").value.trim();
  if (!code) { alert("Syötä koodi"); return; }

  const lista = await haeKaikki();
  KOKO_LISTA = lista;

  if (code === SUPERADMIN_KOODI) {
    KIRJAUTUNUT_ROOLI = "superadmin";
    KIRJAUTUNUT_OPE = null;
  } else {
    const ope = lista.find(x => x.tyyppi==="ope" && x.koodi===code);
    if (!ope) { alert("Väärä koodi"); return; }
    KIRJAUTUNUT_ROOLI = "ope";
    KIRJAUTUNUT_OPE = ope;
  }

  document.getElementById("loginCard").style.display = "none";
  document.getElementById("panel").style.display = "block";
  paivitaUI();
}

function paivitaUI() {
  const info = document.getElementById("infoBox");
  if (KIRJAUTUNUT_ROOLI === "superadmin") {
    info.innerHTML = "<b>Kirjautunut superadmin</b>";
    document.getElementById("opettajaBox").style.display = "block";
  } else {
    info.innerHTML =
      `<b>Kirjautunut opettaja:</b> ${KIRJAUTUNUT_OPE.nimi} <span class="pill">${KIRJAUTUNUT_OPE.koodi}</span>`;
    document.getElementById("opettajaBox").style.display = "none";
  }
  paivitaKaikkiListat();
}

async function paivitaKaikkiListat() {
  KOKO_LISTA = await haeKaikki();
  naytaRadat();
  naytaOpettajat();
  taytaOppilasOpettajaValinta();
  taytaOppilasRataValinta();
  naytaOppilaat();
  naytaSuoritukset();
}

// RATAT

function naytaRadat() {
  const div = document.getElementById("radat");
  const radat = KOKO_LISTA.filter(x => x.tyyppi==="rata");
  div.innerHTML = "";

  if (!radat.length) { div.textContent = "Ei ratoja."; return; }

  radat.forEach(r => {
    const el = document.createElement("div");
    el.className = "item";

    const main = document.createElement("div");
    main.className = "item-main";

    const rastit = r.rastit?.length ? `${r.rastit.length} rastia` : "Ei rasteja";
    const kartta = r.karttaPdf ? "Kartta-PDF asetettu" : "Ei karttaa";

    main.innerHTML = `
      <b>${r.nimi}</b><br>
      <span class="muted">${rastit} · ${kartta}</span>
    `;

    const btns = document.createElement("div");
    const br = document.createElement("button");
    br.textContent = "Rastit";
    br.onclick = () => muokkaaRasteja(r.nimi);
    const bk = document.createElement("button");
    bk.textContent = "Kartta PDF";
    bk.onclick = () => muokkaaKarttaa(r.nimi);
    btns.appendChild(br);
    btns.appendChild(bk);

    if (KIRJAUTUNUT_ROOLI === "superadmin") {
      const bd = document.createElement("button");
      bd.textContent = "Poista";
      bd.className = "danger";
      bd.onclick = () => poistaRata(r.nimi);
      btns.appendChild(bd);
    }

    el.appendChild(main);
    el.appendChild(btns);
    div.appendChild(el);
  });
}

async function lisaaRata() {
  const nimi = document.getElementById("rataNimi").value.trim();
  if (!nimi) { alert("Anna radan nimi"); return; }
  if (KOKO_LISTA.some(x => x.tyyppi==="rata" && x.nimi===nimi)) {
    alert("Tällä nimellä on jo rata"); return;
  }
  KOKO_LISTA.push({ tyyppi:"rata", nimi, rastit:[], karttaPdf:null });
  await tallennaLista(KOKO_LISTA);
  document.getElementById("rataNimi").value = "";
  paivitaKaikkiListat();
}

async function poistaRata(nimi) {
  if (!confirm("Poistetaanko rata " + nimi + "?")) return;
  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi==="rata" && x.nimi===nimi));
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

async function muokkaaRasteja(rataNimi) {
  const rata = KOKO_LISTA.find(x => x.tyyppi==="rata" && x.nimi===rataNimi);
  if (!rata) return;
  const nykyiset = (rata.rastit || []).join(", ");
  const syote = prompt(
    `Anna rastikoodit pilkulla erotettuna radalle "${rataNimi}"\nEsim: 9, 12, 5`,
    nykyiset
  );
  if (syote === null) return;
  const lista = syote.split(",").map(s => s.trim()).filter(Boolean);
  rata.rastit = lista;
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

async function muokkaaKarttaa(rataNimi) {
  const rata = KOKO_LISTA.find(x => x.tyyppi==="rata" && x.nimi===rataNimi);
  if (!rata) return;
  const syote = prompt(
    `Anna kartta-PDF:n URL radalle "${rataNimi}"\n(esim. https://.../kartta.pdf)`,
    rata.karttaPdf || ""
  );
  if (syote === null) return;
  rata.karttaPdf = syote.trim() || null;
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

// OPETTAJAT

function naytaOpettajat() {
  const div = document.getElementById("opettajat");
  if (!div) return;
  const opettajat = KOKO_LISTA.filter(x => x.tyyppi==="ope");
  div.innerHTML = "";
  if (!opettajat.length) { div.textContent = "Ei opettajia."; return; }

  opettajat.forEach(o => {
    const el = document.createElement("div");
    el.className = "item";
    const main = document.createElement("div");
    main.className = "item-main";
    main.innerHTML = `
      <b>${o.nimi}</b> <span class="pill">${o.koodi}</span><br>
      <span class="muted">${o.naytto==="kaikki" ? "Näkee kaikki oppilaat" : "Näkee vain omat oppilaat"}</span>
    `;
    el.appendChild(main);

    if (KIRJAUTUNUT_ROOLI === "superadmin") {
      const btn = document.createElement("button");
      btn.textContent = "Poista";
      btn.className = "danger";
      btn.onclick = () => poistaOpettaja(o.koodi);
      el.appendChild(btn);
    }

    div.appendChild(el);
  });
}

async function lisaaOpettaja() {
  if (KIRJAUTUNUT_ROOLI !== "superadmin") return;
  const nimi = document.getElementById("opeNimi").value.trim();
  const koodi = document.getElementById("opeKoodi").value.trim();
  const nakyvyys = document.getElementById("opeNakyvyys").value;
  if (!nimi || !koodi) { alert("Täytä nimi ja koodi"); return; }
  if (KOKO_LISTA.some(x => x.tyyppi==="ope" && x.koodi===koodi)) {
    alert("Tällä koodilla on jo opettaja"); return;
  }
  KOKO_LISTA.push({ tyyppi:"ope", nimi, koodi, naytto:nakyvyys });
  await tallennaLista(KOKO_LISTA);
  document.getElementById("opeNimi").value = "";
  document.getElementById("opeKoodi").value = "";
  document.getElementById("opeNakyvyys").value = "omat";
  paivitaKaikkiListat();
}

async function poistaOpettaja(koodi) {
  if (!confirm("Poistetaanko opettaja " + koodi + "?")) return;
  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi==="ope" && x.koodi===koodi));
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

// OPPILAAT

function taytaOppilasOpettajaValinta() {
  const kontti = document.getElementById("oppOpettajat");
  kontti.innerHTML = "";
  const opettajat = KOKO_LISTA.filter(x => x.tyyppi==="ope");
  if (!opettajat.length) {
    kontti.textContent = "Ei opettajia (lisää ensin opettajia).";
    return;
  }
  opettajat.forEach(o => {
    const label = document.createElement("label");
    label.style.fontWeight = "400";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = o.koodi;
    cb.style.marginRight = "6px";
    if (KIRJAUTUNUT_ROOLI==="ope" && KIRJAUTUNUT_OPE.koodi===o.koodi) cb.checked = true;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(`${o.nimi} (${o.koodi})`));
    kontti.appendChild(label);
  });
}

function taytaOppilasRataValinta() {
  const select = document.getElementById("oppRataSelect");
  const alue = document.getElementById("oppRataAlue");
  const oikeus = document.getElementById("oppRataOikeus").value;
  const radat = KOKO_LISTA.filter(x => x.tyyppi==="rata");
  select.innerHTML = "";
  radat.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.nimi;
    opt.textContent = r.nimi;
    select.appendChild(opt);
  });
  alue.style.display = oikeus==="maaritettu" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("oppRataOikeus")
    .addEventListener("change", taytaOppilasRataValinta);
});

function naytaOppilaat() {
  const div = document.getElementById("oppilaat");
  let oppilaat = KOKO_LISTA.filter(x => x.tyyppi==="oppilas");

  if (KIRJAUTUNUT_ROOLI==="ope" && KIRJAUTUNUT_OPE.naytto==="omat") {
    oppilaat = oppilaat.filter(o =>
      Array.isArray(o.opettajat) && o.opettajat.includes(KIRJAUTUNUT_OPE.koodi)
    );
  }

  div.innerHTML = "";
  if (!oppilaat.length) { div.textContent = "Ei oppilaita."; return; }

  oppilaat.forEach(o => {
    const el = document.createElement("div");
    el.className = "item";
    const main = document.createElement("div");
    main.className = "item-main";
    const opettajaTeksti = (o.opettajat || []).join(", ") || "-";
    const rataTeksti = o.saaValitaRadan
      ? "Oppilas valitsee radan"
      : (o.rata ? `Rata: ${o.rata}` : "Rata ei asetettu");
    main.innerHTML = `
      <b>${o.nimi}</b> (${o.luokka}) · ID: ${o.id}<br>
      <span class="muted">Opettajat: ${opettajaTeksti} · ${rataTeksti}</span>
    `;
    const btn = document.createElement("button");
    btn.textContent = "Poista";
    btn.className = "danger";
    btn.onclick = () => poistaOppilas(o.id);
    el.appendChild(main);
    el.appendChild(btn);
    div.appendChild(el);
  });
}

async function tallennaOppilas() {
  const nimi = document.getElementById("oppNimi").value.trim();
  const luokka = document.getElementById("oppLuokka").value.trim();
  const id = document.getElementById("oppID").value.trim();
  const oikeus = document.getElementById("oppRataOikeus").value;
  const rataSelect = document.getElementById("oppRataSelect");

  if (!nimi || !luokka || !id) { alert("Täytä nimi, luokka ja ID"); return; }

  const opettajat = [];
  document.querySelectorAll("#oppOpettajat input[type='checkbox']")
    .forEach(cb => { if (cb.checked) opettajat.push(cb.value); });
  if (!opettajat.length) { alert("Valitse vähintään yksi opettaja"); return; }

  let rata = null;
  let saaValitaRadan = true;
  if (oikeus === "maaritettu") {
    if (!rataSelect || !rataSelect.value) { alert("Valitse rata"); return; }
    rata = rataSelect.value;
    saaValitaRadan = false;
  }

  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi==="oppilas" && x.id===id));
  KOKO_LISTA.push({
    tyyppi:"oppilas",
    id, nimi, luokka,
    opettajat,
    saaValitaRadan,
    rata
  });

  await tallennaLista(KOKO_LISTA);

  document.getElementById("oppNimi").value = "";
  document.getElementById("oppLuokka").value = "";
  document.getElementById("oppID").value = "";
  document.getElementById("oppRataOikeus").value = "valitsee";
  taytaOppilasRataValinta();
  taytaOppilasOpettajaValinta();
  paivitaKaikkiListat();
}

async function poistaOppilas(id) {
  if (!confirm("Poistetaanko oppilas ID:llä " + id + "?")) return;
  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi==="oppilas" && x.id===id));
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

// SUORITUKSET

function naytaSuoritukset() {
  const div = document.getElementById("suoritukset");
  if (!div) return;

  let suoritukset = KOKO_LISTA.filter(x => x.tyyppi === "suoritus");

  if (KIRJAUTUNUT_ROOLI === "ope" && KIRJAUTUNUT_OPE.naytto === "omat") {
    const omatOppilaat = KOKO_LISTA
      .filter(x => x.tyyppi === "oppilas" && x.opettajat.includes(KIRJAUTUNUT_OPE.koodi))
      .map(x => x.id);

    suoritukset = suoritukset.filter(s => omatOppilaat.includes(s.oppilas));
  }

  if (!suoritukset.length) {
    div.textContent = "Ei suorituksia.";
    return;
  }

  div.innerHTML = "";

  suoritukset.forEach(s => {
    const el = document.createElement("div");
    el.className = "item";

    const main = document.createElement("div");
    main.className = "item-main";

    const oikeinTeksti = s.oikein
      ? "<span style='color:green;font-weight:600;'>Oikein</span>"
      : "<span style='color:red;font-weight:600;'>Väärin</span>";

    main.innerHTML = `
      <b>${s.oppilas}</b> – Rata: ${s.rata}, Rasti: ${s.rasti}<br>
      Syötetty: ${s.syotetty} · Oikea: ${s.oikea} · ${oikeinTeksti}<br>
      <span class="muted">${s.aika}</span>
    `;

    el.appendChild(main);
    div.appendChild(el);
  });
}
