const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, proveedor_id, estado, fecha_desde, fecha_hasta } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (proveedor_id) {
      whereClause += ' AND c.proveedor_id = ?';
      params.push(proveedor_id);
    }
    if (estado) {
      whereClause += ' AND c.estado = ?';
      params.push(estado);
    }
    if (fecha_desde) {
      whereClause += ' AND DATE(c.fecha) >= ?';
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      whereClause += ' AND DATE(c.fecha) <= ?';
      params.push(fecha_hasta);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_compras c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT c.*, p.nombre as proveedor_nombre, u.nombre as usuario_nombre,
              s.nombre as sucursal_nombre
       FROM tt_compras c
       JOIN tt_proveedores p ON c.proveedor_id = p.id
       JOIN tt_usuarios u ON c.usuario_id = u.id
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       ${whereClause}
       ORDER BY c.id DESC
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

    const [compras] = await pool.execute(
      `SELECT c.*, p.nombre as proveedor_nombre, p.nit as proveedor_nit,
              u.nombre as usuario_nombre, s.nombre as sucursal_nombre
       FROM tt_compras c
       JOIN tt_proveedores p ON c.proveedor_id = p.id
       JOIN tt_usuarios u ON c.usuario_id = u.id
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       WHERE c.id = ?`,
      [id]
    );

    if (compras.length === 0) {
      return errorResponse(res, 'Compra no encontrada', 404);
    }

    const [detalle] = await pool.execute(
      `SELECT d.*, pr.nombre as producto_nombre, pr.codigo_barras
       FROM tt_compra_detalle d
       JOIN tt_productos pr ON d.producto_id = pr.id
       WHERE d.compra_id = ?`,
      [id]
    );

    return successResponse(res, { ...compras[0], detalle });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { proveedor_id, sucursal_id, observaciones, detalle = [] } = req.body;

    let total = 0;
    for (const item of detalle) {
      total += item.cantidad * item.costo;
    }

    const [compraResult] = await connection.execute(
      `INSERT INTO tt_compras (proveedor_id, usuario_id, sucursal_id, total, estado, observaciones)
       VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [proveedor_id, req.user.id, sucursal_id, total, observaciones]
    );

    const compraId = compraResult.insertId;

    for (const item of detalle) {
      const subtotal = item.cantidad * item.costo;
      await connection.execute(
        `INSERT INTO tt_compra_detalle (compra_id, producto_id, cantidad, costo, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [compraId, item.producto_id, item.cantidad, item.costo, subtotal]
      );
    }

    await connection.commit();
    return successResponse(res, { id: compraId }, 'Compra creada exitosamente', 201);

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const recibir = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [compra] = await connection.execute(
      'SELECT * FROM tt_compras WHERE id = ?',
      [id]
    );

    if (compra.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Compra no encontrada', 404);
    }

    if (compra[0].estado !== 'pendiente') {
      await connection.rollback();
      return errorResponse(res, 'La compra ya fue procesada', 400);
    }

    const [detalle] = await connection.execute(
      'SELECT * FROM tt_compra_detalle WHERE compra_id = ?',
      [id]
    );

    for (const item of detalle) {
      const [bodega] = await connection.execute(
        'SELECT id FROM tt_bodegas WHERE sucursal_id = ? LIMIT 1',
        [compra[0].sucursal_id]
      );

      if (bodega.length > 0) {
        const [existencia] = await connection.execute(
          'SELECT id FROM tt_existencias WHERE producto_id = ? AND bodega_id = ?',
          [item.producto_id, bodega[0].id]
        );

        if (existencia.length > 0) {
          await connection.execute(
            'UPDATE tt_existencias SET stock_actual = stock_actual + ? WHERE id = ?',
            [item.cantidad, existencia[0].id]
          );
        } else {
          await connection.execute(
            'INSERT INTO tt_existencias (producto_id, bodega_id, stock_actual) VALUES (?, ?, ?)',
            [item.producto_id, bodega[0].id, item.cantidad]
          );
        }

        await connection.execute(
          `INSERT INTO tt_movimientos_inventario (producto_id, bodega_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario_id)
           VALUES (?, ?, 'entrada', ?, 'Recepción de compra', ?, 'compra', ?)`,
          [item.producto_id, bodega[0].id, item.cantidad, id, req.user.id]
        );
      }

      await connection.execute(
        'UPDATE tt_productos SET costo = ? WHERE id = ?',
        [item.costo, item.producto_id]
      );
    }

    await connection.execute(
      "UPDATE tt_compras SET estado = 'recibida' WHERE id = ?",
      [id]
    );

    await connection.commit();
    return successResponse(res, null, 'Compra recibida exitosamente, stock actualizado');

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const anular = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE tt_compras SET estado = 'anulada' WHERE id = ?", [id]);
    return successResponse(res, null, 'Compra anulada exitosamente');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  recibir,
  anular
};

