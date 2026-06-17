export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  rol_id: number;
  rol_nombre?: string;
  sucursal_id: number;
  sucursal_nombre?: string;
  puede_ajustar_inventario: number;
  estado: number;
  plan?: 'basic' | 'plus' | 'full';
  created_at?: string;
}

export interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  estado: number;
  created_at?: string;
}

export interface Rol {
  id: number;
  nombre: string;
  permisos?: Permiso[];
}

export interface Permiso {
  id: number;
  rol_id: number;
  menu_id: number;
  puede_ver: number;
  puede_crear: number;
  puede_editar: number;
  puede_eliminar: number;
  menu_nombre?: string;
  menu_codigo?: string;
}

export interface Menu {
  id: number;
  nombre: string;
  icono: string;
  ruta: string;
  orden: number;
  padre_id?: number;
  estado: number;
  codigo?: string;
  puede_ver?: number;
  puede_crear?: number;
  puede_editar?: number;
  puede_eliminar?: number;
}

export interface Categoria {
  categorias_id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  tipo: 'producto' | 'medicamento' | 'servicio';
  categoria_id: number;
  categoria_nombre?: string;
  codigo_barras?: string;
  unidad?: string;
  precio: number;
  costo?: number;
  requiere_receta: number;
  estado: number;
  stock_total?: number;
  existencias?: Existencia[];
}

export interface Existencia {
  id: number;
  producto_id: number;
  bodega_id: number;
  bodega_nombre?: string;
  sucursal_nombre?: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
}

export interface Persona {
  id: number;
  nombre: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  tipo: 'cliente' | 'paciente' | 'ambos';
  email?: string;
  created_at?: string;
}

export interface Venta {
  id: number;
  persona_id?: number;
  cliente_nombre?: string;
  usuario_id: number;
  usuario_nombre?: string;
  sucursal_id: number;
  sucursal_nombre?: string;
  caja_id?: number;
  caja_nombre?: string;
  tipo: 'tienda' | 'farmacia' | 'clinica';
  total: number;
  estado: 'pendiente' | 'pagado' | 'anulado';
  correlativo?: string;
  fecha?: string;
  detalle?: VentaDetalle[];
  pagos?: Pago[];
}

export interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number;
  producto_nombre?: string;
  codigo_barras?: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Pago {
  id: number;
  venta_id: number;
  monto: number;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  referencia?: string;
  fecha?: string;
}

export interface Caja {
  id: number;
  sucursal_id: number;
  sucursal_nombre?: string;
  usuario_id: number;
  usuario_nombre?: string;
  nombre: string;
  estado: 'abierta' | 'cerrada';
  monto_inicial: number;
  monto_cierre?: number;
  fecha_apertura?: string;
  fecha_cierre?: string;
  total_ingresos?: number;
  total_egresos?: number;
  movimientos?: MovimientoCaja[];
  arqueos?: ArqueoCaja[];
}

export interface MovimientoCaja {
  id: number;
  caja_id: number;
  usuario_id: number;
  usuario_nombre?: string;
  tipo: 'ingreso' | 'egreso';
  categoria: 'venta' | 'retiro' | 'gasto' | 'deposito' | 'ajuste';
  monto: number;
  descripcion?: string;
  fecha?: string;
}

export interface ArqueoCaja {
  id: number;
  caja_id: number;
  usuario_id: number;
  usuario_nombre?: string;
  monto_sistema: number;
  monto_fisico: number;
  diferencia: number;
  observaciones?: string;
  fecha?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  estado: number;
  created_at?: string;
}

export interface Compra {
  id: number;
  proveedor_id: number;
  proveedor_nombre?: string;
  usuario_id: number;
  usuario_nombre?: string;
  sucursal_id: number;
  sucursal_nombre?: string;
  total: number;
  estado: 'pendiente' | 'recibida' | 'anulada';
  observaciones?: string;
  fecha?: string;
  detalle?: CompraDetalle[];
}

export interface CompraDetalle {
  id: number;
  compra_id: number;
  producto_id: number;
  producto_nombre?: string;
  codigo_barras?: string;
  cantidad: number;
  costo: number;
  subtotal: number;
}

export interface SerieDocumento {
  id: number;
  nombre: string;
  tipo_documento: 'FACT' | 'FCAM' | 'FPEQ' | 'NCRE' | 'NDEB';
  serie: string;
  correlativo_actual: number;
  sucursal_id?: number;
  estado: number;
}

export interface DocumentoFiscal {
  id: number;
  venta_id: number;
  serie_id: number;
  tipo_documento: string;
  serie?: string;
  numero?: number;
  uuid_fel?: string;
  numero_autorizacion?: string;
  estado: 'pendiente' | 'certificado' | 'anulado' | 'error';
  fecha_certificacion?: string;
  correlativo?: string;
  venta_total?: number;
}

export interface Consulta {
  id: number;
  persona_id: number;
  paciente_nombre?: string;
  doctor_id: number;
  doctor_nombre?: string;
  sucursal_id: number;
  sucursal_nombre?: string;
  diagnostico: string;
  tratamiento: string;
  fecha?: string;
  recetas?: Receta[];
}

export interface Receta {
  id: number;
  consulta_id: number;
  producto_id: number;
  producto_nombre?: string;
  dosis: string;
}

export interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto_nombre?: string;
  bodega_id: number;
  bodega_nombre?: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'traslado';
  cantidad: number;
  motivo?: string;
  referencia_id?: number;
  referencia_tipo?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  fecha?: string;
}

export interface Bodega {
  id: number;
  sucursal_id: number;
  nombre: string;
}

export interface DashboardResumen {
  ventas: {
    total_ventas: number;
    monto_ventas: number;
    promedio_venta: number;
  };
  compras: {
    total_compras: number;
    monto_compras: number;
  };
  productos: {
    total_productos: number;
    stock_bajo: number;
  };
  clientes: {
    total_clientes: number;
  };
  ventasPorDia: any[];
  productosMasVendidos: any[];
  utilidad: number;
}

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
  menus: Menu[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
