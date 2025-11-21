// Cargar HEADER
// js/componentes.js
fetch("componentes/header.html")
  .then(res => res.text())
  .then(html => {
    document.querySelector("header").innerHTML = html;
  });

fetch("componentes/footer.html")
  .then(res => res.text())
  .then(html => {
    document.querySelector("footer").innerHTML = html;
  });

