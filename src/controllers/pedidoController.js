const pool = require('../../config/database').pool;
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ─── helpers ────────────────────────────────────────────────────────────────

const getConfig = async () => {
  const [rows] = await pool.execute('SELECT * FROM tc_pedidos_config WHERE id = 1');
  return rows[0] || {
    requiere_revision: 1, requiere_despacho: 1,
    descuenta_inventario: 0, descuenta_en: 'despacho',
    rol_revisor_id: null, rol_despachador_id: null,
    permite_despacho_parcial: 0
  };
};

const generarNumero = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM tt_pedidos');
  const n = (rows[0].total + 1).toString().padStart(5, '0');
  return `PED-${n}`;
};

// ─── getConfig (endpoint) ────────────────────────────────────────────────────

const obtenerConfig = async (req, res, next) => {
  try {
    const cfg = await getConfig();
    return successResponse(res, cfg, 'Configuración obtenida');
  } catch (e) { next(e); }
};

const actualizarConfig = async (req, res, next) => {
  try {
    const {
      requiere_revision, requiere_despacho, descuenta_inventario,
      descuenta_en, rol_revisor_id, rol_despachador_id, permite_despacho_parcial
    } = req.body;

    await pool.execute(
      `UPDATE tc_pedidos_config SET
        requiere_revision = ?, requiere_despacho = ?, descuenta_inventario = ?,
        descuenta_en = ?, rol_revisor_id = ?, rol_despachador_id = ?,
        permite_despacho_parcial = ?
       WHERE id = 1`,
      [
        requiere_revision ? 1 : 0,
        requiere_despacho ? 1 : 0,
        descuenta_inventario ? 1 : 0,
        descuenta_en || 'despacho',
        rol_revisor_id || null,
        rol_despachador_id || null,
        permite_despacho_parcial ? 1 : 0
      ]
    );
    return successResponse(res, null, 'Configuración actualizada');
  } catch (e) { next(e); }
};

// ─── getAll ──────────────────────────────────────────────────────────────────

const getAll = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { estado, search } = req.query;

    let where = '1=1';
    const params = [];

    if (estado) { where += ' AND p.estado = ?'; params.push(estado); }
    if (search)  { where += ' AND (p.numero LIKE ? OR s.nombre LIKE ? OR u.nombre LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const [total] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_pedidos p
       JOIN tc_sucursales s ON p.sucursal_id = s.id
       JOIN tt_usuarios u ON p.usuario_id = u.id
       WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT p.*,
              s.nombre  as sucursal_nombre,
              u.nombre  as usuario_nombre,
              r.nombre  as revisor_nombre,
              d.nombre  as despachador_nombre
       FROM tt_pedidos p
       JOIN tc_sucursales s ON p.sucursal_id = s.id
       JOIN tt_usuarios u   ON p.usuario_id  = u.id
       LEFT JOIN tt_usuarios r ON p.revisor_id = r.id
       LEFT JOIN tt_usuarios d ON p.despachador_id = d.id
       WHERE ${where}
       ORDER BY p.fecha_pedido DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return paginatedResponse(res, rows, { page, limit, total: total[0].total });
  } catch (e) { next(e); }
};

// ─── getById ─────────────────────────────────────────────────────────────────

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT p.*,
              s.nombre as sucursal_nombre,
              u.nombre as usuario_nombre,
              r.nombre as revisor_nombre,
              d.nombre as despachador_nombre
       FROM tt_pedidos p
       JOIN tc_sucursales s ON p.sucursal_id = s.id
       JOIN tt_usuarios u   ON p.usuario_id  = u.id
       LEFT JOIN tt_usuarios r ON p.revisor_id = r.id
       LEFT JOIN tt_usuarios d ON p.despachador_id = d.id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) return errorResponse(res, 'Pedido no encontrado', 404);

    const [detalle] = await pool.execute(
      `SELECT pd.*, pr.nombre as producto_nombre, pr.codigo_barras, pr.unidad
       FROM tt_pedido_detalle pd
       JOIN tt_productos pr ON pd.producto_id = pr.id
       WHERE pd.pedido_id = ?`,
      [id]
    );

    return successResponse(res, { ...rows[0], detalle });
  } catch (e) { next(e); }
};

// ─── create ──────────────────────────────────────────────────────────────────

const create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { sucursal_id, observaciones, detalle } = req.body;

    if (!detalle || !detalle.length)
      return errorResponse(res, 'El pedido debe tener al menos un producto');

    const numero = await generarNumero();
    const cfg = await getConfig();

    // Si no requiere revisión el estado inicial salta directo
    const estadoInicial = cfg.requiere_revision ? 'pendiente' : 'aprobado';

    let total = 0;
    for (const item of detalle) {
      total += (item.cantidad * (item.precio_unitario || 0));
    }

    const [result] = await conn.execute(
      `INSERT INTO tt_pedidos (numero, sucursal_id, usuario_id, estado, observaciones, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [numero, sucursal_id || req.user.sucursal_id, req.user.id, estadoInicial, observaciones || null, total]
    );
    const pedidoId = result.insertId;

    for (const item of detalle) {
      const sub = item.cantidad * (item.precio_unitario || 0);
      await conn.execute(
        `INSERT INTO tt_pedido_detalle (pedido_id, producto_id, descripcion, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedidoId, item.producto_id, item.descripcion || null, item.cantidad, item.precio_unitario || 0, sub]
      );
    }

    // Si no requiere revisión NI recepción → ingresar inventario inmediatamente
    if (!cfg.requiere_revision && !cfg.requiere_despacho && cfg.descuenta_inventario) {
      await ingresarInventario(conn, pedidoId, detalle, req.user.id);
      await conn.execute(
        `UPDATE tt_pedidos SET estado='recibido', despachador_id=?, fecha_despacho=NOW() WHERE id=?`,
        [req.user.id, pedidoId]
      );
    }

    await conn.commit();
    return successResponse(res, { id: pedidoId, numero }, 'Pedido creado', 201);
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
};

// ─── aprobar ─────────────────────────────────────────────────────────────────

const aprobar = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { comentario_revision } = req.body;
    const cfg = await getConfig();

    const [rows] = await conn.execute('SELECT * FROM tt_pedidos WHERE id = ?', [id]);
    if (!rows.length) return errorResponse(res, 'Pedido no encontrado', 404);
    const pedido = rows[0];

    if (pedido.estado !== 'pendiente')
      return errorResponse(res, `No se puede aprobar un pedido en estado "${pedido.estado}"`);

    // Determinar siguiente estado
    const siguienteEstado = cfg.requiere_despacho ? 'aprobado' : 'recibido';

    await conn.execute(
      `UPDATE tt_pedidos SET estado=?, revisor_id=?, comentario_revision=?, fecha_revision=NOW() WHERE id=?`,
      [siguienteEstado, req.user.id, comentario_revision || null, id]
    );

    // Si se aprueba e ingresa inventario en este paso
    if (cfg.descuenta_inventario && cfg.descuenta_en === 'aprobacion') {
      const [detalle] = await conn.execute('SELECT * FROM tt_pedido_detalle WHERE pedido_id = ?', [id]);
      await ingresarInventario(conn, id, detalle, req.user.id);
    }

    if (!cfg.requiere_despacho) {
      await conn.execute(
        `UPDATE tt_pedidos SET despachador_id=?, fecha_despacho=NOW() WHERE id=?`,
        [req.user.id, id]
      );
    }

    await conn.commit();
    return successResponse(res, null, cfg.requiere_despacho ? 'Pedido aprobado' : 'Pedido aprobado y recibido');
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
};

// ─── rechazar ────────────────────────────────────────────────────────────────

const rechazar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comentario_revision } = req.body;

    const [rows] = await pool.execute('SELECT estado FROM tt_pedidos WHERE id = ?', [id]);
    if (!rows.length) return errorResponse(res, 'Pedido no encontrado', 404);
    if (rows[0].estado !== 'pendiente')
      return errorResponse(res, `No se puede rechazar un pedido en estado "${rows[0].estado}"`);

    await pool.execute(
      `UPDATE tt_pedidos SET estado='rechazado', revisor_id=?, comentario_revision=?, fecha_revision=NOW() WHERE id=?`,
      [req.user.id, comentario_revision || null, id]
    );
    return successResponse(res, null, 'Pedido rechazado');
  } catch (e) { next(e); }
};

// ─── recibir ─────────────────────────────────────────────────────────────────
// Marca el pedido como recibido e ingresa el stock al inventario (ENTRADA)
// Body opcional: { observaciones_recepcion, items: [{ detalle_id, cantidad_recibida, bonificacion }] }

const recibir = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { observaciones_recepcion, items: itemsRecibidos } = req.body || {};
    const cfg = await getConfig();

    const [rows] = await conn.execute('SELECT * FROM tt_pedidos WHERE id = ?', [id]);
    if (!rows.length) return errorResponse(res, 'Pedido no encontrado', 404);
    const pedido = rows[0];

    const estadoRequerido = cfg.requiere_revision ? 'aprobado' : 'pendiente';
    if (pedido.estado !== estadoRequerido)
      return errorResponse(res, `El pedido debe estar en estado "${estadoRequerido}" para marcar como recibido`);

    const [detalle] = await conn.execute('SELECT * FROM tt_pedido_detalle WHERE pedido_id = ?', [id]);

    // Construir mapa de cantidades recibidas y bonificaciones por detalle_id
    const mapaItems = {};
    if (itemsRecibidos && itemsRecibidos.length) {
      for (const i of itemsRecibidos) {
        mapaItems[i.detalle_id] = {
          cantidad_recibida: parseFloat(i.cantidad_recibida) || 0,
          bonificacion: parseFloat(i.bonificacion) || 0
        };
      }
    }

    // Preparar detalle enriquecido con cantidades reales a ingresar
    const detalleConRecepcion = detalle.map(item => {
      const override = mapaItems[item.id];
      const cantidadRecibida = override ? override.cantidad_recibida : item.cantidad;
      const bonificacion     = override ? override.bonificacion      : 0;
      return { ...item, cantidadRecibida, bonificacion };
    });

    // Actualizar tt_pedido_detalle con lo realmente recibido
    for (const item of detalleConRecepcion) {
      await conn.execute(
        `UPDATE tt_pedido_detalle
         SET cantidad_recibida = ?, bonificacion = ?
         WHERE id = ?`,
        [item.cantidadRecibida, item.bonificacion, item.id]
      );
    }

    // Ingresar al inventario: cantidad recibida + bonificación
    await ingresarInventarioConBonificacion(conn, id, detalleConRecepcion, req.user.id);

    // Determinar si es recepción total o parcial
    const esParcial = detalleConRecepcion.some(i => i.cantidadRecibida < i.cantidad);
    const estadoFinal = esParcial ? 'recibido_parcial' : 'recibido';

    await conn.execute(
      `UPDATE tt_pedidos SET estado=?, despachador_id=?, fecha_despacho=NOW(),
       observaciones_recepcion=? WHERE id=?`,
      [estadoFinal, req.user.id, observaciones_recepcion || null, id]
    );

    await conn.commit();
    const msg = esParcial
      ? 'Recepción parcial registrada — stock actualizado con cantidades recibidas'
      : 'Pedido recibido completo — stock actualizado exitosamente';
    return successResponse(res, { parcial: esParcial }, msg);
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
};

// ─── cancelar ────────────────────────────────────────────────────────────────

const cancelar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT estado FROM tt_pedidos WHERE id = ?', [id]);
    if (!rows.length) return errorResponse(res, 'Pedido no encontrado', 404);
    if (['recibido', 'cancelado'].includes(rows[0].estado))
      return errorResponse(res, 'No se puede cancelar este pedido');

    await pool.execute('UPDATE tt_pedidos SET estado=? WHERE id=?', ['cancelado', id]);
    return successResponse(res, null, 'Pedido cancelado');
  } catch (e) { next(e); }
};

// ─── helper: ingresar inventario con bonificación ────────────────────────────
// Soporta cantidad_recibida parcial y bonificacion (unidades extra del proveedor)

const ingresarInventarioConBonificacion = async (conn, pedidoId, detalle, usuarioId) => {
  for (const item of detalle) {
    const cantidadRecibida = item.cantidadRecibida ?? item.cantidad;
    const bonificacion     = item.bonificacion ?? 0;
    const totalIngresar    = cantidadRecibida + bonificacion;

    if (totalIngresar <= 0) continue;

    // Buscar bodega del producto, o la primera bodega disponible
    let [bodegas] = await conn.execute(
      `SELECT bodega_id FROM tt_existencias WHERE producto_id = ? ORDER BY bodega_id ASC LIMIT 1`,
      [item.producto_id]
    );
    if (bodegas.length === 0) {
      const [tb] = await conn.execute('SELECT id as bodega_id FROM tt_bodegas ORDER BY id ASC LIMIT 1');
      bodegas = tb;
    }
    if (bodegas.length === 0) continue;

    const bodegaId = bodegas[0].bodega_id;

    // Sumar stock total (cantidad recibida + bonificación)
    await conn.execute(
      `INSERT INTO tt_existencias (producto_id, bodega_id, stock_actual, stock_minimo, stock_maximo)
       VALUES (?, ?, ?, 0, 0)
       ON DUPLICATE KEY UPDATE stock_actual = stock_actual + ?`,
      [item.producto_id, bodegaId, totalIngresar, totalIngresar]
    );

    // Movimiento por cantidad recibida
    if (cantidadRecibida > 0) {
      await conn.execute(
        `INSERT INTO tt_movimientos_inventario
          (producto_id, bodega_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario_id)
         VALUES (?, ?, 'entrada', ?, 'Recepción de pedido', ?, 'pedido', ?)`,
        [item.producto_id, bodegaId, cantidadRecibida, pedidoId, usuarioId]
      );
    }

    // Movimiento separado por bonificación
    if (bonificacion > 0) {
      await conn.execute(
        `INSERT INTO tt_movimientos_inventario
          (producto_id, bodega_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario_id)
         VALUES (?, ?, 'entrada', ?, 'Bonificación de pedido', ?, 'pedido', ?)`,
        [item.producto_id, bodegaId, bonificacion, pedidoId, usuarioId]
      );
    }
  }
};

// Alias para compatibilidad con llamadas existentes (create/aprobar sin recepción parcial)
const ingresarInventario = (conn, pedidoId, detalle, usuarioId) =>
  ingresarInventarioConBonificacion(conn, pedidoId, detalle, usuarioId);

module.exports = {
  obtenerConfig, actualizarConfig,
  getAll, getById,
  create, aprobar, rechazar, recibir, cancelar
};
