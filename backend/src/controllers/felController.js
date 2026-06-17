const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getSeries = async (req, res, next) => {
  try {
    const { sucursal_id } = req.query;
    let whereClause = 'WHERE estado = 1';
    const params = [];

    if (sucursal_id) {
      whereClause += ' AND sucursal_id = ?';
      params.push(sucursal_id);
    }

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT * FROM tc_series_documentos ${whereClause} ORDER BY tipo_documento, serie`,
      params
    );
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const createSerie = async (req, res, next) => {
  try {
    const { nombre, tipo_documento, serie, sucursal_id } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO tc_series_documentos (nombre, tipo_documento, serie, sucursal_id)
       VALUES (?, ?, ?, ?)`,
      [nombre, tipo_documento, serie, sucursal_id]
    );

    return successResponse(res, { id: result.insertId }, 'Serie creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const getDocumentos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, venta_id, estado, fecha_desde, fecha_hasta } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (venta_id) {
      whereClause += ' AND d.venta_id = ?';
      params.push(venta_id);
    }
    if (estado) {
      whereClause += ' AND d.estado = ?';
      params.push(estado);
    }
    if (fecha_desde) {
      whereClause += ' AND DATE(d.created_at) >= ?';
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      whereClause += ' AND DATE(d.created_at) <= ?';
      params.push(fecha_hasta);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_documentos_fiscales d ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.execute(
      `SELECT d.*, v.correlativo, v.total as venta_total, s.serie, s.tipo_documento
       FROM tt_documentos_fiscales d
       JOIN tt_ventas v ON d.venta_id = v.id
       JOIN tc_series_documentos s ON d.serie_id = s.id
       ${whereClause}
       ORDER BY d.id DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const emitirFactura = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { venta_id, serie_id, persona_id } = req.body;

    const [serie] = await connection.execute(
      'SELECT * FROM tc_series_documentos WHERE id = ?',
      [serie_id]
    );

    if (serie.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Serie no encontrada', 404);
    }

    const nuevoCorrelativo = serie[0].correlativo_actual + 1;

    await connection.execute(
      'UPDATE tc_series_documentos SET correlativo_actual = ? WHERE id = ?',
      [nuevoCorrelativo, serie_id]
    );

    const [result] = await connection.execute(
      `INSERT INTO tt_documentos_fiscales 
       (venta_id, serie_id, tipo_documento, serie, numero, estado)
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [venta_id, serie_id, serie[0].tipo_documento, serie[0].serie, nuevoCorrelativo]
    );

    const documentoId = result.insertId;

    await connection.execute(
      "UPDATE tt_ventas SET estado = 'pagado' WHERE id = ?",
      [venta_id]
    );

    await connection.commit();

    return successResponse(res, { 
      id: documentoId, 
      numero: `${serie[0].serie}-${nuevoCorrelativo.toString().padStart(9, '0')}`
    }, 'Documento fiscal generado exitosamente (modo simulado - integra con tu certificador FEL)', 201);

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const certificar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { uuid_fel, numero_autorizacion, xml_generado } = req.body;

    await pool.execute(
      `UPDATE tt_documentos_fiscales 
       SET uuid_fel = ?, numero_autorizacion = ?, xml_generado = ?, 
           estado = 'certificado', fecha_certificacion = NOW()
       WHERE id = ?`,
      [uuid_fel, numero_autorizacion, xml_generado, id]
    );

    return successResponse(res, null, 'Documento certificado exitosamente');
  } catch (error) {
    next(error);
  }
};

const anularDocumento = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE tt_documentos_fiscales SET estado = 'anulado' WHERE id = ?", [id]);
    return successResponse(res, null, 'Documento anulado exitosamente');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSeries,
  createSerie,
  getDocumentos,
  emitirFactura,
  certificar,
  anularDocumento
};

