const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");

const app = express();

app.use(cors());
app.use(express.json());

// === MIDDLEWARE JWT ===
function autenticarJWT(req, res, next) {
  const authHeader = req.header("authorization") || req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No hay token en la petición" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error("Error al verificar token:", err.message);
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
}

// === BD ===
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
  if (!pool) throw new Error("Pool de BD no inicializado");
  return pool;
}

// === EMAIL ===
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// === CAPTCHA ===
const captchaStore = new Map();

function generarCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let texto = "";
  for (let i = 0; i < 5; i++) {
    texto += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const id = crypto.randomBytes(8).toString("hex");
  const expires = Date.now() + 5 * 60 * 1000;

  captchaStore.set(id, { text: texto, expires });

  return { id, texto };
}

function validarCaptcha(id, respuestaUsuario) {
  const data = captchaStore.get(id);
  if (!data) return { ok: false, msg: "Captcha inválido" };

  if (Date.now() > data.expires) {
    captchaStore.delete(id);
    return { ok: false, msg: "Captcha expirado" };
  }

  captchaStore.delete(id);

  const correcto =
    data.text.toUpperCase() === String(respuestaUsuario || "").toUpperCase();

  if (!correcto) return { ok: false, msg: "Captcha incorrecto" };

  return { ok: true };
}

// === RUTAS ===
app.get("/", (req, res) => {
  res.json({ msg: "API de Chochetitos funcionando 🧶" });
});

app.get("/api/auth/captcha", (req, res) => {
  const { id, texto } = generarCaptcha();
  res.json({ captchaId: id, captchaText: texto });
});

// === REGISTRO ===
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

    const hash = bcrypt.hashSync(password, 10);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'user')",
      [nombre, correo, hash]
    );

    res.status(201).json({
      msg: "Usuario creado con éxito",
      user: { id: result.insertId, nombre, correo, rol: "user" },
    });
  } catch (err) {
    console.error("Error en /api/auth/register:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// === LOGIN CON CAPTCHA ===
app.post("/api/auth/login", async (req, res) => {
  try {
    const { correo, password, captchaId, captchaText } = req.body;

    if (!correo || !password || !captchaId || !captchaText) {
      return res.status(400).json({ msg: "Faltan datos o captcha" });
    }

    const resCaptcha = validarCaptcha(captchaId, captchaText);
    if (!resCaptcha.ok) return res.status(400).json({ msg: resCaptcha.msg });

    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0)
      return res.status(400).json({ msg: "Credenciales incorrectas" });

    const user = rows[0];

    // bloqueado
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const desbloqueo = new Date(user.bloqueado_hasta);
      return res.status(403).json({
        msg: `Cuenta bloqueada. Intenta de nuevo después de las ${desbloqueo.toLocaleTimeString()}.`,
      });
    }

    // validar password
    const esValida = bcrypt.compareSync(password, user.password_hash);
    if (!esValida) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      let bloqueadoHasta = null;

      if (nuevosIntentos >= 3)
        bloqueadoHasta = new Date(Date.now() + 5 * 60 * 1000);

      await pool.query(
        "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?",
        [nuevosIntentos, bloqueadoHasta, user.id]
      );

      return res.status(400).json({
        msg:
          nuevosIntentos >= 3
            ? "Cuenta bloqueada por intentos fallidos. Intenta de nuevo en 5 minutos."
            : "Credenciales incorrectas",
      });
    }

    // resetear intentos
    await pool.query(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [user.id]
    );

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

// === GET PRODUCTOS ===
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

// =======================
// ORDENES
// =======================
app.post("/api/ordenes", autenticarJWT, async (req, res) => {
  try {
    const {
      nombre,
      correo,
      direccion,
      cp,
      pais,
      metodo,
      cupon,
      items,
      telefono,
    } = req.body;

    if (!nombre || !correo || !direccion || !cp || !pais || !metodo) {
      return res.status(400).json({ msg: "Faltan datos de la orden" });
    }

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ msg: "La orden no tiene productos" });

    const pool = getPool();

    const ids = items.map((i) => i.productoId);
    const [productosDB] = await pool.query(
      "SELECT id, nombre, precio, stock FROM productos WHERE id IN (?)",
      [ids]
    );

    if (productosDB.length !== ids.length)
      return res
        .status(400)
        .json({ msg: "Uno o más productos no existen en la BD" });

    // calcular
    let subtotal = 0;
    const detalles = [];

    for (const item of items) {
      const prod = productosDB.find((p) => p.id === item.productoId);

      if (!prod)
        return res.status(400).json({
          msg: `Producto con id ${item.productoId} no encontrado`,
        });

      const cantidad = parseInt(item.cantidad, 10) || 1;
      if (cantidad <= 0)
        return res.status(400).json({
          msg: `Cantidad inválida para el producto ${prod.nombre}`,
        });

      if (prod.stock < cantidad)
        return res.status(400).json({
          msg: `No hay stock suficiente para ${prod.nombre}. Disponible: ${prod.stock}`,
        });

      const precioNum = Number(prod.precio);
      const subLinea = precioNum * cantidad;

      subtotal += subLinea;

      detalles.push({
        producto_id: prod.id,
        nombre_producto: prod.nombre,
        precio_unitario: precioNum,
        cantidad,
        subtotal: subLinea,
      });
    }

    const { envio, impuestos } = obtenerEnvioYImpuestos(subtotal, pais);
    const descuento = obtenerDescuento(subtotal, cupon);
    const total = subtotal + impuestos + envio - descuento;

    const conn = await pool.getConnection();
    let ordenId;

    try {
      await conn.beginTransaction();

      const usuarioId = req.user ? req.user.uid : null;

      const [resOrden] = await conn.query(
        `INSERT INTO ordenes
          (usuario_id, nombre_cliente, correo_cliente, direccion, cp, telefono, pais,
          metodo_pago, subtotal, impuestos, envio, descuento, total, cupon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuarioId,
          nombre,
          correo,
          direccion,
          cp,
          telefono || "",
          pais,
          metodo,
          subtotal,
          impuestos,
          envio,
          descuento,
          total,
          cupon || null,
        ]
      );

      ordenId = resOrden.insertId;

      for (const det of detalles) {
        await conn.query(
          `INSERT INTO orden_detalle
            (orden_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ordenId,
            det.producto_id,
            det.nombre_producto,
            det.precio_unitario,
            det.cantidad,
            det.subtotal,
          ]
        );

        await conn.query(
          "UPDATE productos SET stock = stock - ? WHERE id = ?",
          [det.cantidad, det.producto_id]
        );
      }

      await conn.commit();
    } catch (errTx) {
      await conn.rollback();
      console.error("Error en transacción de orden:", errTx);
      return res
        .status(500)
        .json({ msg: "Error al crear la orden en la base de datos" });
    } finally {
      conn.release();
    }

    try {
      await enviarNotaPorCorreo(ordenId);
    } catch (errMail) {
      console.error(
        "Error al enviar la nota por correo:",
        errMail.message
      );
    }

    return res.status(201).json({
      msg: "Orden creada correctamente. La nota se envió a tu correo electrónico.",
      ordenId,
      total,
    });
  } catch (err) {
    console.error("Error en /api/ordenes:", err);
    res.status(500).json({ msg: "Error en el servidor al crear la orden" });
  }
});

// === LOGICA IMPUESTOS ===
function obtenerEnvioYImpuestos(subtotal, pais) {
  let envio = 40;
  let tasaImpuesto = 0.16;

  if (pais === "us") {
    envio = 120;
    tasaImpuesto = 0.08;
  } else if (pais === "latam") {
    envio = 90;
    tasaImpuesto = 0.0;
  }

  return { envio, impuestos: subtotal * tasaImpuesto };
}

function obtenerDescuento(subtotal, cupon) {
  if (!cupon) return 0;
  const code = cupon.trim().toUpperCase();
  if (code === "CROCHET10") return subtotal * 0.1;
  return 0;
}

// === PDF ===
function generarPDFNota(orden, detalles) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Chochetitos 🧶", { align: "center" }).moveDown(0.3);

    doc
      .fontSize(12)
      .text("Creaciones tejidas a mano con amor.", { align: "center" })
      .moveDown(1);

    doc.fontSize(10);
    doc.text(`Nota de compra #${orden.id}`);
    doc.text(
      `Fecha: ${new Date(orden.creado_en).toLocaleString("es-MX")}`
    );
    doc.text(`Cliente: ${orden.nombre_cliente}`);
    doc.text(`Correo: ${orden.correo_cliente}`);
    doc.text(
      `Dirección: ${orden.direccion}, CP ${orden.cp}, País: ${orden.pais.toUpperCase()}`
    );
    doc.text(`Método de pago: ${orden.metodo_pago}`);
    if (orden.cupon) doc.text(`Cupón utilizado: ${orden.cupon}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Detalle de la compra", { underline: true });
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold");
    doc.text("Producto", 50, doc.y, { continued: true });
    doc.text("Cant.", 260, doc.y, { continued: true });
    doc.text("P. unit.", 310, doc.y, { continued: true });
    doc.text("Subtotal", 400, doc.y);
    doc.moveDown(0.5);
    doc.font("Helvetica");


    detalles.forEach((det) => {
      const precioUnitarioNum = Number(det.precio_unitario);
      
      doc.text(det.nombre_producto, 50, doc.y, { continued: true });
      doc.text(String(det.cantidad), 260, doc.y, { continued: true });
      
      doc.text(`$${precioUnitarioNum.toFixed(2)}`, 310, doc.y, {
        continued: true,
      });
      doc.text(`$${Number(det.subtotal).toFixed(2)}`, 400, doc.y); 
    });


    doc.moveDown(1);


    doc.text(`Subtotal: $${Number(orden.subtotal).toFixed(2)}`, {
      align: "right",
    });
    doc.text(`Impuestos: $${Number(orden.impuestos).toFixed(2)}`, {
      align: "right",
    });
    doc.text(`Envío: $${Number(orden.envio).toFixed(2)}`, {
      align: "right",
    });

    if (orden.descuento > 0)
      doc.text(`Descuento: -$${Number(orden.descuento).toFixed(2)}`, {
        align: "right",
      });

    doc.moveDown(0.2);
    doc.font("Helvetica-Bold");
    doc.text(`Total: $${Number(orden.total).toFixed(2)}`, { align: "right" });
    // === FIN DE CORRECCIÓN (TOTALES) ===

    doc.moveDown(2);
    doc.fontSize(10).text("Gracias por comprar en Chochetitos 💜", {
      align: "center",
    });

    doc.end();
  });
}
// === ENVIAR PDF POR CORREO ===
async function enviarNotaPorCorreo(ordenId) {
  const pool = getPool();

  const [ordenes] = await pool.query("SELECT * FROM ordenes WHERE id = ?", [
    ordenId,
  ]);
  if (!ordenes.length) throw new Error("Orden no encontrada");

  const orden = ordenes[0];

  console.log("📨 Intentando enviar correo a:", orden.correo_cliente);

  const [detalles] = await pool.query(
    "SELECT * FROM orden_detalle WHERE orden_id = ?",
    [ordenId]
  );

  const pdfBuffer = await generarPDFNota(orden, detalles);

  await transporter.sendMail({
    from: `"Chochetitos 🧶" <${process.env.SMTP_USER}>`,
    to: orden.correo_cliente,
    subject: `Nota de compra #${orden.id} - Chochetitos`,
    text: "Gracias por tu compra en Chochetitos. Adjuntamos tu nota de compra.",
    attachments: [
      {
        filename: `nota_chochetitos_${orden.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

// === FORGOT PASSWORD ===
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo)
      return res.status(400).json({ msg: "Debes escribir tu correo" });

    console.log(`[FORGOT] 1. Solicitud recibida para: ${correo}`);
    
    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT id, nombre FROM usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0)
      return res.json({
        msg: "Si el correo está registrado, recibirás un mensaje con instrucciones.",
      });

    const usuario = rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)",
      [usuario.id, token, expires]
    );

    const resetLink = `http://localhost:5500/reset.html?token=${token}`;

    const html = `
      <h2>Recuperar contraseña - Chochetitos 🧶</h2>
      <p>Hola, ${usuario.nombre}.</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${resetLink}" style="background:#7b3fe4;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">
        Restablecer contraseña
      </a>
      <p>Enlace directo: ${resetLink}</p>
      <p>Este enlace es válido por 1 hora.</p>
    `;

    await transporter.sendMail({
      from: `"Chochetitos 🧶" <${process.env.SMTP_USER}>`,
      to: correo,
      subject: "Recuperar contraseña - Chochetitos",
      html,
    });

    res.json({
      msg: "Si el correo está registrado, recibirás un mensaje con instrucciones.",
    });
  } catch (err) {
    console.error("Error en /api/auth/forgot-password:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// === RESET PASSWORD ===
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password, password2 } = req.body;

    if (!token || !password || !password2)
      return res.status(400).json({ msg: "Faltan datos" });

    if (password !== password2)
      return res.status(400).json({ msg: "Las contraseñas no coinciden" });

    if (password.length < 6)
      return res.status(400).json({
        msg: "La contraseña debe tener al menos 6 caracteres",
      });

    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT prt.*, u.id AS usuario_id
       FROM password_reset_tokens prt
       JOIN usuarios u ON u.id = prt.usuario_id
       WHERE prt.token = ?`,
      [token]
    );

    if (rows.length === 0)
      return res.status(400).json({ msg: "Token inválido" });

    const registro = rows[0];

    if (registro.usado)
      return res.status(400).json({ msg: "Este enlace ya fue utilizado" });

    if (new Date(registro.expires_at) < new Date())
      return res.status(400).json({ msg: "El enlace ha expirado" });

    const hash = bcrypt.hashSync(password, 10);

    await pool.query(
      "UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [hash, registro.usuario_id]
    );

    await pool.query(
      "UPDATE password_reset_tokens SET usado = 1 WHERE id = ?",
      [registro.id]
    );

    res.json({
      msg: "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (err) {
    console.error("Error en /api/auth/reset-password:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// === RUTA DE CONTACTO ===
app.post("/api/contact", async (req, res) => {
  try {
    const { nombre, correo, asunto, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({ msg: "Por favor llena todos los campos." });
    }

    // 1. Correo para TI (Admin) - Aviso de nuevo mensaje
    const mailOptionsAdmin = {
      from: `"Formulario Web" <${process.env.SMTP_USER}>`,
      to: "chochetitos31@gmail.com", // Tu correo personal
      subject: `Nuevo Mensaje Web: ${asunto}`,
      html: `
        <h3>Nuevo mensaje de contacto</h3>
        <p><strong>De:</strong> ${nombre} (${correo})</p>
        <p><strong>Asunto:</strong> ${asunto}</p>
        <p><strong>Mensaje:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #7b3fe4;">
          ${mensaje}
        </blockquote>
      `
    };

    // 2. Correo para el USUARIO - Respuesta automática con Marca
    const mailOptionsUser = {
      from: `"Chochetitos 🧶" <${process.env.SMTP_USER}>`,
      to: correo,
      subject: "Hemos recibido tu mensaje - Chochetitos",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            
            <div style="background-color: #7b3fe4; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Chochetitos 🧶</h1>
            </div>

            <div style="padding: 20px; text-align: center;">
                <p style="font-style: italic; color: #666; font-size: 16px; margin-bottom: 20px;">
                    "Creaciones tejidas a mano con amor."
                </p>
                
                <h2 style="color: #333;">¡Hola, ${nombre}!</h2>
                
                <p style="font-size: 18px; color: #27ae60; font-weight: bold;">
                    En breve será atendido.
                </p>

                <p style="color: #555;">
                    Gracias por ponerte en contacto con nosotros. Hemos recibido tu mensaje sobre "<strong>${asunto}</strong>" y nuestro equipo te responderá lo antes posible.
                </p>
            </div>

            <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} Chochetitos. Todos los derechos reservados.
            </div>
        </div>
      `
    };

    // Enviar ambos correos
    await transporter.sendMail(mailOptionsAdmin);
    await transporter.sendMail(mailOptionsUser);

    res.json({ msg: "Mensaje enviado correctamente." });

  } catch (err) {
    console.error("Error en /api/contact:", err);
    res.status(500).json({ msg: "Error al enviar el mensaje." });
  }
});

// === MIDDLEWARE ADMIN ===
function verificarAdmin(req, res, next) {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    return res.status(403).json({ msg: "Acceso denegado: Se requiere rol de administrador" });
  }
}

// === RUTAS ADMIN (ESTADÍSTICAS Y STOCK) ===
app.get("/api/admin/dashboard", autenticarJWT, verificarAdmin, async (req, res) => {
  try {
    const pool = getPool();
    
    // 1. Datos para la Gráfica: Ventas de los últimos 7 días
    // Esta consulta agrupa las ventas por fecha y suma los totales
    const [ventas] = await pool.query(`
      SELECT DATE(creado_en) as fecha, SUM(total) as total_venta 
      FROM ordenes 
      GROUP BY DATE(creado_en) 
      ORDER BY fecha DESC 
      LIMIT 7
    `);

    // 2. Datos para el Reporte de Stock por Categoría
    const [stock] = await pool.query(`
      SELECT * FROM productos 
      ORDER BY categoria, stock ASC
    `);

    const [totalVentasRows] = await pool.query(`
        SELECT SUM(total) AS totalVentas
        FROM ordenes
        WHERE total IS NOT NULL 
    `);
    
    // Extraemos el valor, asegurando que si la BD devuelve NULL (tabla vacía), sea 0.
    const totalVentas = totalVentasRows[0].totalVentas || 0;

    res.json({
      ventas: ventas.reverse(), // Invertir para que la gráfica vaya de izquierda a derecha
      inventario: stock,
      totalVentas: totalVentas
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener datos del dashboard" });
  }
});

// === CRUD PRODUCTOS (ALTAS, BAJAS, MODIFICAR) ===

// Crear Producto (Alta)
app.post("/api/productos", autenticarJWT, verificarAdmin, async (req, res) => {
    // Añadir 'descripcion' con valor por defecto, ya que no la pedimos en el frontend
    const { nombre, precio, stock, categoria, imagen } = req.body; 
    
    try {
        const pool = getPool();
        // Asegúrate de que esta consulta incluya todas las columnas NOT NULL (usamos '' para descripcion y 'Disponible' para disponibilidad)
        await pool.query(
          "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen, disponibilidad, oferta) VALUES (?,?,?,?,?,?, 'Disponible', 0)", 
          [nombre, "", precio, stock, categoria, imagen]
        );
        res.json({ msg: "Producto creado" });
    } catch(err) { 
        console.error("Error al crear producto:", err);
        res.status(500).json({msg: "Error al crear producto en DB"}); 
    }
});

// Editar Producto
app.put("/api/productos/:id", autenticarJWT, verificarAdmin, async (req, res) => {
    // Nota: El frontend actual no envía la imagen ni la descripción
    const { nombre, precio, stock, categoria } = req.body;
    try {
        const pool = getPool();
        // Solo actualizamos los campos que el frontend envía, dejando descripcion y imagen fuera por simplicidad.
        await pool.query(
          "UPDATE productos SET nombre=?, precio=?, stock=?, categoria=? WHERE id=?", 
          [nombre, precio, stock, categoria, req.params.id]
        );
        res.json({ msg: "Producto actualizado" });
    } catch(err) { 
        console.error("Error al actualizar producto:", err);
        res.status(500).json({msg: "Error al actualizar producto en DB"}); 
    }
});

// Eliminar Producto
app.delete("/api/productos/:id", autenticarJWT, verificarAdmin, async (req, res) => {
    try {
        const pool = getPool();
        await pool.query("DELETE FROM productos WHERE id=?", [req.params.id]);
        res.json({ msg: "Producto eliminado" });
    } catch(err) { res.status(500).json(err); }
});

// === INICIAR SERVIDOR ===
const PORT = process.env.PORT || 3000;

async function iniciar() {
  await conectarBD();
  try {
        await transporter.verify();
        console.log("✅ Servidor de correo listo y conectado (Nodemailer)");
    } catch (error) {
        console.error("❌ ERROR CRÍTICO DE CORREO:", error.message);
        console.warn("ADVERTENCIA: La funcionalidad de enviar correos (Recuperar Contraseña/Ordenes) no funcionará.");
    }
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Chochetitos escuchando en puerto ${PORT}`);
  });
}

iniciar();