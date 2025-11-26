document
  .getElementById("register-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const pass = document.getElementById("password").value.trim();
    const pass2 = document.getElementById("password2").value.trim();

    // Validaciones
    if (pass !== pass2) {
      Swal.fire({
        icon: "warning",
        title: "Contraseñas distintas",
        text: "Las contraseñas no coinciden.",
      });
      return;
    }

    if (pass.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña muy corta",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    if (nombre.length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Nombre muy corto",
        text: "El nombre debe tener al menos 3 caracteres.",
      });
      return;
    }

    Swal.fire({
      title: "Creando tu cuenta...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nombre,
            correo: correo,
            password: pass,
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        Swal.fire({
          icon: "error",
          title: "No se pudo registrar",
          text: data.msg || "Error al registrar.",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Cuenta creada",
        text: "Tu cuenta se creó con éxito. Te llevamos al login.",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor.",
      });
    }
  });

