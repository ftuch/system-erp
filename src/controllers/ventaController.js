const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', estado, fecha_desde, fecha_hasta } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (v.correlativo LIKE ? OR p.nombre LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (estado) {
      whereClause += ' AND v.estado = ?';
      params.push(estado);
    }
    if (fecha_desde) {
      whereClause += ' AND DATE(v.fecha) >= ?';
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      whereClause += ' AND DATE(v.fecha) <= ?';
      params.push(fecha_hasta);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_ventas v 
       LEFT JOIN tt_personas p ON v.persona_id = p.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT v.*, p.nombre as cliente_nombre, u.nombre as usuario_nombre,
              s.nombre as sucursal_nombre, c.nombre as caja_nombre
       FROM tt_ventas v
       LEFT JOIN tt_personas p ON v.persona_id = p.id
       LEFT JOIN tt_usuarios u ON v.usuario_id = u.id
       LEFT JOIN tc_sucursales s ON v.sucursal_id = s.id
       LEFT JOIN tt_cajas c ON v.caja_id = c.id
       ${whereClause}
       ORDER BY v.id DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [ventas] = await pool.execute(
      `SELECT v.*, p.nombre as cliente_nombre, p.nit as cliente_nit,
              u.nombre as usuario_nombre, s.nombre as sucursal_nombre
       FROM tt_ventas v
       LEFT JOIN tt_personas p ON v.persona_id = p.id
       LEFT JOIN tt_usuarios u ON v.usuario_id = u.id
       LEFT JOIN tc_sucursales s ON v.sucursal_id = s.id
       WHERE v.id = ?`,
      [id]
    );

    if (ventas.length === 0) {
      return errorResponse(res, 'Venta no encontrada', 404);
    }

    const [detalle] = await pool.execute(
      `SELECT d.*, p.nombre as producto_nombre, p.codigo_barras
       FROM tt_venta_detalle d
       JOIN tt_productos p ON d.producto_id = p.id
       WHERE d.venta_id = ?`,
      [id]
    );

    const [pagos] = await pool.execute(
      'SELECT * FROM tt_pagos WHERE venta_id = ?',
      [id]
    );

    return successResponse(res, { ...ventas[0], detalle, pagos });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      persona_id, tipo = 'tienda', total, detalle = [], 
      pagos = [], caja_id, sucursal_id 
    } = req.body;

    const ventaSucursalId = sucursal_id || req.user.sucursal_id;

    const [correlativoResult] = await connection.execute(
      'SELECT MAX(CAST(correlativo AS UNSIGNED)) as max_corr FROM tt_ventas WHERE sucursal_id = ?',
      [ventaSucursalId]
    );
    const correlativo = (correlativoResult[0].max_corr || 0) + 1;

    const [ventaResult] = await connection.execute(
      `INSERT INTO tt_ventas (persona_id, usuario_id, sucursal_id, caja_id, tipo, total, estado, correlativo)
       VALUES (?, ?, ?, ?, ?, ?, 'pagado', ?)`,
      [persona_id, req.user.id, ventaSucursalId, caja_id, tipo, total, correlativo]
    );

    const ventaId = ventaResult.insertId;

    for (const item of detalle) {
      await connection.execute(
        `INSERT INTO tt_venta_detalle (venta_id, producto_id, cantidad, precio, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, item.producto_id, item.cantidad, item.precio, item.subtotal]
      );

      await connection.execute(
        `UPDATE tt_existencias e
         JOIN tt_bodegas b ON e.bodega_id = b.id
         SET e.stock_actual = e.stock_actual - ?
         WHERE e.producto_id = ? AND b.sucursal_id = ?`,
        [item.cantidad, item.producto_id, ventaSucursalId]
      );

      const [bodega] = await connection.execute(
        'SELECT id FROM tt_bodegas WHERE sucursal_id = ? LIMIT 1',
        [ventaSucursalId]
      );

      if (bodega.length > 0) {
        await connection.execute(
          `INSERT INTO tt_movimientos_inventario (producto_id, bodega_id, tipo, cantidad, observaciones, usuario_id)
           VALUES (?, ?, 'salida', ?, 'Venta', ?)`,
          [item.producto_id, bodega[0].id, item.cantidad, req.user.id]
        );
      }
    }

    for (const pago of pagos) {
      await connection.execute(
        `INSERT INTO tt_pagos (venta_id, monto, metodo, referencia)
         VALUES (?, ?, ?, ?)`,
        [ventaId, pago.monto, pago.metodo, pago.referencia]
      );
    }

    await connection.execute(
      `INSERT INTO tt_movimientos_caja (caja_id, usuario_id, tipo, concepto, monto)
       VALUES (?, ?, 'ingreso', ?, ?)`,
      [caja_id, req.user.id, `Venta #${correlativo}`, total]
    );

    await connection.commit();
    return successResponse(res, { id: ventaId, correlativo }, 'Venta creada exitosamente', 201);

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const anular = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { motivo } = req.body;

    const [venta] = await connection.execute(
      'SELECT * FROM tt_ventas WHERE id = ?',
      [id]
    );

    if (venta.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Venta no encontrada', 404);
    }

    if (venta[0].estado === 'anulado') {
      await connection.rollback();
      return errorResponse(res, 'La venta ya está anulada', 400);
    }

    const [detalle] = await connection.execute(
      'SELECT * FROM tt_venta_detalle WHERE venta_id = ?',
      [id]
    );

    for (const item of detalle) {
      const [bodega] = await connection.execute(
        'SELECT id FROM tt_bodegas WHERE sucursal_id = ? LIMIT 1',
        [venta[0].sucursal_id]
      );

      if (bodega.length > 0) {
        await connection.execute(
          `UPDATE tt_existencias SET stock_actual = stock_actual + ?
           WHERE producto_id = ? AND bodega_id = ?`,
          [item.cantidad, item.producto_id, bodega[0].id]
        );

        await connection.execute(
          `INSERT INTO tt_movimientos_inventario (producto_id, bodega_id, tipo, cantidad, observaciones, usuario_id)
           VALUES (?, ?, 'entrada', ?, ?, ?)`,
          [item.producto_id, bodega[0].id, item.cantidad, `Anulación: ${motivo}`, req.user.id]
        );
      }
    }

    await connection.execute(
      "UPDATE tt_ventas SET estado = 'anulado' WHERE id = ?",
      [id]
    );

    await connection.commit();
    return successResponse(res, null, 'Venta anulada exitosamente');

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAll,
  getById,
  create,
  anular
};

