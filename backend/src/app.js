// backend/src/app.js
const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 👉 Ruta raíz solo para probar que la API funciona
app.get("/", (req, res) => {
  res.json({ msg: "API de Chochetitos funcionando 🧶" });
});

// Aquí luego irán tus rutas reales, por ejemplo:
// const authRoutes = require("./routes/auth.routes");
// app.use("/api/auth", authRoutes);

module.exports = app;
