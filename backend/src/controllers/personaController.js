const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', tipo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (nombre LIKE ? OR nit LIKE ? OR telefono LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (tipo) {
      whereClause += ' AND (tipo = ? OR tipo = "ambos")';
      params.push(tipo);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_personas ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT * FROM tt_personas ${whereClause} ORDER BY nombre LIMIT ${limitNum} OFFSET ${offsetNum}`,
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
    const [rows] = await pool.execute('SELECT * FROM tt_personas WHERE id = ?', [id]);

    if (rows.length === 0) {
      return errorResponse(res, 'Persona no encontrada', 404);
    }

    return successResponse(res, rows[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre, nit, telefono, direccion, tipo = 'cliente', email } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO tt_personas (nombre, nit, telefono, direccion, tipo, email) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, nit, telefono, direccion, tipo, email]
    );

    return successResponse(res, { id: result.insertId }, 'Persona creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, nit, telefono, direccion, tipo, email } = req.body;

    await pool.execute(
      'UPDATE tt_personas SET nombre = ?, nit = ?, telefono = ?, direccion = ?, tipo = ?, email = ? WHERE id = ?',
      [nombre, nit, telefono, direccion, tipo, email, id]
    );

    return successResponse(res, null, 'Persona actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM tt_personas WHERE id = ?', [id]);
    return successResponse(res, null, 'Persona eliminada exitosamente');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};

