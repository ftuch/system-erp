const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getExistencias = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, bodega_id, producto_id, stock_bajo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (bodega_id) {
      whereClause += ' AND e.bodega_id = ?';
      params.push(bodega_id);
    }
    if (producto_id) {
      whereClause += ' AND e.producto_id = ?';
      params.push(producto_id);
    }
    if (stock_bajo === 'true') {
      whereClause += ' AND e.stock_actual <= e.stock_minimo';
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_existencias e ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT e.*, p.nombre as producto_nombre, p.codigo_barras, p.tipo,
              b.nombre as bodega_nombre, s.nombre as sucursal_nombre
       FROM tt_existencias e
       JOIN tt_productos p ON e.producto_id = p.id
       JOIN tt_bodegas b ON e.bodega_id = b.id
       JOIN tc_sucursales s ON b.sucursal_id = s.id
       ${whereClause}
       ORDER BY p.nombre
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const getMovimientos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, producto_id, bodega_id, tipo, fecha_desde, fecha_hasta } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (producto_id) {
      whereClause += ' AND m.producto_id = ?';
      params.push(producto_id);
    }
    if (bodega_id) {
      whereClause += ' AND m.bodega_id = ?';
      params.push(bodega_id);
    }
    if (tipo) {
      whereClause += ' AND m.tipo = ?';
      params.push(tipo);
    }
    if (fecha_desde) {
      whereClause += ' AND DATE(m.fecha) >= ?';
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      whereClause += ' AND DATE(m.fecha) <= ?';
      params.push(fecha_hasta);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_movimientos_inventario m ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const [rows] = await pool.execute(
      `SELECT m.*, p.nombre as producto_nombre, b.nombre as bodega_nombre,
              u.nombre as usuario_nombre
       FROM tt_movimientos_inventario m
       JOIN tt_productos p ON m.producto_id = p.id
       JOIN tt_bodegas b ON m.bodega_id = b.id
       LEFT JOIN tt_usuarios u ON m.usuario_id = u.id
       ${whereClause}
       ORDER BY m.fecha DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const ajustarStock = async (req, res, next) => {
  try {
    const { producto_id, bodega_id, cantidad_nueva, motivo } = req.body;

    const [existencia] = await pool.execute(
      'SELECT stock_actual FROM tt_existencias WHERE producto_id = ? AND bodega_id = ?',
      [producto_id, bodega_id]
    );

    let stockAnterior = 0;
    if (existencia.length > 0) {
      stockAnterior = existencia[0].stock_actual;
      await pool.execute(
        'UPDATE tt_existencias SET stock_actual = ? WHERE producto_id = ? AND bodega_id = ?',
        [cantidad_nueva, producto_id, bodega_id]
      );
    } else {
      await pool.execute(
        'INSERT INTO tt_existencias (producto_id, bodega_id, stock_actual) VALUES (?, ?, ?)',
        [producto_id, bodega_id, cantidad_nueva]
      );
    }

    const diferencia = cantidad_nueva - stockAnterior;
    const tipo = diferencia >= 0 ? 'ajuste' : 'ajuste';

    await pool.execute(
      `INSERT INTO tt_movimientos_inventario (producto_id, bodega_id, tipo, cantidad, observaciones, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [producto_id, bodega_id, tipo, Math.abs(diferencia), motivo, req.user.id]
    );

    return successResponse(res, null, 'Stock ajustado exitosamente');
  } catch (error) {
    next(error);
  }
};

const traslado = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { producto_id, bodega_origen_id, bodega_destino_id, cantidad, motivo } = req.body;

    const [origen] = await connection.execute(
      'SELECT stock_actual FROM tt_existencias WHERE producto_id = ? AND bodega_id = ?',
      [producto_id, bodega_origen_id]
    );

    if (origen.length === 0 || origen[0].stock_actual < cantidad) {
      await connection.rollback();
      return errorResponse(res, 'Stock insuficiente en bodega origen', 400);
    }

    await connection.execute(
      'UPDATE tt_existencias SET stock_actual = stock_actual - ? WHERE producto_id = ? AND bodega_id = ?',
      [cantidad, producto_id, bodega_origen_id]
    );

    const [destino] = await connection.execute(
      'SELECT id FROM tt_existencias WHERE producto_id = ? AND bodega_id = ?',
      [producto_id, bodega_destino_id]
    );

    if (destino.length > 0) {
      await connection.execute(
        'UPDATE tt_existencias SET stock_actual = stock_actual + ? WHERE producto_id = ? AND bodega_id = ?',
        [cantidad, producto_id, bodega_destino_id]
      );
    } else {
      await connection.execute(
        'INSERT INTO tt_existencias (producto_id, bodega_id, stock_actual) VALUES (?, ?, ?)',
        [producto_id, bodega_destino_id, cantidad]
      );
    }

    await connection.execute(
      `INSERT INTO tt_movimientos_inventario (producto_id, bodega_id, tipo, cantidad, observaciones, usuario_id)
       VALUES (?, ?, 'traslado', ?, ?, ?)`,
      [producto_id, bodega_origen_id, cantidad, `Traslado a bodega ${bodega_destino_id}: ${motivo}`, req.user.id]
    );

    await connection.commit();
    return successResponse(res, null, 'Traslado realizado exitosamente');

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getExistencias,
  getMovimientos,
  ajustarStock,
  traslado
};

