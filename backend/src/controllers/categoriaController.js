const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tc_categorias ORDER BY nombre');
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM tc_categorias WHERE id = ?', [id]);

    if (rows.length === 0) {
      return errorResponse(res, 'Categoría no encontrada', 404);
    }

    return successResponse(res, rows[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO tc_categorias (nombre) VALUES (?)',
      [nombre]
    );

    return successResponse(res, { id: result.insertId }, 'Categoría creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    await pool.execute(
      'UPDATE tc_categorias SET nombre = ? WHERE id = ?',
      [nombre, id]
    );

    return successResponse(res, null, 'Categoría actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM tc_categorias WHERE id = ?', [id]);
    return successResponse(res, null, 'Categoría eliminada exitosamente');
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
