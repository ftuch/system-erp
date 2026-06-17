const { pool } = require('../../config/database');
const { successResponse } = require('../utils/response');

const getResumen = async (req, res, next) => {
  try {
    const { sucursal_id, fecha_desde, fecha_hasta } = req.query;
    
    const params = [];
    let whereVentas = 'WHERE 1=1';
    let whereCompras = 'WHERE 1=1';
    let whereMovimientos = 'WHERE 1=1';

    if (sucursal_id) {
      whereVentas += ' AND sucursal_id = ?';
      whereCompras += ' AND sucursal_id = ?';
      params.push(sucursal_id);
    }
    if (fecha_desde) {
      whereVentas += ' AND DATE(fecha) >= ?';
      whereCompras += ' AND DATE(fecha) >= ?';
      whereMovimientos += ' AND DATE(fecha) >= ?';
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      whereVentas += ' AND DATE(fecha) <= ?';
      whereCompras += ' AND DATE(fecha) <= ?';
      whereMovimientos += ' AND DATE(fecha) <= ?';
      params.push(fecha_hasta);
    }

    const [[ventas]] = await pool.execute(
      `SELECT COUNT(*) as total_ventas, COALESCE(SUM(total), 0) as monto_ventas
       FROM tt_ventas ${whereVentas} AND estado != 'anulado'`
    );

    const [[compras]] = await pool.execute(
      `SELECT COUNT(*) as total_compras, COALESCE(SUM(total), 0) as monto_compras
       FROM tt_compras ${whereCompras} AND estado = 'recibida'`
    );

    const [[productos]] = await pool.execute(
      'SELECT COUNT(*) as total_productos FROM tt_productos WHERE estado = 1'
    );

    const [[clientes]] = await pool.execute(
      'SELECT COUNT(*) as total_clientes FROM tt_personas WHERE tipo IN ("cliente", "ambos")'
    );

    const [[stockBajo]] = await pool.execute(
      `SELECT COUNT(*) as productos_stock_bajo
       FROM tt_existencias WHERE stock_actual <= stock_minimo`
    );

    const [ventasPorDia] = await pool.execute(
      `SELECT DATE(fecha) as fecha, COUNT(*) as cantidad, SUM(total) as total
       FROM tt_ventas ${whereVentas} AND estado != 'anulado'
       GROUP BY DATE(fecha)
       ORDER BY fecha DESC
       LIMIT 7`
    );

    const [productosMasVendidos] = await pool.execute(
      `SELECT p.nombre, SUM(d.cantidad) as cantidad_vendida, SUM(d.subtotal) as total_ventas
       FROM tt_venta_detalle d
       JOIN tt_productos p ON d.producto_id = p.id
       JOIN tt_ventas v ON d.venta_id = v.id
       ${whereVentas.replace(/sucursal_id/g, 'v.sucursal_id').replace(/fecha/g, 'v.fecha')}
       AND v.estado != 'anulado'
       GROUP BY d.producto_id
       ORDER BY cantidad_vendida DESC
       LIMIT 5`
    );

    return successResponse(res, {
      ventas: { ...ventas, promedio_venta: ventas.total_ventas > 0 ? ventas.monto_ventas / ventas.total_ventas : 0 },
      compras,
      productos: { ...productos, stock_bajo: stockBajo.productos_stock_bajo },
      clientes,
      ventasPorDia,
      productosMasVendidos,
      utilidad: ventas.monto_ventas - compras.monto_compras
    });
  } catch (error) {
    next(error);
  }
};

const getKardex = async (req, res, next) => {
  try {
    const { producto_id, bodega_id } = req.query;

    if (!producto_id) {
      return successResponse(res, { error: 'producto_id requerido' });
    }

    let whereClause = 'WHERE m.producto_id = ?';
    const params = [producto_id];

    if (bodega_id) {
      whereClause += ' AND m.bodega_id = ?';
      params.push(bodega_id);
    }

    const [movimientos] = await pool.execute(
      `SELECT m.*, p.nombre as producto_nombre, b.nombre as bodega_nombre,
              u.nombre as usuario_nombre
       FROM tt_movimientos_inventario m
       JOIN tt_productos p ON m.producto_id = p.id
       JOIN tt_bodegas b ON m.bodega_id = b.id
       LEFT JOIN tt_usuarios u ON m.usuario_id = u.id
       ${whereClause}
       ORDER BY m.fecha DESC
       LIMIT 50`,
      params
    );

    const [existencia] = await pool.execute(
      `SELECT COALESCE(SUM(stock_actual), 0) as stock_actual
       FROM tt_existencias WHERE producto_id = ?`,
      [producto_id]
    );

    return successResponse(res, {
      producto_id,
      stock_actual: existencia[0].stock_actual,
      movimientos
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResumen,
  getKardex
};
