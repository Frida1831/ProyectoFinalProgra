// === LOGIN CON CAPTCHA + SWEETALERT ===

let captchaId = null;

// Cargar captcha desde el backend
async function cargarCaptcha() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/captcha");
    const data = await res.json();

    captchaId = data.captchaId;
    const span = document.getElementById("captcha-text");
    if (span) {
      span.textContent = data.captchaText;
    }
  } catch (err) {
    console.error("Error al cargar captcha:", err);
    const span = document.getElementById("captcha-text");
    if (span) {
      span.textContent = "ERROR";
    }
  }
}

const btnRefresh = document.getElementById("refresh-captcha");
if (btnRefresh) {
  btnRefresh.addEventListener("click", () => {
    cargarCaptcha();
  });
}

// Al cargar la página
cargarCaptcha();

document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();
  const captchaInput = document.getElementById("captcha-input").value.trim();

  if (!captchaId) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo generar el captcha. Intenta refrescarlo.",
    });
    return;
  }

  if (!captchaInput) {
    Swal.fire({
      icon: "warning",
      title: "Captcha faltante",
      text: "Por favor escribe el código de verificación.",
    });
    return;
  }

  Swal.fire({
    title: "Iniciando sesión...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  try {
    const respuesta = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        password,
        captchaId,
        captchaText: captchaInput,
      }),
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: data.msg || "Credenciales incorrectas.",
      });

      // recargar captcha al fallar
      cargarCaptcha();
      document.getElementById("captcha-input").value = "";
      return;
    }

    // Guardar token y usuario
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.user));

    Swal.fire({
      icon: "success",
      title: "¡Bienvenida!",
      text: "Inicio de sesión exitoso.",
      timer: 1500,
      showConfirmButton: false,
    });

    setTimeout(() => {
      if (data.user.rol === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    }, 1500);
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo conectar con el servidor.",
    });
  }
});

