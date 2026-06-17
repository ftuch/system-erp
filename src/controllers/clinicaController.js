const { pool } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getConsultas = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, persona_id, doctor_id, fecha_desde, fecha_hasta } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (persona_id) {
      whereClause += ' AND c.persona_id = ?';
      params.push(persona_id);
    }
    if (doctor_id) {
      whereClause += ' AND c.doctor_id = ?';
      params.push(doctor_id);
    }
    if (fecha_desde) {
      whereClause += ' AND DATE(c.fecha) >= ?';
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      whereClause += ' AND DATE(c.fecha) <= ?';
      params.push(fecha_hasta);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tt_consultas c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const limitNum = parseInt(limit);


    const offsetNum = parseInt(offset);


    const [rows] = await pool.execute(
      `SELECT c.*, p.nombre as paciente_nombre, u.nombre as doctor_nombre,
              s.nombre as sucursal_nombre
       FROM tt_consultas c
       JOIN tt_personas p ON c.persona_id = p.id
       JOIN tt_usuarios u ON c.doctor_id = u.id
       JOIN tc_sucursales s ON c.sucursal_id = s.id
       ${whereClause}
       ORDER BY c.fecha DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    return paginatedResponse(res, rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const getConsultaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [consultas] = await pool.execute(
      `SELECT c.*, p.nombre as paciente_nombre, p.nit as paciente_nit,
              u.nombre as doctor_nombre
       FROM tt_consultas c
       JOIN tt_personas p ON c.persona_id = p.id
       JOIN tt_usuarios u ON c.doctor_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (consultas.length === 0) {
      return errorResponse(res, 'Consulta no encontrada', 404);
    }

    const [recetas] = await pool.execute(
      `SELECT r.*, pr.nombre as producto_nombre
       FROM tt_recetas r
       JOIN tt_productos pr ON r.producto_id = pr.id
       WHERE r.consulta_id = ?`,
      [id]
    );

    return successResponse(res, { ...consultas[0], recetas });
  } catch (error) {
    next(error);
  }
};

const createConsulta = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { persona_id, doctor_id, sucursal_id, diagnostico, tratamiento, recetas = [] } = req.body;

    const [result] = await connection.execute(
      `INSERT INTO tt_consultas (persona_id, doctor_id, sucursal_id, diagnostico, tratamiento)
       VALUES (?, ?, ?, ?, ?)`,
      [persona_id, doctor_id, sucursal_id, diagnostico, tratamiento]
    );

    const consultaId = result.insertId;

    for (const receta of recetas) {
      await connection.execute(
        `INSERT INTO tt_recetas (consulta_id, producto_id, dosis)
         VALUES (?, ?, ?)`,
        [consultaId, receta.producto_id, receta.dosis]
      );
    }

    await connection.commit();
    return successResponse(res, { id: consultaId }, 'Consulta creada exitosamente', 201);

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const updateConsulta = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { diagnostico, tratamiento, recetas = [] } = req.body;

    await connection.execute(
      'UPDATE tt_consultas SET diagnostico = ?, tratamiento = ? WHERE id = ?',
      [diagnostico, tratamiento, id]
    );

    await connection.execute('DELETE FROM tt_recetas WHERE consulta_id = ?', [id]);

    for (const receta of recetas) {
      await connection.execute(
        `INSERT INTO tt_recetas (consulta_id, producto_id, dosis)
         VALUES (?, ?, ?)`,
        [id, receta.producto_id, receta.dosis]
      );
    }

    await connection.commit();
    return successResponse(res, null, 'Consulta actualizada exitosamente');

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getConsultas,
  getConsultaById,
  createConsulta,
  updateConsulta
};

