// js/recuperar.js
// === RECUPERAR CONTRASEÑA (FORGOT PASSWORD) ===

// Escuchamos el submit del formulario "forgot-form"
document
  .getElementById("forgot-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();

    if (!correo) {
      Swal.fire({
        icon: "warning",
        title: "Falta el correo",
        text: "Escribe tu correo electrónico.",
      });
      return;
    }

    // Mostrar loader mientras se hace la petición
    Swal.fire({
      title: "Enviando instrucciones...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    try {
      const resp = await fetch(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ correo }),
        }
      );

      const data = await resp.json();

      // Siempre mostramos el mismo mensaje (como en el backend),
      // para no revelar si el correo existe o no.
      if (!resp.ok) {
        console.error("Error en respuesta forgot-password:", data);
      }

      Swal.fire({
        icon: "info",
        title: "Recuperar contraseña",
        text:
          data.msg ||
          "Si el correo está registrado, recibirás un mensaje con instrucciones.",
      });

      // Limpiar el campo
      document.getElementById("correo").value = "";
    } catch (err) {
      console.error("Error en forgot-password:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo contactar el servidor.",
      });
    }
  });

