const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', categoria_id, tipo, estado } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (p.nombre LIKE ? OR p.codigo_barras LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoria_id) {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }
    if (tipo) {
      whereClause += ' AND p.tipo = ?';
      params.push(tipo);
    }
    if (estado !== undefined && estado !== '') {
      whereClause += ' AND p.activo = ?';
      params.push(estado);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_productos p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT p.id, p.nombre, p.tipo, p.categoria_id, p.codigo_barras, p.unidad,
              p.precio, p.costo, p.requiere_receta,
              p.activo as estado, p.activo,
              c.nombre as categoria_nombre,
              COALESCE(SUM(e.stock_actual), 0) as stock_total,
              COALESCE(MIN(e.stock_minimo), 0) as stock_minimo,
              COALESCE(MAX(e.stock_maximo), 0) as stock_maximo
       FROM tt_productos p
       LEFT JOIN tc_categorias c ON p.categoria_id = c.id
       LEFT JOIN tt_existencias e ON p.id = e.producto_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.id DESC
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
    
    const [productos] = await pool.execute(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM tt_productos p
       LEFT JOIN tc_categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (productos.length === 0) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }

    const [existencias] = await pool.execute(
      `SELECT e.*, b.nombre as bodega_nombre, s.nombre as sucursal_nombre
       FROM tt_existencias e
       JOIN tt_bodegas b ON e.bodega_id = b.id
       JOIN tc_sucursales s ON b.sucursal_id = s.id
       WHERE e.producto_id = ?`,
      [id]
    );

    return successResponse(res, { ...productos[0], existencias });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { 
      nombre, tipo, categoria_id, codigo_barras, unidad, 
      precio, costo, requiere_receta = 0, stock_inicial = 0, bodega_id 
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO tt_productos (nombre, tipo, categoria_id, codigo_barras, unidad, precio, costo, requiere_receta, activo, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [nombre, tipo, categoria_id, codigo_barras, unidad, precio, costo, requiere_receta]
    );

    const productoId = result.insertId;

    if (stock_inicial > 0) {
      // Resolver bodega: usar la enviada o la bodega principal de la sucursal del usuario
      let bodegaResuelta = bodega_id || null;
      if (!bodegaResuelta) {
        const [bodegas] = await pool.execute(
          'SELECT id FROM tt_bodegas WHERE sucursal_id = ? ORDER BY id ASC LIMIT 1',
          [req.user.sucursal_id]
        );
        if (bodegas.length > 0) bodegaResuelta = bodegas[0].id;
      }

      if (bodegaResuelta) {
        await pool.execute(
          `INSERT INTO tt_existencias (producto_id, bodega_id, stock_actual, stock_minimo, stock_maximo)
           VALUES (?, ?, ?, 0, 0)
           ON DUPLICATE KEY UPDATE stock_actual = stock_actual + ?`,
          [productoId, bodegaResuelta, stock_inicial, stock_inicial]
        );
        await pool.execute(
          `INSERT INTO tt_movimientos_inventario (producto_id, bodega_id, tipo, cantidad, observaciones, usuario_id)
           VALUES (?, ?, 'entrada', ?, 'Stock inicial', ?)`,
          [productoId, bodegaResuelta, stock_inicial, req.user.id]
        );
      }
    }

    return successResponse(res, { id: productoId }, 'Producto creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      nombre, tipo, categoria_id, codigo_barras, unidad, 
      precio, costo, requiere_receta, estado 
    } = req.body;

    await pool.execute(
      `UPDATE tt_productos SET 
        nombre = ?, tipo = ?, categoria_id = ?, codigo_barras = ?, 
        unidad = ?, precio = ?, costo = ?, requiere_receta = ?, activo = ?, estado = ?
       WHERE id = ?`,
      [nombre, tipo, categoria_id, codigo_barras, unidad, precio, costo, requiere_receta, estado ?? 1, estado ?? 1, id]
    );

    return successResponse(res, null, 'Producto actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE tt_productos SET activo = 0, estado = 0 WHERE id = ?', [id]);
    return successResponse(res, null, 'Producto desactivado exitosamente');
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

