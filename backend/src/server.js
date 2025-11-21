require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// 1. CONEXIÓN A LA BD
let pool;

async function conectarBD() {
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log("✅ BD conectada");
  } catch (err) {
    console.error("❌ Error al conectar BD:", err.message);
    process.exit(1);
  }
}

function getPool() {
  if (!pool) {
    throw new Error("Pool de BD no inicializado");
  }
  return pool;
}

// 2. RUTA RAÍZ
app.get("/", (req, res) => {
  res.json({ msg: "API de Chochetitos funcionando 🧶" });
});

// 3. REGISTRO
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ msg: "Faltan datos" });
    }

    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT id FROM usuarios WHERE correo = ?",
      [correo]
    );
    if (rows.length > 0) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'user')",
      [nombre, correo, hash]
    );

    const nuevoUsuario = {
      id: result.insertId,
      nombre,
      correo,
      rol: "user",
    };

    res.status(201).json({
      msg: "Usuario creado con éxito",
      user: nuevoUsuario,
    });
  } catch (err) {
    console.error("Error en /api/auth/register:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// 4. LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res
        .status(400)
        .json({ msg: "Correo y contraseña son obligatorios" });
    }

    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0) {
      return res.status(400).json({ msg: "Credenciales incorrectas" });
    }

    const user = rows[0];

    const esValida = bcrypt.compareSync(password, user.password_hash);
    if (!esValida) {
      return res.status(400).json({ msg: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { uid: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      msg: "Login correcto",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Error en /api/auth/login:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// =========================
// 5. OBTENER PRODUCTOS
//    GET /api/productos
// =========================
app.get("/api/productos", async (req, res) => {
  try {
    const pool = getPool();

    const [rows] = await pool.query("SELECT * FROM productos");

    res.json(rows);
  } catch (err) {
    console.error("Error en /api/productos:", err);
    res.status(500).json({ msg: "Error al obtener productos" });
  }
});


// 5. INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;

async function iniciar() {
  await conectarBD();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Chochetitos escuchando en puerto ${PORT}`);
  });
}

iniciar();
