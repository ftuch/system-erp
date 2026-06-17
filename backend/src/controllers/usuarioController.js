const bcrypt = require('bcryptjs');
const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.nombre LIKE ? OR u.usuario LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_usuarios u ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const [rows] = await pool.execute(
      `SELECT u.id, u.nombre, u.usuario, u.rol_id, u.sucursal_id,
              u.activo as estado,
              r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM tt_usuarios u
       LEFT JOIN ts_roles r ON u.rol_id = r.id
       LEFT JOIN tc_sucursales s ON u.sucursal_id = s.id
       ${whereClause}
       ORDER BY u.id DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: limitNum, total });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM tt_usuarios u
       LEFT JOIN ts_roles r ON u.rol_id = r.id
       LEFT JOIN tc_sucursales s ON u.sucursal_id = s.id
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    delete rows[0].password;
    return successResponse(res, rows[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre, usuario, password, rol_id, sucursal_id } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO tt_usuarios (nombre, usuario, password, rol_id, sucursal_id, activo, estado)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [nombre, usuario, hashedPassword, rol_id, sucursal_id]
    );

    return successResponse(res, { id: result.insertId }, 'Usuario creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, usuario, rol_id, sucursal_id, estado } = req.body;

    await pool.execute(
      `UPDATE tt_usuarios SET 
        nombre = ?, usuario = ?, rol_id = ?, sucursal_id = ?,
        activo = ?, estado = ?
       WHERE id = ?`,
      [nombre, usuario, rol_id, sucursal_id, estado ?? 1, estado ?? 1, id]
    );

    return successResponse(res, null, 'Usuario actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'UPDATE tt_usuarios SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    return successResponse(res, null, 'Contraseña actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE tt_usuarios SET estado = 0 WHERE id = ?', [id]);
    return successResponse(res, null, 'Usuario desactivado exitosamente');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePassword,
  remove
};
