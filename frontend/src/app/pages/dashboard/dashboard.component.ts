import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DashboardResumen, Usuario, Menu } from '../../models';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dash-page">
      <!-- Page title -->
      <div class="page-header">
        <div>
          <h2 class="page-title">DASHBOARD DE VENTAS</h2>
          <p class="page-subtitle">Resumen del día · {{ today | date:'EEEE, d MMMM yyyy':'':'es' }}</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="resumen">
        <div class="kpi-card kpi-blue">
          <div class="kpi-content">
            <span class="kpi-label">INGRESOS</span>
            <span class="kpi-value">Q{{ resumen.ventas.monto_ventas | number:'1.2-2' }}</span>
            <span class="kpi-sub">{{ resumen.ventas.total_ventas }} ventas hoy</span>
          </div>
          <span class="material-icons kpi-icon">payments</span>
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
            <span class="kpi-label">CLIENTES</span>
            <span class="kpi-value">{{ resumen.clientes.total_clientes }}</span>
            <span class="kpi-sub">Registrados</span>
          </div>
          <span class="material-icons kpi-icon">people</span>
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
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ventas por Día</h3>
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
                  <td>Q{{ dia.total | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!resumen.ventasPorDia?.length">
                  <td colspan="3" class="empty-row">Sin datos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Productos Más Vendidos</h3>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let prod of resumen.productosMasVendidos">
                  <td>{{ prod.nombre }}</td>
                  <td>{{ prod.cantidad_vendida }}</td>
                  <td>Q{{ prod.total_ventas | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!resumen.productosMasVendidos?.length">
                  <td colspan="3" class="empty-row">Sin datos</td>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; letter-spacing: 0.5px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-md);
    }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

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
    .kpi-blue  { background: linear-gradient(135deg, #4a6fa5, #3a5a8a); }
    .kpi-green { background: linear-gradient(135deg, #5a9a6f, #4a8060); }
    .kpi-orange{ background: linear-gradient(135deg, #c48c3a, #a87030); }
    .kpi-teal  { background: linear-gradient(135deg, #4a7fa8, #366080); }

    .kpi-content { display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; opacity: 0.85; }
    .kpi-value { font-size: 28px; font-weight: 700; line-height: 1.1; }
    .kpi-sub { font-size: 12px; opacity: 0.8; }
    .kpi-warn { color: #ffe082 !important; opacity: 1 !important; }
    .kpi-icon { font-size: 40px; opacity: 0.25; }
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
      align-items: baseline;
      gap: var(--space-md);
    }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin: 0; }
    .card-subtitle { font-size: 12px; color: var(--text-secondary); }

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
  `]
})
export class DashboardComponent implements OnInit {
  resumen: DashboardResumen | null = null;
  currentUser: Usuario | null = null;
  menus: Menu[] = [];
  today = new Date();

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.menus = this.authService.getMenus().filter(m => m.puede_ver === 1 && !m.padre_id);
    this.loadResumen();
  }

  loadResumen(): void {
    this.api.get<DashboardResumen>('/dashboard/resumen').subscribe({
      next: (response) => {
        if (response.success) {
          this.resumen = response.data;
        }
      }
    });
  }
}
