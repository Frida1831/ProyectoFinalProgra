// Cargar HEADER
fetch("componentes/header.html")
  .then(res => res.text())
  .then(html => {
    document.querySelector("header").innerHTML = html;
    inicializarHeader();
  });

// Cargar FOOTER
fetch("componentes/footer.html")
  .then(res => res.text())
  .then(html => {
    document.querySelector("footer").innerHTML = html;
  });

function inicializarHeader() {
  const usuarioJSON = localStorage.getItem("usuario");
  const userSpan = document.getElementById("user-name");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const adminLink = document.getElementById("admin-link");

  if (!userSpan || !loginBtn || !logoutBtn) return;

  if (usuarioJSON) {
    const usuario = JSON.parse(usuarioJSON);

    userSpan.textContent = `Hola, ${usuario.nombre}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    if (adminLink && usuario.rol === "admin") {
      adminLink.style.display = "inline-block";
    }
  } else {
    userSpan.textContent = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
  }

  loginBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("carrito");
    // después podrás usar SweetAlert; por ahora:
    alert("Sesión cerrada");
    window.location.href = "index.html";
  });
}
