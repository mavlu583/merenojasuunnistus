async function lataaRadat() {
  const res = await fetch(API_URL);
  const lista = await res.json();

  const radat = lista.filter(x => x.tyyppi === "rata");

  const rataValinta = document.getElementById("rataValinta");
  rataValinta.innerHTML = "";

  radat.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.nimi;
    opt.textContent = r.nimi;
    rataValinta.appendChild(opt);
  });
}
