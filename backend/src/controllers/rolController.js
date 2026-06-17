const { pool } = require('../../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM ts_roles ORDER BY id');
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [roles] = await pool.execute('SELECT * FROM ts_roles WHERE id = ?', [id]);
    if (roles.length === 0) {
      return errorResponse(res, 'Rol no encontrado', 404);
    }

    const [permisos] = await pool.execute(
      `SELECT p.*, m.nombre as menu_nombre, m.codigo as menu_codigo
       FROM ts_permisos p
       JOIN tc_menus m ON p.menu_id = m.id
       WHERE p.rol_id = ?`,
      [id]
    );

    return successResponse(res, { ...roles[0], permisos });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre, permisos = [] } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO ts_roles (nombre) VALUES (?)',
      [nombre]
    );

    const rolId = result.insertId;

    for (const permiso of permisos) {
      await pool.execute(
        `INSERT INTO ts_permisos (rol_id, menu_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [rolId, permiso.menu_id, permiso.puede_ver || 0, permiso.puede_crear || 0, 
         permiso.puede_editar || 0, permiso.puede_eliminar || 0]
      );
    }

    return successResponse(res, { id: rolId }, 'Rol creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, permisos = [] } = req.body;

    await pool.execute('UPDATE ts_roles SET nombre = ? WHERE id = ?', [nombre, id]);

    await pool.execute('DELETE FROM ts_permisos WHERE rol_id = ?', [id]);

    for (const permiso of permisos) {
      await pool.execute(
        `INSERT INTO ts_permisos (rol_id, menu_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, permiso.menu_id, permiso.puede_ver || 0, permiso.puede_crear || 0, 
         permiso.puede_editar || 0, permiso.puede_eliminar || 0]
      );
    }

    return successResponse(res, null, 'Rol actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM ts_roles WHERE id = ?', [id]);
    return successResponse(res, null, 'Rol eliminado exitosamente');
  } catch (error) {
    next(error);
  }
};

const getSimple = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre FROM ts_roles ORDER BY nombre');
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const getAllMenus = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, icono, ruta, orden, padre_id, codigo, estado FROM tc_menus ORDER BY orden'
    );
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getSimple,
  getById,
  create,
  update,
  remove,
  getAllMenus
};
