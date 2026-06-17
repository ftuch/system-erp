import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DashboardResumen, Usuario, Menu } from '../../models';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dash-page">
      <!-- Page title + filtros -->
      <div class="page-header">
        <div>
          <h2 class="page-title">DASHBOARD</h2>
          <p class="page-subtitle">Resumen general · {{ rangoLabel }}</p>
        </div>
        <div class="filtros-fecha">
          <button class="chip-btn" [class.active]="rangoActivo === 'hoy'" (click)="setRango('hoy')">Hoy</button>
          <button class="chip-btn" [class.active]="rangoActivo === 'semana'" (click)="setRango('semana')">Semana</button>
          <button class="chip-btn" [class.active]="rangoActivo === 'mes'" (click)="setRango('mes')">Mes</button>
          <button class="chip-btn" [class.active]="rangoActivo === 'anio'" (click)="setRango('anio')">Año</button>
          <div class="custom-range">
            <input type="date" [(ngModel)]="fechaDesde" (change)="setRango('custom')" />
            <span>—</span>
            <input type="date" [(ngModel)]="fechaHasta" (change)="setRango('custom')" />
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="resumen">
        <div class="kpi-card kpi-blue">
          <div class="kpi-content">
            <span class="kpi-label">VENTAS</span>
            <span class="kpi-value">Q{{ resumen.ventas.monto_ventas | number:'1.2-2' }}</span>
            <span class="kpi-sub">{{ resumen.ventas.total_ventas }} transacciones</span>
          </div>
          <span class="material-icons kpi-icon">payments</span>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-content">
            <span class="kpi-label">TICKET PROMEDIO</span>
            <span class="kpi-value">Q{{ resumen.ventas.promedio_venta | number:'1.2-2' }}</span>
            <span class="kpi-sub">Por venta</span>
          </div>
          <span class="material-icons kpi-icon">receipt_long</span>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-content">
            <span class="kpi-label">PRODUCTOS</span>
            <span class="kpi-value">{{ resumen.productos.total_productos }}</span>
            <span class="kpi-sub" [class.kpi-warn]="resumen.productos.stock_bajo > 0">
              {{ resumen.productos.stock_bajo }} con stock bajo
            </span>
          </div>
          <span class="material-icons kpi-icon">inventory_2</span>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-content">
            <span class="kpi-label">COMPRAS</span>
            <span class="kpi-value">Q{{ resumen.compras?.monto_compras | number:'1.2-2' }}</span>
            <span class="kpi-sub">{{ resumen.compras?.total_compras }} órdenes</span>
          </div>
          <span class="material-icons kpi-icon">shopping_bag</span>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-content">
            <span class="kpi-label">UTILIDAD</span>
            <span class="kpi-value" [class.positive]="resumen.utilidad >= 0" [class.negative]="resumen.utilidad < 0">
              Q{{ resumen.utilidad | number:'1.2-2' }}
            </span>
            <span class="kpi-sub">Ventas - Compras</span>
          </div>
          <span class="material-icons kpi-icon">trending_up</span>
        </div>
      </div>

      <!-- Tablas -->
      <div class="tables-grid" *ngIf="resumen">
        <!-- Ventas por día -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ventas por Día</h3>
            <button class="btn-download" (click)="descargarCSV('ventas_por_dia')" title="Descargar CSV">
              <span class="material-icons">download</span> CSV
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let dia of resumen.ventasPorDia">
                  <td>{{ dia.fecha | date:'dd/MM/yyyy' }}</td>
                  <td>{{ dia.cantidad }}</td>
                  <td class="td-monto">Q{{ dia.total | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!resumen.ventasPorDia?.length">
                  <td colspan="3" class="empty-row">Sin datos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Productos más vendidos -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Productos Más Vendidos</h3>
            <button class="btn-download" (click)="descargarCSV('productos_mas_vendidos')" title="Descargar CSV">
              <span class="material-icons">download</span> CSV
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let prod of resumen.productosMasVendidos; let i = index">
                  <td class="td-rank">{{ i + 1 }}</td>
                  <td>{{ prod.nombre }}</td>
                  <td>{{ prod.cantidad_vendida }}</td>
                  <td class="td-monto">Q{{ prod.total_ventas | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!resumen.productosMasVendidos?.length">
                  <td colspan="4" class="empty-row">Sin datos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Clientes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Top Clientes</h3>
            <button class="btn-download" (click)="descargarCSV('top_clientes')" title="Descargar CSV">
              <span class="material-icons">download</span> CSV
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Compras</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of topClientes; let i = index">
                  <td class="td-rank">{{ i + 1 }}</td>
                  <td>{{ c.nombre }}</td>
                  <td>{{ c.total_compras }}</td>
                  <td class="td-monto">Q{{ c.total_monto | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!topClientes.length">
                  <td colspan="4" class="empty-row">Sin datos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Productos con stock bajo -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Stock Bajo</h3>
            <button class="btn-download" (click)="descargarCSV('stock_bajo')" title="Descargar CSV">
              <span class="material-icons">download</span> CSV
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of stockBajo">
                  <td>{{ p.nombre }}</td>
                  <td class="td-monto">{{ p.stock_actual }}</td>
                  <td>{{ p.stock_minimo }}</td>
                  <td>
                    <span class="chip" [ngClass]="p.stock_actual <= 0 ? 'chip-red' : 'chip-orange'">
                      {{ p.stock_actual <= 0 ? 'Agotado' : 'Bajo' }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="!stockBajo.length">
                  <td colspan="4" class="empty-row">Todo en orden</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Accesos rápidos por permisos -->
      <div class="card accesos-card">
        <div class="card-header">
          <h3 class="card-title">Accesos Rápidos</h3>
          <span class="card-subtitle">Módulos disponibles según tu rol</span>
        </div>
        <div class="accesos-grid">
          <a *ngFor="let menu of menus"
             [routerLink]="menu.ruta"
             class="acceso-item"
             [title]="menu.nombre">
            <div class="acceso-icon-wrap">
              <span class="material-icons">{{ menu.icono }}</span>
            </div>
            <span class="acceso-label">{{ menu.nombre }}</span>
          </a>
          <div *ngIf="!menus.length" class="no-menus">
            No hay módulos asignados a tu rol.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-page { display: flex; flex-direction: column; gap: var(--space-lg); }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; letter-spacing: 0.5px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }

    /* Filtros fecha */
    .filtros-fecha { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .chip-btn { padding: 6px 14px; border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--surface); font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); }
    .chip-btn:hover { border-color: var(--primary); color: var(--primary); }
    .chip-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
    .custom-range { display: flex; align-items: center; gap: 6px; }
    .custom-range input { padding: 5px 8px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 12px; color: var(--text); background: var(--surface); outline: none; }
    .custom-range input:focus { border-color: var(--primary); }
    .custom-range span { color: var(--text-disabled); font-size: 12px; }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-md);
    }
    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 800px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      box-shadow: var(--shadow-md);
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .kpi-blue   { background: linear-gradient(135deg, #4a6fa5, #3a5a8a); }
    .kpi-purple { background: linear-gradient(135deg, #7c5cbf, #5b3f9a); }
    .kpi-green  { background: linear-gradient(135deg, #5a9a6f, #4a8060); }
    .kpi-orange { background: linear-gradient(135deg, #c48c3a, #a87030); }
    .kpi-teal   { background: linear-gradient(135deg, #4a7fa8, #366080); }

    .kpi-content { display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; opacity: 0.85; }
    .kpi-value { font-size: 26px; font-weight: 700; line-height: 1.1; }
    .kpi-sub { font-size: 12px; opacity: 0.8; }
    .kpi-warn { color: #ffe082 !important; opacity: 1 !important; }
    .kpi-icon { font-size: 36px; opacity: 0.25; }
    .positive { color: #a5d6a7; }
    .negative { color: #ef9a9a; }

    /* Tables grid */
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
    }
    @media (max-width: 768px) { .tables-grid { grid-template-columns: 1fr; } }

    /* Card */
    .card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .card-header {
      padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
    }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin: 0; }
    .card-subtitle { font-size: 12px; color: var(--text-secondary); }

    /* Download button */
    .btn-download { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); font-size: 11px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); }
    .btn-download:hover { border-color: var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 6%, transparent); }
    .btn-download .material-icons { font-size: 14px; }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th {
      padding: 10px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      background: var(--surface-hover);
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
    }
    .data-table td {
      padding: 10px 16px;
      color: var(--text);
      border-bottom: 1px solid var(--border-light);
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--surface-hover); }
    .empty-row { text-align: center; color: var(--text-disabled); font-style: italic; }
    .td-monto { font-weight: 700; color: var(--text); }
    .td-rank { font-weight: 700; color: var(--primary); width: 30px; }

    /* Chips */
    .chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .chip-red    { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }
    .chip-orange { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #d97706; }

    /* Accesos rápidos */
    .accesos-card { }
    .accesos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-md);
      padding: var(--space-lg);
    }
    .acceso-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text);
      border: 1px solid var(--border);
      background: var(--surface);
      transition: all var(--transition-fast);
      cursor: pointer;
    }
    .acceso-item:hover {
      background: color-mix(in srgb, var(--primary) 8%, var(--surface));
      border-color: var(--primary);
      color: var(--primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .acceso-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--primary) 10%, var(--surface));
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .acceso-icon-wrap .material-icons { font-size: 22px; color: var(--primary); }
    .acceso-label { font-size: 12px; font-weight: 500; text-align: center; line-height: 1.2; }
    .no-menus { grid-column: 1/-1; color: var(--text-disabled); font-size: 13px; text-align: center; padding: var(--space-lg); }

    @media (max-width: 768px) {
      .filtros-fecha { width: 100%; justify-content: flex-start; }
      .custom-range { width: 100%; }
      .custom-range input { flex: 1; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  resumen: any = null;
  currentUser: Usuario | null = null;
  menus: Menu[] = [];
  today = new Date();
  topClientes: any[] = [];
  stockBajo: any[] = [];

  rangoActivo = 'mes';
  rangoLabel = '';
  fechaDesde = '';
  fechaHasta = '';

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.menus = this.authService.getMenus().filter(m => m.puede_ver === 1 && !m.padre_id);
    this.setRango('mes');
  }

  setRango(tipo: string): void {
    this.rangoActivo = tipo;
    const hoy = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (tipo) {
      case 'hoy':
        this.fechaDesde = this.fechaHasta = fmt(hoy);
        this.rangoLabel = 'Hoy';
        break;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        this.fechaDesde = fmt(inicioSemana);
        this.fechaHasta = fmt(hoy);
        this.rangoLabel = 'Esta semana';
        break;
      case 'mes':
        this.fechaDesde = fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
        this.fechaHasta = fmt(hoy);
        this.rangoLabel = 'Este mes';
        break;
      case 'anio':
        this.fechaDesde = fmt(new Date(hoy.getFullYear(), 0, 1));
        this.fechaHasta = fmt(hoy);
        this.rangoLabel = 'Este año';
        break;
      case 'custom':
        this.rangoLabel = `${this.fechaDesde} a ${this.fechaHasta}`;
        break;
    }
    this.loadResumen();
    this.loadTopClientes();
    this.loadStockBajo();
  }

  loadResumen(): void {
    const params: any = {};
    if (this.fechaDesde) params.fecha_desde = this.fechaDesde;
    if (this.fechaHasta) params.fecha_hasta = this.fechaHasta;

    this.api.get<any>('/dashboard/resumen', params).subscribe({
      next: (response) => {
        if (response.success) {
          this.resumen = response.data;
        }
      }
    });
  }

  loadTopClientes(): void {
    const params: any = { limit: 5 };
    if (this.fechaDesde) params.fecha_desde = this.fechaDesde;
    if (this.fechaHasta) params.fecha_hasta = this.fechaHasta;

    this.api.get<any[]>('/dashboard/top-clientes', params).subscribe({
      next: (r) => { this.topClientes = (r.data as any) || []; },
      error: () => { this.topClientes = []; }
    });
  }

  loadStockBajo(): void {
    this.api.get<any[]>('/dashboard/stock-bajo').subscribe({
      next: (r) => { this.stockBajo = (r.data as any) || []; },
      error: () => { this.stockBajo = []; }
    });
  }

  descargarCSV(tipo: string): void {
    let csv = '';
    let filename = '';

    switch (tipo) {
      case 'ventas_por_dia':
        csv = 'Fecha,Cantidad,Total\n';
        (this.resumen?.ventasPorDia || []).forEach((d: any) => {
          csv += `${d.fecha},${d.cantidad},${d.total}\n`;
        });
        filename = `ventas_por_dia_${this.fechaDesde}_${this.fechaHasta}.csv`;
        break;
      case 'productos_mas_vendidos':
        csv = 'Producto,Cantidad Vendida,Total Ventas\n';
        (this.resumen?.productosMasVendidos || []).forEach((p: any) => {
          csv += `"${p.nombre}",${p.cantidad_vendida},${p.total_ventas}\n`;
        });
        filename = `productos_mas_vendidos_${this.fechaDesde}_${this.fechaHasta}.csv`;
        break;
      case 'top_clientes':
        csv = 'Cliente,Compras,Total\n';
        this.topClientes.forEach((c: any) => {
          csv += `"${c.nombre}",${c.total_compras},${c.total_monto}\n`;
        });
        filename = `top_clientes_${this.fechaDesde}_${this.fechaHasta}.csv`;
        break;
      case 'stock_bajo':
        csv = 'Producto,Stock Actual,Stock Minimo,Estado\n';
        this.stockBajo.forEach((p: any) => {
          csv += `"${p.nombre}",${p.stock_actual},${p.stock_minimo},${p.stock_actual <= 0 ? 'Agotado' : 'Bajo'}\n`;
        });
        filename = `stock_bajo_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
