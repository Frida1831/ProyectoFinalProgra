document.addEventListener("DOMContentLoaded", () => {
  console.log("FAQ JS cargado ✅");

  const questions = document.querySelectorAll(".faq-question");
  console.log("Preguntas encontradas:", questions.length);

  if (!questions.length) {
    console.warn("No se encontraron elementos con la clase .faq-question");
    return;
  }

  questions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const answer = btn.nextElementSibling; // el div.faq-answer que sigue

      if (!answer) return;

      // Cerrar otras respuestas
      document.querySelectorAll(".faq-answer").forEach((a) => {
        if (a !== answer) {
          a.style.maxHeight = null;
        }
      });

      // Alternar la seleccionada
      if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
      } else {
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});
