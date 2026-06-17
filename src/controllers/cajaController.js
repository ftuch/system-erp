const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sucursal_id, estado } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (sucursal_id) {
      whereClause += ' AND c.sucursal_id = ?';
      params.push(sucursal_id);
    }
    if (estado) {
      whereClause += ' AND c.estado = ?';
      params.push(estado);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_cajas c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT c.*, s.nombre as sucursal_nombre, u.nombre as usuario_nombre,
              (SELECT SUM(monto) FROM tt_movimientos_caja WHERE caja_id = c.id AND tipo = 'ingreso') as total_ingresos,
              (SELECT SUM(monto) FROM tt_movimientos_caja WHERE caja_id = c.id AND tipo = 'egreso') as total_egresos
       FROM tt_cajas c
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       JOIN tt_usuarios u ON c.usuario_id = u.id
       ${whereClause}
       ORDER BY c.fecha_apertura DESC
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

    const [cajas] = await pool.execute(
      `SELECT c.*, s.nombre as sucursal_nombre, u.nombre as usuario_nombre
       FROM tt_cajas c
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       JOIN tt_usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (cajas.length === 0) {
      return errorResponse(res, 'Caja no encontrada', 404);
    }

    const [movimientos] = await pool.execute(
      `SELECT m.*, u.nombre as usuario_nombre
       FROM tt_movimientos_caja m
       LEFT JOIN tt_usuarios u ON m.usuario_id = u.id
       WHERE m.caja_id = ?
       ORDER BY m.fecha DESC`,
      [id]
    );

    const [arqueos] = await pool.execute(
      `SELECT a.*, u.nombre as usuario_nombre
       FROM tt_arqueos_caja a
       JOIN tt_usuarios u ON a.usuario_id = u.id
       WHERE a.caja_id = ?
       ORDER BY a.fecha DESC`,
      [id]
    );

    return successResponse(res, { ...cajas[0], movimientos, arqueos });
  } catch (error) {
    next(error);
  }
};

const abrir = async (req, res, next) => {
  try {
    const { sucursal_id, nombre, monto_inicial } = req.body;

    const [cajasAbiertas] = await pool.execute(
      'SELECT id FROM tt_cajas WHERE sucursal_id = ? AND estado = "abierta"',
      [sucursal_id]
    );

    if (cajasAbiertas.length > 0) {
      return errorResponse(res, 'Ya existe una caja abierta para esta sucursal', 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO tt_cajas (sucursal_id, usuario_id, nombre, estado, monto_inicial)
       VALUES (?, ?, ?, 'abierta', ?)`,
      [sucursal_id, req.user.id, nombre || `Caja ${new Date().toLocaleDateString()}`, monto_inicial]
    );

    return successResponse(res, { id: result.insertId }, 'Caja abierta exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const cerrar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { monto_cierre } = req.body;

    const [caja] = await pool.execute(
      'SELECT * FROM tt_cajas WHERE id = ?',
      [id]
    );

    if (caja.length === 0) {
      return errorResponse(res, 'Caja no encontrada', 404);
    }

    if (caja[0].estado === 'cerrada') {
      return errorResponse(res, 'La caja ya está cerrada', 400);
    }

    await pool.execute(
      `UPDATE tt_cajas SET estado = 'cerrada', monto_cierre = ?, fecha_cierre = NOW()
       WHERE id = ?`,
      [monto_cierre, id]
    );

    return successResponse(res, null, 'Caja cerrada exitosamente');
  } catch (error) {
    next(error);
  }
};

const movimiento = async (req, res, next) => {
  try {
    const { caja_id, tipo, categoria, monto, descripcion } = req.body;

    const [caja] = await pool.execute(
      'SELECT estado FROM tt_cajas WHERE id = ?',
      [caja_id]
    );

    if (caja.length === 0 || caja[0].estado !== 'abierta') {
      return errorResponse(res, 'Caja no encontrada o cerrada', 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO tt_movimientos_caja (caja_id, usuario_id, tipo, categoria, monto, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [caja_id, req.user.id, tipo, categoria, monto, descripcion]
    );

    return successResponse(res, { id: result.insertId }, 'Movimiento registrado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const arqueo = async (req, res, next) => {
  try {
    const { caja_id, monto_sistema, monto_fisico, observaciones } = req.body;
    const diferencia = monto_fisico - monto_sistema;

    const [result] = await pool.execute(
      `INSERT INTO tt_arqueos_caja (caja_id, usuario_id, monto_sistema, monto_fisico, diferencia, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [caja_id, req.user.id, monto_sistema, monto_fisico, diferencia, observaciones]
    );

    return successResponse(res, { id: result.insertId, diferencia }, 'Arqueo registrado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const getActiva = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, s.nombre as sucursal_nombre, u.nombre as usuario_nombre
       FROM tt_cajas c
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       JOIN tt_usuarios u ON c.usuario_id = u.id
       WHERE c.sucursal_id = ? AND c.estado = 'abierta'
       LIMIT 1`,
      [req.user.sucursal_id]
    );

    if (rows.length === 0) {
      return successResponse(res, null, 'No hay caja abierta');
    }

    return successResponse(res, rows[0], 'Caja activa encontrada');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getActiva,
  abrir,
  cerrar,
  movimiento,
  arqueo
};

