const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { usuario, password } = req.body;

    const [users] = await pool.execute(
      `SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre 
       FROM tt_usuarios u
       LEFT JOIN ts_roles r ON u.rol_id = r.id
       LEFT JOIN tc_sucursales s ON u.sucursal_id = s.id
       WHERE u.usuario = ? AND u.estado = 1`,
      [usuario]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Usuario o contraseña incorrectos', 401);
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return errorResponse(res, 'Usuario o contraseña incorrectos', 401);
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        usuario: user.usuario, 
        rol_id: user.rol_id,
        sucursal_id: user.sucursal_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const [menus] = await pool.execute(
      `SELECT m.id, m.nombre, m.icono, m.ruta, m.orden, m.padre_id, m.codigo,
              p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
       FROM tc_menus m
       JOIN ts_permisos p ON m.id = p.menu_id
       WHERE p.rol_id = ? AND p.puede_ver = 1 AND m.estado = 1
       ORDER BY m.orden`,
      [user.rol_id]
    );

    const userData = {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre,
      sucursal_id: user.sucursal_id,
      sucursal_nombre: user.sucursal_nombre,
      puede_ajustar_inventario: user.puede_ajustar_inventario,
      plan: process.env.PLAN || 'basic'
    };

    return successResponse(res, {
      token,
      user: userData,
      menus
    }, 'Login exitoso');

  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.nombre, u.usuario, u.rol_id, u.sucursal_id,
              r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM tt_usuarios u
       LEFT JOIN ts_roles r ON u.rol_id = r.id
       LEFT JOIN tc_sucursales s ON u.sucursal_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    const [menus] = await pool.execute(
      `SELECT m.id, m.nombre, m.icono, m.ruta, m.orden, m.padre_id, m.codigo,
              p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
       FROM tc_menus m
       JOIN ts_permisos p ON m.id = p.menu_id
       WHERE p.rol_id = ? AND p.puede_ver = 1 AND m.estado = 1
       ORDER BY m.orden`,
      [users[0].rol_id]
    );

    return successResponse(res, { ...users[0], menus, plan: process.env.PLAN || 'basic' }, 'Perfil recuperado');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { password_actual, password_nuevo } = req.body;

    const [users] = await pool.execute(
      'SELECT password FROM tt_usuarios WHERE id = ?',
      [req.user.id]
    );

    const isValid = await bcrypt.compare(password_actual, users[0].password);
    if (!isValid) {
      return errorResponse(res, 'Contraseña actual incorrecta', 400);
    }

    const hashedPassword = await bcrypt.hash(password_nuevo, 10);
    await pool.execute(
      'UPDATE tt_usuarios SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    return successResponse(res, null, 'Contraseña actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getProfile,
  changePassword
};
