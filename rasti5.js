document.getElementById("oppilas").textContent =
  localStorage.getItem("nimi") + " (" + localStorage.getItem("luokka") + ")";
document.getElementById("rata").textContent = localStorage.getItem("rata");

const oikeaRasti5 = "E90";

document.getElementById("seuraava").addEventListener("click", () => {
  const syote = document.getElementById("rastiKoodi").value;

  if (syote === oikeaRasti5) {
    localStorage.setItem("rasti5", syote);
    window.location.href = "tulokset.html";
  } else {
    document.getElementById("virhe").textContent = "Väärä rastikoodi!";
  }
});
