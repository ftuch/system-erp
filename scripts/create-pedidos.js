require('dotenv').config();
const { pool } = require('../config/database');

async function run() {
  const sqls = [
    `CREATE TABLE IF NOT EXISTS tc_pedidos_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requiere_revision        TINYINT DEFAULT 1,
      requiere_despacho        TINYINT DEFAULT 1,
      descuenta_inventario     TINYINT DEFAULT 0,
      descuenta_en             ENUM('aprobacion','despacho') DEFAULT 'despacho',
      rol_revisor_id           INT NULL,
      rol_despachador_id       INT NULL,
      permite_despacho_parcial TINYINT DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS tt_pedidos (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      numero           VARCHAR(20),
      sucursal_id      INT NOT NULL,
      usuario_id       INT NOT NULL,
      revisor_id       INT NULL,
      despachador_id   INT NULL,
      estado           ENUM('pendiente','aprobado','rechazado','despachado','cancelado') DEFAULT 'pendiente',
      observaciones    TEXT,
      comentario_revision VARCHAR(255),
      total            DECIMAL(10,2) DEFAULT 0,
      fecha_pedido     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_revision   TIMESTAMP NULL,
      fecha_despacho   TIMESTAMP NULL,
      FOREIGN KEY (sucursal_id)    REFERENCES tc_sucursales(id),
      FOREIGN KEY (usuario_id)     REFERENCES tt_usuarios(id),
      FOREIGN KEY (revisor_id)     REFERENCES tt_usuarios(id),
      FOREIGN KEY (despachador_id) REFERENCES tt_usuarios(id)
    )`,

    `CREATE TABLE IF NOT EXISTS tt_pedido_detalle (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      pedido_id         INT NOT NULL,
      producto_id       INT NOT NULL,
      descripcion       VARCHAR(200),
      cantidad          INT NOT NULL,
      precio_unitario   DECIMAL(10,2) DEFAULT 0,
      subtotal          DECIMAL(10,2) DEFAULT 0,
      FOREIGN KEY (pedido_id)   REFERENCES tt_pedidos(id),
      FOREIGN KEY (producto_id) REFERENCES tt_productos(id)
    )`,

    `INSERT IGNORE INTO tc_pedidos_config
      (id, requiere_revision, requiere_despacho, descuenta_inventario, descuenta_en, permite_despacho_parcial)
      VALUES (1, 1, 1, 0, 'despacho', 0)`
  ];

  for (const sql of sqls) {
    await pool.execute(sql);
    console.log('OK:', sql.trim().split('\n')[0].slice(0, 60));
  }

  // Menú pedidos
  const [existing] = await pool.execute("SELECT id FROM tc_menus WHERE codigo = 'pedidos'");
  if (existing.length === 0) {
    const [menu] = await pool.execute(
      "INSERT INTO tc_menus (nombre, icono, ruta, orden, codigo, estado) VALUES (?, ?, ?, ?, ?, 1)",
      ['Pedidos', 'shopping_bag', '/pedidos', 60, 'pedidos']
    );
    await pool.execute(
      "INSERT INTO ts_permisos (rol_id, menu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES (1, ?, 1, 1, 1, 1)",
      [menu.insertId]
    );
    console.log('Menu pedidos creado id:', menu.insertId);
  } else {
    console.log('Menu pedidos ya existe');
  }

  // Menú config pedidos
  const [existingCfg] = await pool.execute("SELECT id FROM tc_menus WHERE codigo = 'pedidos_config'");
  if (existingCfg.length === 0) {
    const [menuCfg] = await pool.execute(
      "INSERT INTO tc_menus (nombre, icono, ruta, orden, codigo, estado) VALUES (?, ?, ?, ?, ?, 1)",
      ['Config. Pedidos', 'tune', '/pedidos/config', 61, 'pedidos_config']
    );
    await pool.execute(
      "INSERT INTO ts_permisos (rol_id, menu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES (1, ?, 1, 1, 1, 1)",
      [menuCfg.insertId]
    );
    console.log('Menu pedidos_config creado id:', menuCfg.insertId);
  } else {
    console.log('Menu pedidos_config ya existe');
  }

  console.log('\nTodo listo.');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
