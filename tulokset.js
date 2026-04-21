async function tallennaOppilas(id, nimi, luokka, rata) {
  const oppilas = {
    id: id || crypto.randomUUID(),
    koodi: Math.floor(100000 + Math.random() * 900000),
    nimi,
    luokka,
    rata,
    aika: new Date().toISOString(),
    historia: []
  };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(oppilas)
  });
}
