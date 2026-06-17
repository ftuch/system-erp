const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.execute(
      'SELECT id, nombre, usuario, rol_id, sucursal_id, estado FROM tt_usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || users[0].estado !== 1) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const authorize = (permiso) => {
  return async (req, res, next) => {
    try {
      const [permisos] = await pool.execute(
        `SELECT p.* FROM ts_permisos p
         JOIN tc_menus m ON p.menu_id = m.id
         WHERE p.rol_id = ? AND m.codigo = ?`,
        [req.user.rol_id, permiso]
      );

      if (permisos.length === 0 || permisos[0].puede_ver !== 1) {
        return res.status(403).json({ error: 'No tiene permisos para esta acción' });
      }

      req.permiso = permisos[0];
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};

module.exports = { authenticate, authorize };
