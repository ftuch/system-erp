const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (nombre LIKE ? OR direccion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tc_sucursales ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const [rows] = await pool.execute(
      `SELECT * FROM tc_sucursales ${whereClause} ORDER BY id DESC LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: limitNum, total });
  } catch (error) {
    next(error);
  }
};

const getAllActive = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, direccion FROM tc_sucursales WHERE estado = 1 ORDER BY nombre'
    );
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM tc_sucursales WHERE id = ?', [id]);

    if (rows.length === 0) {
      return errorResponse(res, 'Sucursal no encontrada', 404);
    }

    return successResponse(res, rows[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { nombre, direccion, telefono } = req.body;

    const [result] = await conn.execute(
      'INSERT INTO tc_sucursales (nombre, direccion, telefono) VALUES (?, ?, ?)',
      [nombre, direccion, telefono]
    );
    const sucursalId = result.insertId;

    // Auto-crear bodega principal para la sucursal
    await conn.execute(
      'INSERT INTO tt_bodegas (sucursal_id, nombre) VALUES (?, ?)',
      [sucursalId, 'Bodega Principal']
    );

    await conn.commit();
    return successResponse(res, { id: sucursalId }, 'Sucursal creada exitosamente', 201);
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, estado } = req.body;

    await pool.execute(
      'UPDATE tc_sucursales SET nombre = ?, direccion = ?, telefono = ?, estado = ? WHERE id = ?',
      [nombre, direccion, telefono, estado, id]
    );

    return successResponse(res, null, 'Sucursal actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM tc_sucursales WHERE id = ?', [id]);
    return successResponse(res, null, 'Sucursal eliminada exitosamente');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getAllActive,
  getById,
  create,
  update,
  remove
};
