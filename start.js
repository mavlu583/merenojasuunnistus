// Oppilaan aloituskoodi
document.getElementById("jatka").addEventListener("click", () => {
  const koodi = document.getElementById("koodi").value;
  const oikeaKoodi = "7hi";

  if (koodi === oikeaKoodi) {
    window.location.href = "nimi.html";
  } else {
    document.getElementById("virhe").textContent = "Väärä aloituskoodi!";
  }
});

document.getElementById("jatka").onclick = () => {
  if (document.getElementById("koodi").value === "7hi") {
    window.location.href = "nimi.html";
  } else {
    document.getElementById("virhe").textContent = "Väärä aloituskoodi.";
  }
};

document.getElementById("admin").onclick = () => {
  const k = prompt("Ylläpitokoodi:");
  if (k === "2012") window.location.href = "admin.html";
};
