const mysql = require('mysql2/promise');

async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    multipleStatements: true
  });

  console.log('✅ Conectado a Railway MySQL');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tc_categorias (id int NOT NULL AUTO_INCREMENT, nombre varchar(100) NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tc_categorias VALUES (1,'Tienda'),(2,'Farmacia'),(3,'General');`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tc_menus (id int NOT NULL AUTO_INCREMENT, nombre varchar(100) NOT NULL, icono varchar(50) DEFAULT NULL, ruta varchar(150) DEFAULT NULL, orden int DEFAULT 0, padre_id int DEFAULT NULL, estado tinyint(1) DEFAULT 1, codigo varchar(50) DEFAULT NULL, PRIMARY KEY (id), KEY padre_id (padre_id), CONSTRAINT tc_menus_ibfk_1 FOREIGN KEY (padre_id) REFERENCES tc_menus (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`
    INSERT IGNORE INTO tc_menus VALUES
    (1,'Dashboard','dashboard','/dashboard',1,NULL,1,'dashboard'),
    (6,'Inventario','inventory','/inventario',3,NULL,1,'inventario'),
    (7,'Kardex','list_alt','/kardex',2,6,0,'kardex'),
    (8,'Bodegas','warehouse','/bodegas',3,6,0,'bodegas'),
    (31,'Sucursales','store','/sucursales',2,NULL,1,'sucursales'),
    (37,'Configuración','settings','/configuracion',9,NULL,1,'configuracion'),
    (38,'Usuarios','manage_accounts','/usuarios',4,NULL,1,'usuarios'),
    (39,'Roles','admin_panel_settings','/roles',5,NULL,1,'roles'),
    (42,'Clientes','people','/clientes',6,NULL,1,'clientes'),
    (43,'Proveedores','local_shipping','/proveedores',7,NULL,1,'proveedores'),
    (46,'Caja','account_balance_wallet','/caja',8,NULL,1,'cajas'),
    (49,'Pedidos','shopping_cart','/pedidos',5,NULL,1,'pedidos'),
    (50,'Flujo de Pedidos','tune','/pedidos/config',1,37,1,'pedidos_config'),
    (51,'Productos','category','/productos',1,6,1,'productos'),
    (52,'Ventas','point_of_sale','/ventas',2,NULL,1,'ventas');
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tc_pedidos_config (id int NOT NULL AUTO_INCREMENT, requiere_aprobacion tinyint(1) DEFAULT 1, permite_parcial tinyint(1) DEFAULT 1, permite_bonificacion tinyint(1) DEFAULT 1, flujo varchar(50) DEFAULT 'despacho', created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, activo tinyint(1) DEFAULT 1, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tc_pedidos_config VALUES (1,1,1,1,'despacho',NULL,NULL,1);`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tc_series_documentos (id int NOT NULL AUTO_INCREMENT, sucursal_id int DEFAULT NULL, tipo_documento varchar(50) DEFAULT NULL, serie varchar(20) DEFAULT NULL, ultimo_numero int DEFAULT 0, activo tinyint(1) DEFAULT 1, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tc_sucursales (id int NOT NULL AUTO_INCREMENT, nombre varchar(100) NOT NULL, direccion varchar(200) DEFAULT NULL, telefono varchar(20) DEFAULT NULL, activo tinyint(1) DEFAULT 1, created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tc_sucursales VALUES (1,'Central','Dirección Principal','00000000',1,NOW());`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS ts_roles (id int NOT NULL AUTO_INCREMENT, nombre varchar(100) NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO ts_roles VALUES (1,'Administrador'),(2,'Cajero'),(3,'Bodega'),(4,'Rutero');`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS ts_permisos (id int NOT NULL AUTO_INCREMENT, rol_id int NOT NULL, menu_id int NOT NULL, puede_ver tinyint(1) DEFAULT 0, puede_crear tinyint(1) DEFAULT 0, puede_editar tinyint(1) DEFAULT 0, puede_eliminar tinyint(1) DEFAULT 0, PRIMARY KEY (id), UNIQUE KEY rol_menu (rol_id,menu_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`
    INSERT IGNORE INTO ts_permisos (rol_id,menu_id,puede_ver,puede_crear,puede_editar,puede_eliminar) VALUES
    (1,1,1,1,1,1),(1,6,1,1,1,1),(1,7,1,1,1,1),(1,8,1,1,1,1),(1,31,1,1,1,1),(1,37,1,1,1,1),(1,38,1,1,1,1),(1,39,1,1,1,1),(1,42,1,1,1,1),(1,43,1,1,1,1),(1,46,1,1,1,1),(1,49,1,1,1,1),(1,50,1,1,1,1),(1,51,1,1,1,1),(1,52,1,1,1,1),
    (2,1,1,0,0,0),(2,42,1,1,0,0),(2,46,1,1,1,0),(2,51,1,0,0,0),(2,52,1,1,0,0),
    (3,1,1,0,0,0),(3,6,1,1,1,0),(3,49,1,1,1,0),(3,51,1,1,1,0),
    (4,1,1,0,0,0),(4,49,1,1,0,0),(4,51,1,0,0,0);
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tt_bodegas (id int NOT NULL AUTO_INCREMENT, sucursal_id int DEFAULT NULL, nombre varchar(100) NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tt_bodegas VALUES (1,1,'Bodega Principal');`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tt_cajas (id int NOT NULL AUTO_INCREMENT, sucursal_id int DEFAULT NULL, nombre varchar(100) NOT NULL, estado enum('abierta','cerrada') DEFAULT 'cerrada', saldo_inicial decimal(10,2) DEFAULT 0.00, saldo_actual decimal(10,2) DEFAULT 0.00, usuario_apertura int DEFAULT NULL, fecha_apertura timestamp NULL DEFAULT NULL, usuario_cierre int DEFAULT NULL, fecha_cierre timestamp NULL DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tt_cajas VALUES (1,1,'Caja 1','cerrada',0.00,0.00,NULL,NULL,NULL,NULL);`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_arqueos_caja (id int NOT NULL AUTO_INCREMENT, caja_id int DEFAULT NULL, usuario_id int DEFAULT NULL, tipo enum('apertura','cierre') DEFAULT NULL, monto_declarado decimal(10,2) DEFAULT NULL, monto_sistema decimal(10,2) DEFAULT NULL, diferencia decimal(10,2) DEFAULT NULL, observaciones text, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_compra_detalle (id int NOT NULL AUTO_INCREMENT, compra_id int DEFAULT NULL, producto_id int DEFAULT NULL, cantidad int DEFAULT NULL, precio decimal(10,2) DEFAULT NULL, subtotal decimal(10,2) DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_compras (id int NOT NULL AUTO_INCREMENT, proveedor_id int DEFAULT NULL, sucursal_id int DEFAULT NULL, usuario_id int DEFAULT NULL, total decimal(10,2) DEFAULT NULL, estado varchar(50) DEFAULT 'pendiente', observaciones text, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_consultas (id int NOT NULL AUTO_INCREMENT, paciente_id int DEFAULT NULL, medico_id int DEFAULT NULL, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, diagnostico text, tratamiento text, costo decimal(10,2) DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_documentos_fiscales (id int NOT NULL AUTO_INCREMENT, venta_id int DEFAULT NULL, tipo varchar(50) DEFAULT NULL, numero varchar(100) DEFAULT NULL, serie varchar(50) DEFAULT NULL, uuid varchar(100) DEFAULT NULL, estado varchar(50) DEFAULT NULL, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, xml_request longtext, xml_response longtext, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_existencias (id int NOT NULL AUTO_INCREMENT, producto_id int DEFAULT NULL, bodega_id int DEFAULT NULL, stock_actual int DEFAULT 0, stock_minimo int DEFAULT 0, stock_maximo int DEFAULT 0, PRIMARY KEY (id), UNIQUE KEY prod_bodega (producto_id,bodega_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_movimientos_caja (id int NOT NULL AUTO_INCREMENT, caja_id int DEFAULT NULL, usuario_id int DEFAULT NULL, tipo enum('ingreso','egreso') DEFAULT NULL, concepto varchar(100) DEFAULT NULL, monto decimal(10,2) DEFAULT NULL, referencia varchar(100) DEFAULT NULL, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_movimientos_inventario (id int NOT NULL AUTO_INCREMENT, producto_id int DEFAULT NULL, bodega_id int DEFAULT NULL, tipo enum('entrada','salida','ajuste') DEFAULT NULL, cantidad int DEFAULT NULL, referencia varchar(100) DEFAULT NULL, usuario_id int DEFAULT NULL, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, observaciones text, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_pagos (id int NOT NULL AUTO_INCREMENT, venta_id int DEFAULT NULL, monto decimal(10,2) DEFAULT NULL, metodo enum('efectivo','tarjeta','transferencia') DEFAULT NULL, referencia varchar(100) DEFAULT NULL, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_pedido_detalle (id int NOT NULL AUTO_INCREMENT, pedido_id int DEFAULT NULL, producto_id int DEFAULT NULL, proveedor_id int DEFAULT NULL, cantidad int DEFAULT NULL, cantidad_recibida int DEFAULT NULL, bonificacion int DEFAULT 0, precio_unitario decimal(10,2) DEFAULT 0.00, subtotal decimal(10,2) DEFAULT 0.00, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_pedidos (id int NOT NULL AUTO_INCREMENT, sucursal_id int DEFAULT NULL, usuario_id int DEFAULT NULL, proveedor_id int DEFAULT NULL, estado enum('pendiente','aprobado','rechazado','recibido','recibido_parcial','cancelado') DEFAULT 'pendiente', observaciones text, comentario_revision text, observaciones_recepcion text, fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, fecha_aprobacion timestamp NULL DEFAULT NULL, fecha_recepcion timestamp NULL DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tt_personas (id int NOT NULL AUTO_INCREMENT, nombre varchar(150) NOT NULL, nit varchar(20) DEFAULT NULL, telefono varchar(20) DEFAULT NULL, direccion varchar(200) DEFAULT NULL, tipo enum('cliente','proveedor','empleado','paciente','medico') DEFAULT 'cliente', email varchar(100) DEFAULT NULL, created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tt_personas VALUES (1,'Consumidor Final','CF',NULL,NULL,'cliente',NULL,NOW());`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_productos (id int NOT NULL AUTO_INCREMENT, nombre varchar(150) NOT NULL, tipo enum('producto','servicio','medicamento') DEFAULT 'producto', categoria_id int DEFAULT NULL, codigo_barras varchar(100) DEFAULT NULL, unidad varchar(50) DEFAULT NULL, precio decimal(10,2) DEFAULT 0.00, costo decimal(10,2) DEFAULT 0.00, requiere_receta tinyint(1) DEFAULT 0, activo tinyint(1) DEFAULT 1, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_proveedores (id int NOT NULL AUTO_INCREMENT, nombre varchar(150) NOT NULL, nit varchar(20) DEFAULT NULL, telefono varchar(20) DEFAULT NULL, email varchar(100) DEFAULT NULL, direccion varchar(200) DEFAULT NULL, contacto varchar(100) DEFAULT NULL, activo tinyint(1) DEFAULT 1, created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_recetas (id int NOT NULL AUTO_INCREMENT, consulta_id int DEFAULT NULL, producto_id int DEFAULT NULL, cantidad int DEFAULT NULL, indicaciones text, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_usuario_roles (id int NOT NULL AUTO_INCREMENT, usuario_id int DEFAULT NULL, rol_id int DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tt_usuarios (id int NOT NULL AUTO_INCREMENT, nombre varchar(150) NOT NULL, usuario varchar(100) NOT NULL, password varchar(255) NOT NULL, rol_id int DEFAULT NULL, sucursal_id int DEFAULT NULL, activo tinyint(1) DEFAULT 1, created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY usuario (usuario)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.execute(`INSERT IGNORE INTO tt_usuarios VALUES (1,'Administrador','admin','$2a$10$mUmwKR73xXTvJHbkDcUdEesLEhunDOA.3.CazPXYZA3mwcLqKsufO',1,1,1,NOW());`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_venta_detalle (id int NOT NULL AUTO_INCREMENT, venta_id int DEFAULT NULL, producto_id int DEFAULT NULL, cantidad int DEFAULT NULL, precio decimal(10,2) DEFAULT NULL, subtotal decimal(10,2) DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.execute(`CREATE TABLE IF NOT EXISTS tt_ventas (id int NOT NULL AUTO_INCREMENT, persona_id int DEFAULT NULL, usuario_id int DEFAULT NULL, sucursal_id int DEFAULT NULL, tipo enum('tienda','farmacia','clinica') DEFAULT NULL, total decimal(10,2) DEFAULT NULL, estado enum('pendiente','pagado','anulado') DEFAULT 'pendiente', fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP, correlativo varchar(50) DEFAULT NULL, caja_id int DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Agregar columnas faltantes
  try { await conn.execute(`ALTER TABLE tt_usuarios ADD COLUMN estado tinyint(1) DEFAULT 1`); } catch(e) {}
  await conn.execute(`UPDATE tt_usuarios SET estado=1 WHERE estado IS NULL`);
  try { await conn.execute(`ALTER TABLE tt_productos ADD COLUMN estado tinyint(1) DEFAULT 1`); } catch(e) {}

  const [tables] = await conn.execute('SHOW TABLES');
  console.log(`✅ ${tables.length} tablas creadas exitosamente`);
  await conn.end();
  process.exit(0);
}

setup().catch(e => { console.error('❌', e.message); process.exit(1); });
