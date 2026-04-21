let KIRJAUTUNUT_ROOLI = null; // "superadmin" tai "ope"
let KIRJAUTUNUT_OPE = null;
let KOKO_LISTA = [];

// VAIHDA TÄHÄN UUSI SUPERADMIN-KOODI
const SUPERADMIN_KOODI = "mavlu2012"; // vaihda halutessasi

async function haeKaikki() {
  const res = await fetch(API_URL);
  return await res.json();
}

async function tallennaLista(uusiLista) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ komento: "korvaa", data: uusiLista })
  });
}

async function kirjauduAdmin() {
  const code = document.getElementById("adminCode").value.trim();
  if (!code) {
    alert("Syötä koodi");
    return;
  }

  const lista = await haeKaikki();
  KOKO_LISTA = lista;

  if (code === SUPERADMIN_KOODI) {
    KIRJAUTUNUT_ROOLI = "superadmin";
    KIRJAUTUNUT_OPE = null;
  } else {
    const ope = lista.find(x => x.tyyppi === "ope" && x.koodi === code);
    if (!ope) {
      alert("Väärä koodi");
      return;
    }
    KIRJAUTUNUT_ROOLI = "ope";
    KIRJAUTUNUT_OPE = ope;
  }

  document.getElementById("login").classList.add("hidden");
  document.getElementById("panel").classList.remove("hidden");

  paivitaUI();
}

function paivitaUI() {
  const info = document.getElementById("infoBox");
  if (KIRJAUTUNUT_ROOLI === "superadmin") {
    info.innerHTML = "<b>Kirjautunut superadmin</b>";
    document.getElementById("opettajaBox").classList.remove("hidden");
  } else {
    info.innerHTML = `<b>Kirjautunut opettaja:</b> ${KIRJAUTUNUT_OPE.nimi} <span class="tag">${KIRJAUTUNUT_OPE.koodi}</span>`;
    document.getElementById("opettajaBox").classList.add("hidden");
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
}

// ---------- RATAT + RASTIT + PDF ----------

function naytaRadat() {
  const radat = KOKO_LISTA.filter(x => x.tyyppi === "rata");
  const div = document.getElementById("radat");
  div.innerHTML = "";

  if (radat.length === 0) {
    div.textContent = "Ei ratoja.";
    return;
  }

  radat.forEach(r => {
    const card = document.createElement("div");
    card.className = "card";

    const main = document.createElement("div");
    main.className = "card-main";

    const rastitTeksti = (r.rastit && r.rastit.length > 0)
      ? r.rastit.join(", ")
      : "Ei rastikoodeja";

    const karttaTeksti = r.karttaPdf
      ? `Kartta: ${r.karttaPdf}`
      : "Ei kartta-PDF:ää";

    main.innerHTML = `
      <b>${r.nimi}</b><br>
      Rastit: ${rastitTeksti}<br>
      ${karttaTeksti}
    `;

    card.appendChild(main);

    const btnRastit = document.createElement("button");
    btnRastit.textContent = "Muokkaa rasteja";
    btnRastit.onclick = () => muokkaaRasteja(r.nimi);
    card.appendChild(btnRastit);

    const btnKartta = document.createElement("button");
    btnKartta.textContent = "Kartta PDF";
    btnKartta.onclick = () => muokkaaKarttaa(r.nimi);
    card.appendChild(btnKartta);

    if (KIRJAUTUNUT_ROOLI === "superadmin") {
      const btnDel = document.createElement("button");
      btnDel.textContent = "Poista rata";
      btnDel.className = "danger";
      btnDel.onclick = () => poistaRata(r.nimi);
      card.appendChild(btnDel);
    }

    div.appendChild(card);
  });
}

async function lisaaRata() {
  const nimi = document.getElementById("rataNimi").value.trim();
  if (!nimi) {
    alert("Anna radan nimi");
    return;
  }

  if (KOKO_LISTA.some(x => x.tyyppi === "rata" && x.nimi === nimi)) {
    alert("Tällä nimellä on jo rata");
    return;
  }

  KOKO_LISTA.push({
    tyyppi: "rata",
    nimi,
    rastit: [],
    karttaPdf: null
  });

  await tallennaLista(KOKO_LISTA);
  document.getElementById("rataNimi").value = "";
  paivitaKaikkiListat();
}

async function poistaRata(nimi) {
  if (!confirm("Poistetaanko rata " + nimi + "?")) return;

  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi === "rata" && x.nimi === nimi));
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

async function muokkaaRasteja(rataNimi) {
  const rata = KOKO_LISTA.find(x => x.tyyppi === "rata" && x.nimi === rataNimi);
  if (!rata) return;

  const nykyiset = (rata.rastit || []).join(", ");
  const syote = prompt(
    `Anna rastikoodit pilkulla erotettuna radalle "${rataNimi}"\nEsim: R1, R2, R3`,
    nykyiset
  );

  if (syote === null) return;

  const lista = syote
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  rata.rastit = lista;

  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

async function muokkaaKarttaa(rataNimi) {
  const rata = KOKO_LISTA.find(x => x.tyyppi === "rata" && x.nimi === rataNimi);
  if (!rata) return;

  const nykyinen = rata.karttaPdf || "";
  const syote = prompt(
    `Anna kartta-PDF:n URL radalle "${rataNimi}"\nEsim: https://oma-sivu.fi/kartat/helppo.pdf`,
    nykyinen
  );

  if (syote === null) return;

  const url = syote.trim();
  rata.karttaPdf = url || null;

  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

// ---------- OPETTAJAT ----------

function naytaOpettajat() {
  const div = document.getElementById("opettajat");
  if (!div) return;

  const opettajat = KOKO_LISTA.filter(x => x.tyyppi === "ope");
  div.innerHTML = "";

  if (opettajat.length === 0) {
    div.textContent = "Ei opettajia.";
    return;
  }

  opettajat.forEach(o => {
    const card = document.createElement("div");
    card.className = "card";

    const main = document.createElement("div");
    main.className = "card-main";
    main.innerHTML = `
      <b>${o.nimi}</b> <span class="tag">${o.koodi}</span><br>
      Näkyvyys: ${o.naytto === "kaikki" ? "Näkee kaikki oppilaat" : "Näkee vain omat oppilaat"}
    `;

    card.appendChild(main);

    if (KIRJAUTUNUT_ROOLI === "superadmin") {
      const btn = document.createElement("button");
      btn.textContent = "Poista";
      btn.className = "danger";
      btn.onclick = () => poistaOpettaja(o.koodi);
      card.appendChild(btn);
    }

    div.appendChild(card);
  });
}

async function lisaaOpettaja() {
  if (KIRJAUTUNUT_ROOLI !== "superadmin") return;

  const nimi = document.getElementById("opeNimi").value.trim();
  const koodi = document.getElementById("opeKoodi").value.trim();
  const nakyvyys = document.getElementById("opeNakyvyys").value;

  if (!nimi || !koodi) {
    alert("Täytä opettajan nimi ja koodi");
    return;
  }

  if (KOKO_LISTA.some(x => x.tyyppi === "ope" && x.koodi === koodi)) {
    alert("Tällä koodilla on jo opettaja");
    return;
  }

  KOKO_LISTA.push({
    tyyppi: "ope",
    nimi,
    koodi,
    naytto: nakyvyys
  });

  await tallennaLista(KOKO_LISTA);

  document.getElementById("opeNimi").value = "";
  document.getElementById("opeKoodi").value = "";
  document.getElementById("opeNakyvyys").value = "omat";

  paivitaKaikkiListat();
}

async function poistaOpettaja(koodi) {
  if (!confirm("Poistetaanko opettaja " + koodi + "?")) return;

  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi === "ope" && x.koodi === koodi));
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}

// ---------- OPPILAAT ----------

function taytaOppilasOpettajaValinta() {
  const kontti = document.getElementById("oppOpettajat");
  kontti.innerHTML = "";

  const opettajat = KOKO_LISTA.filter(x => x.tyyppi === "ope");

  if (opettajat.length === 0) {
    kontti.textContent = "Ei opettajia (lisää ensin opettajia).";
    return;
  }

  opettajat.forEach(o => {
    const label = document.createElement("label");
    label.style.fontWeight = "normal";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = o.koodi;
    cb.style.marginRight = "5px";

    if (KIRJAUTUNUT_ROOLI === "ope" && KIRJAUTUNUT_OPE.koodi === o.koodi) {
      cb.checked = true;
    }

    label.appendChild(cb);
    label.appendChild(document.createTextNode(`${o.nimi} (${o.koodi})`));
    kontti.appendChild(label);
  });
}

function taytaOppilasRataValinta() {
  const select = document.getElementById("oppRataSelect");
  const alue = document.getElementById("oppRataAlue");
  const oikeus = document.getElementById("oppRataOikeus").value;

  const radat = KOKO_LISTA.filter(x => x.tyyppi === "rata");

  select.innerHTML = "";
  radat.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.nimi;
    opt.textContent = r.nimi;
    select.appendChild(opt);
  });

  alue.style.display = oikeus === "maaritettu" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const oikeusSelect = document.getElementById("oppRataOikeus");
  oikeusSelect.addEventListener("change", taytaOppilasRataValinta);
});

function naytaOppilaat() {
  const div = document.getElementById("oppilaat");
  div.innerHTML = "";

  let oppilaat = KOKO_LISTA.filter(x => x.tyyppi === "oppilas");

  if (KIRJAUTUNUT_ROOLI === "ope") {
    if (KIRJAUTUNUT_OPE.naytto === "omat") {
      oppilaat = oppilaat.filter(o => Array.isArray(o.opettajat) && o.opettajat.includes(KIRJAUTUNUT_OPE.koodi));
    }
  }

  if (oppilaat.length === 0) {
    div.textContent = "Ei oppilaita.";
    return;
  }

  oppilaat.forEach(o => {
    const card = document.createElement("div");
    card.className = "card";

    const main = document.createElement("div");
    main.className = "card-main";

    const opettajaTeksti = (o.opettajat || []).join(", ") || "-";
    const rataTeksti = o.saaValitaRadan
      ? "Oppilas valitsee radan"
      : (o.rata ? `Rata määrätty: ${o.rata}` : "Rata ei asetettu");

    main.innerHTML = `
      <b>${o.nimi}</b> (${o.luokka}) – ID: ${o.id}<br>
      Opettajat: ${opettajaTeksti}<br>
      ${rataTeksti}
    `;

    card.appendChild(main);

    const btn = document.createElement("button");
    btn.textContent = "Poista";
    btn.className = "danger";
    btn.onclick = () => poistaOppilas(o.id);
    card.appendChild(btn);

    div.appendChild(card);
  });
}

async function tallennaOppilas() {
  const nimi = document.getElementById("oppNimi").value.trim();
  const luokka = document.getElementById("oppLuokka").value.trim();
  const id = document.getElementById("oppID").value.trim();
  const oikeus = document.getElementById("oppRataOikeus").value;
  const rataSelect = document.getElementById("oppRataSelect");

  if (!nimi || !luokka || !id) {
    alert("Täytä nimi, luokka ja ID");
    return;
  }

  const opettajaCheckboxit = document.querySelectorAll("#oppOpettajat input[type='checkbox']");
  const opettajat = [];
  opettajaCheckboxit.forEach(cb => {
    if (cb.checked) opettajat.push(cb.value);
  });

  if (opettajat.length === 0) {
    alert("Valitse vähintään yksi opettaja");
    return;
  }

  let rata = null;
  let saaValitaRadan = true;

  if (oikeus === "maaritettu") {
    if (!rataSelect || !rataSelect.value) {
      alert("Valitse rata");
      return;
    }
    rata = rataSelect.value;
    saaValitaRadan = false;
  } else {
    saaValitaRadan = true;
    rata = null;
  }

  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi === "oppilas" && x.id === id));

  KOKO_LISTA.push({
    tyyppi: "oppilas",
    id,
    nimi,
    luokka,
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

  KOKO_LISTA = KOKO_LISTA.filter(x => !(x.tyyppi === "oppilas" && x.id === id));
  await tallennaLista(KOKO_LISTA);
  paivitaKaikkiListat();
}
