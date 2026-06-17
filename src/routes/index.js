const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const authController = require('../controllers/authController');
const usuarioController = require('../controllers/usuarioController');
const sucursalController = require('../controllers/sucursalController');
const rolController = require('../controllers/rolController');
const categoriaController = require('../controllers/categoriaController');
const productoController = require('../controllers/productoController');
const personaController = require('../controllers/personaController');
const ventaController = require('../controllers/ventaController');
const inventarioController = require('../controllers/inventarioController');
const cajaController = require('../controllers/cajaController');
const proveedorController = require('../controllers/proveedorController');
const compraController = require('../controllers/compraController');
const felController = require('../controllers/felController');
const clinicaController = require('../controllers/clinicaController');
const dashboardController = require('../controllers/dashboardController');
const pedidoController = require('../controllers/pedidoController');

const router = express.Router();

// ==================== AUTH ====================
router.post('/auth/login', authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ==================== USUARIOS ====================
router.get('/usuarios', authenticate, authorize('usuarios'), usuarioController.getAll);
router.get('/usuarios/:id', authenticate, authorize('usuarios'), usuarioController.getById);
router.post('/usuarios', authenticate, authorize('usuarios'), usuarioController.create);
router.put('/usuarios/:id', authenticate, authorize('usuarios'), usuarioController.update);
router.put('/usuarios/:id/password', authenticate, authorize('usuarios'), usuarioController.updatePassword);
router.delete('/usuarios/:id', authenticate, authorize('usuarios'), usuarioController.remove);

// ==================== SUCURSALES ====================
router.get('/sucursales', authenticate, authorize('sucursales'), sucursalController.getAll);
router.get('/sucursales/activas', authenticate, sucursalController.getAllActive);
router.get('/sucursales/:id', authenticate, authorize('sucursales'), sucursalController.getById);
router.post('/sucursales', authenticate, authorize('sucursales'), sucursalController.create);
router.put('/sucursales/:id', authenticate, authorize('sucursales'), sucursalController.update);
router.delete('/sucursales/:id', authenticate, authorize('sucursales'), sucursalController.remove);

// ==================== ROLES ====================
router.get('/roles', authenticate, authorize('usuarios'), rolController.getAll);
router.get('/roles/simple', authenticate, rolController.getSimple);
router.get('/menus', authenticate, rolController.getAllMenus);
router.get('/roles/:id', authenticate, authorize('usuarios'), rolController.getById);
router.post('/roles', authenticate, authorize('usuarios'), rolController.create);
router.put('/roles/:id', authenticate, authorize('usuarios'), rolController.update);
router.delete('/roles/:id', authenticate, authorize('usuarios'), rolController.remove);

// ==================== CATEGORÍAS ====================
router.get('/categorias', authenticate, categoriaController.getAll);
router.get('/categorias/:id', authenticate, categoriaController.getById);
router.post('/categorias', authenticate, authorize('productos'), categoriaController.create);
router.put('/categorias/:id', authenticate, authorize('productos'), categoriaController.update);
router.delete('/categorias/:id', authenticate, authorize('productos'), categoriaController.remove);

// ==================== PRODUCTOS ====================
router.get('/productos', authenticate, authorize('productos'), productoController.getAll);
router.get('/productos/:id', authenticate, authorize('productos'), productoController.getById);
router.post('/productos', authenticate, authorize('productos'), productoController.create);
router.put('/productos/:id', authenticate, authorize('productos'), productoController.update);
router.delete('/productos/:id', authenticate, authorize('productos'), productoController.remove);

// ==================== PERSONAS ====================
router.get('/personas', authenticate, authorize('clientes'), personaController.getAll);
router.get('/personas/:id', authenticate, authorize('clientes'), personaController.getById);
router.post('/personas', authenticate, authorize('clientes'), personaController.create);
router.put('/personas/:id', authenticate, authorize('clientes'), personaController.update);
router.delete('/personas/:id', authenticate, authorize('clientes'), personaController.remove);

// ==================== VENTAS ====================
router.get('/ventas', authenticate, authorize('ventas'), ventaController.getAll);
router.get('/ventas/:id', authenticate, authorize('ventas'), ventaController.getById);
router.post('/ventas', authenticate, authorize('ventas'), ventaController.create);
router.post('/ventas/:id/anular', authenticate, authorize('ventas'), ventaController.anular);

// ==================== BODEGAS ====================
router.get('/bodegas', authenticate, async (req, res, next) => {
  try {
    const { pool } = require('../../config/database');
    const { successResponse } = require('../utils/response');
    const [rows] = await pool.execute(
      `SELECT b.id, b.nombre, b.sucursal_id, s.nombre as sucursal_nombre
       FROM tt_bodegas b
       JOIN tc_sucursales s ON b.sucursal_id = s.id
       ORDER BY s.nombre, b.nombre`
    );
    return successResponse(res, rows);
  } catch(e) { next(e); }
});

// ==================== INVENTARIO ====================
router.get('/inventario/existencias', authenticate, authorize('inventario'), inventarioController.getExistencias);
router.get('/inventario/movimientos', authenticate, authorize('inventario'), inventarioController.getMovimientos);
router.post('/inventario/ajuste', authenticate, authorize('inventario'), inventarioController.ajustarStock);
router.post('/inventario/traslado', authenticate, authorize('inventario'), inventarioController.traslado);

// ==================== CAJAS ====================
router.get('/cajas', authenticate, authorize('cajas'), cajaController.getAll);
router.get('/cajas/activa', authenticate, cajaController.getActiva);
router.get('/cajas/:id', authenticate, authorize('cajas'), cajaController.getById);
router.post('/cajas/abrir', authenticate, authorize('cajas'), cajaController.abrir);
router.post('/cajas/:id/cerrar', authenticate, authorize('cajas'), cajaController.cerrar);
router.post('/cajas/movimiento', authenticate, authorize('cajas'), cajaController.movimiento);
router.post('/cajas/arqueo', authenticate, authorize('cajas'), cajaController.arqueo);

// ==================== PROVEEDORES ====================
router.get('/proveedores', authenticate, authorize('compras'), proveedorController.getAll);
router.get('/proveedores/activos', authenticate, proveedorController.getAllActive);
router.get('/proveedores/:id', authenticate, authorize('compras'), proveedorController.getById);
router.post('/proveedores', authenticate, authorize('compras'), proveedorController.create);
router.put('/proveedores/:id', authenticate, authorize('compras'), proveedorController.update);
router.delete('/proveedores/:id', authenticate, authorize('compras'), proveedorController.remove);

// ==================== COMPRAS ====================
router.get('/compras', authenticate, authorize('compras'), compraController.getAll);
router.get('/compras/:id', authenticate, authorize('compras'), compraController.getById);
router.post('/compras', authenticate, authorize('compras'), compraController.create);
router.post('/compras/:id/recibir', authenticate, authorize('compras'), compraController.recibir);
router.post('/compras/:id/anular', authenticate, authorize('compras'), compraController.anular);

// ==================== FACTURACIÓN FEL ====================
router.get('/fel/series', authenticate, authorize('fel'), felController.getSeries);
router.post('/fel/series', authenticate, authorize('fel'), felController.createSerie);
router.get('/fel/documentos', authenticate, authorize('fel'), felController.getDocumentos);
router.post('/fel/emitir', authenticate, authorize('fel'), felController.emitirFactura);
router.post('/fel/documentos/:id/certificar', authenticate, authorize('fel'), felController.certificar);
router.post('/fel/documentos/:id/anular', authenticate, authorize('fel'), felController.anularDocumento);

// ==================== CLÍNICA ====================
router.get('/clinica/consultas', authenticate, authorize('clinica'), clinicaController.getConsultas);
router.get('/clinica/consultas/:id', authenticate, authorize('clinica'), clinicaController.getConsultaById);
router.post('/clinica/consultas', authenticate, authorize('clinica'), clinicaController.createConsulta);
router.put('/clinica/consultas/:id', authenticate, authorize('clinica'), clinicaController.updateConsulta);

// ==================== PEDIDOS ====================
router.get('/pedidos/config',                authenticate, authorize('pedidos'), pedidoController.obtenerConfig);
router.put('/pedidos/config',                authenticate, authorize('pedidos_config'), pedidoController.actualizarConfig);
router.get('/pedidos',                       authenticate, authorize('pedidos'), pedidoController.getAll);
router.get('/pedidos/:id',                   authenticate, authorize('pedidos'), pedidoController.getById);
router.post('/pedidos',                      authenticate, authorize('pedidos'), pedidoController.create);
router.post('/pedidos/:id/aprobar',          authenticate, authorize('pedidos'), pedidoController.aprobar);
router.post('/pedidos/:id/rechazar',         authenticate, authorize('pedidos'), pedidoController.rechazar);
router.post('/pedidos/:id/recibir',          authenticate, authorize('pedidos'), pedidoController.recibir);
router.post('/pedidos/:id/cancelar',         authenticate, authorize('pedidos'), pedidoController.cancelar);

// ==================== DASHBOARD ====================
router.get('/dashboard/resumen', authenticate, dashboardController.getResumen);
router.get('/dashboard/kardex', authenticate, dashboardController.getKardex);

module.exports = router;
