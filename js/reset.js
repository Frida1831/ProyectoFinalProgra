const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const form = document.getElementById("reset-form");

if (!token) {
  Swal.fire({
    icon: "error",
    title: "Enlace inválido",
    text: "Falta el token en la URL.",
  });
  form.style.display = "none";
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const password = document.getElementById("password").value.trim();
  const password2 = document.getElementById("password2").value.trim();

  if (!password || !password2) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Completa ambos campos de contraseña.",
    });
    return;
  }

  Swal.fire({
    title: "Actualizando contraseña...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
  });

  try {
    const resp = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password, password2 }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: data.msg || "Hubo un problema con el enlace.",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Contraseña actualizada",
      text: "Tu contraseña se cambió correctamente. Te llevamos al login.",
      timer: 2000,
      showConfirmButton: false,
    });

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (err) {
    console.error("Error en reset-password:", err);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo contactar el servidor.",
    });
  }
});
