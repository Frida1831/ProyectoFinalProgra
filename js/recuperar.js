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

    Swal.fire({
      title: "Enviando instrucciones...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
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

      Swal.fire({
        icon: resp.ok ? "success" : "error",
        title: "Recuperar contraseña",
        text:
          data.msg ||
          "Si el correo está registrado, recibirás un mensaje con instrucciones.",
      });
    } catch (err) {
      console.error("Error en forgot-password:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo contactar el servidor.",
      });
    }
  });
