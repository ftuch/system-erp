const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', estado } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (nombre LIKE ? OR nit LIKE ? OR contacto LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (estado !== undefined) {
      whereClause += ' AND estado = ?';
      params.push(estado);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_proveedores ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT * FROM tt_proveedores ${whereClause} ORDER BY nombre LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const getAllActive = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, nit FROM tt_proveedores WHERE estado = 1 ORDER BY nombre'
    );
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM tt_proveedores WHERE id = ?', [id]);

    if (rows.length === 0) {
      return errorResponse(res, 'Proveedor no encontrado', 404);
    }

    const [compras] = await pool.execute(
      `SELECT c.*, s.nombre as sucursal_nombre
       FROM tt_compras c
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       WHERE c.proveedor_id = ?
       ORDER BY c.fecha DESC
       LIMIT 10`,
      [id]
    );

    return successResponse(res, { ...rows[0], compras });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre, nit, telefono, email, direccion, contacto } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO tt_proveedores (nombre, nit, telefono, email, direccion, contacto, estado)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [nombre, nit, telefono, email, direccion, contacto]
    );

    return successResponse(res, { id: result.insertId }, 'Proveedor creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, nit, telefono, email, direccion, contacto, estado } = req.body;

    await pool.execute(
      `UPDATE tt_proveedores SET 
        nombre = ?, nit = ?, telefono = ?, email = ?, direccion = ?, contacto = ?, estado = ?
       WHERE id = ?`,
      [nombre, nit, telefono, email, direccion, contacto, estado, id]
    );

    return successResponse(res, null, 'Proveedor actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE tt_proveedores SET estado = 0 WHERE id = ?', [id]);
    return successResponse(res, null, 'Proveedor desactivado exitosamente');
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

