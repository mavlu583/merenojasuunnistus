document.getElementById("oppilas").textContent =
  `${localStorage.getItem("nimi")} (${localStorage.getItem("luokka")})`;
document.getElementById("rata").textContent = localStorage.getItem("rata");

const oikea = localStorage.getItem("r3");

document.getElementById("seuraava").onclick = () => {
  const syote = document.getElementById("rastiKoodi").value.trim();
  if (syote === oikea) {
    localStorage.setItem("rasti3", syote);
    window.location.href = "rasti4.html";
  } else {
    document.getElementById("virhe").textContent = "Väärä koodi.";
  }
};
