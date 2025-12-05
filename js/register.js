// js/register.js
// === REGISTRO DE USUARIO CON SWEETALERT ===

document
  .getElementById("register-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const pass = document.getElementById("password").value.trim();
    const pass2 = document.getElementById("password2").value.trim();

    // Validaciones básicas en frontend
    if (!nombre || !correo || !pass || !pass2) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor llena todos los campos.",
      });
      return;
    }

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

    // Mostrar loader mientras se envía al backend
    Swal.fire({
      title: "Creando cuenta...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    try {
      const resp = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          correo,
          password: pass,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        // Error del backend (correo ya registrado, faltan datos, etc.)
        Swal.fire({
          icon: "error",
          title: "No se pudo crear la cuenta",
          text: data.msg || "Intenta de nuevo más tarde.",
        });
        return;
      }

      // Registro correcto
      Swal.fire({
        icon: "success",
        title: "Cuenta creada",
        text: data.msg || "Tu cuenta se creó correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Redirigir a login
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

