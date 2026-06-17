import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlanService } from '../../services/plan.service';
import { CarritoService } from '../../services/carrito.service';

interface Producto {
  id: number;
  nombre: string;
  tipo: 'producto' | 'medicamento' | 'servicio';
  categoria_id: number;
  categoria_nombre: string;
  codigo_barras: string;
  unidad: string;
  precio: number;
  costo: number;
  requiere_receta: number;
  estado: number;
  stock_total: number;
  stock_minimo: number;
  stock_maximo: number;
}

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-productos',
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">PRODUCTOS</h2>
          <p class="page-subtitle">Catálogo de productos, medicamentos y servicios</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <span class="material-icons">add_box</span> Nuevo Producto
        </button>
      </div>

      <!-- Filtros -->
      <div class="card filters-bar">
        <div class="filter-search">
          <span class="material-icons search-icon">search</span>
          <input class="search-input" placeholder="Buscar por nombre o código de barras..."
                 [(ngModel)]="search" (input)="onSearch()" />
        </div>
        <div class="filter-selects">
          <select [(ngModel)]="filterCategoria" (change)="onSearch()">
            <option value="">Todas las categorías</option>
            <option *ngFor="let c of categorias" [value]="c.id">{{ c.nombre }}</option>
          </select>
          <select [(ngModel)]="filterTipo" (change)="onSearch()">
            <option value="">Todos los tipos</option>
            <option value="producto">Producto</option>
            <option value="medicamento">Medicamento</option>
            <option value="servicio">Servicio</option>
          </select>
          <select [(ngModel)]="filterEstado" (change)="onSearch()">
            <option value="">Todos</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Cód. Barras</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="10" class="td-loading">
                  <span class="material-icons spin">refresh</span> Cargando...
                </td>
              </tr>
              <tr *ngIf="!loading && productos.length === 0">
                <td colspan="10" class="td-empty">No se encontraron productos</td>
              </tr>
              <tr *ngFor="let p of productos">
                <td class="td-id">{{ p.id }}</td>
                <td>
                  <div class="product-cell">
                    <div class="prod-icon" [ngClass]="'icon-' + p.tipo">
                      <span class="material-icons">{{ tipoIcon(p.tipo) }}</span>
                    </div>
                    <div>
                      <div class="prod-name">{{ p.nombre }}</div>
                      <div class="prod-unit">{{ p.unidad }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="chip" [ngClass]="'chip-' + p.tipo">{{ tipoLabel(p.tipo) }}</span>
                </td>
                <td class="td-sec">{{ p.categoria_nombre || '—' }}</td>
                <td class="td-mono">{{ p.codigo_barras || '—' }}</td>
                <td class="td-num">Q {{ p.precio | number:'1.2-2' }}</td>
                <td class="td-num td-sec">Q {{ p.costo | number:'1.2-2' }}</td>
                <td>
                  <div class="stock-cell">
                    <span class="stock-badge"
                          [ngClass]="p.stock_total <= 0 ? 'stock-zero' : p.stock_minimo > 0 && p.stock_total <= p.stock_minimo ? 'stock-low' : 'stock-ok'">
                      {{ p.stock_total }}
                    </span>
                    <span class="stock-low-tag" *ngIf="p.stock_minimo > 0 && p.stock_total <= p.stock_minimo && p.stock_total > 0">
                      <span class="material-icons">warning</span> Bajo
                    </span>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="p.estado === 1 ? 'badge-green' : 'badge-red'">
                    {{ p.estado === 1 ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="icon-btn" title="Editar" (click)="openEdit(p)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="icon-btn icon-btn-danger" title="Desactivar" (click)="toggleEstado(p)">
                    <span class="material-icons">{{ p.estado === 1 ? 'toggle_on' : 'toggle_off' }}</span>
                  </button>
                  <button class="icon-btn icon-btn-pedir"
                          [title]="planService.canUsePedidos() ? 'Agregar al carrito de pedido' : 'Requiere plan Plus o Full'"
                          (click)="planService.canUsePedidos() ? carrito.agregar(p) : mostrarLock()">
                    <span class="material-icons">{{ planService.canUsePedidos() ? 'add_shopping_cart' : 'lock' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="table-footer">
          <span class="total-count">{{ total }} productos</span>
          <div class="pagination">
            <button class="page-btn" [disabled]="page === 1" (click)="changePage(page - 1)">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button class="page-btn" [disabled]="page === totalPages" (click)="changePage(page + 1)">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal crear / editar -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">

              <!-- Nombre -->
              <div class="form-group col-2">
                <label>Nombre *</label>
                <input formControlName="nombre" placeholder="Nombre del producto" />
                <span class="field-error" *ngIf="f['nombre'].touched && f['nombre'].invalid">Requerido</span>
              </div>

              <!-- Tipo -->
              <div class="form-group">
                <label>Tipo *</label>
                <select formControlName="tipo">
                  <option value="producto">Producto</option>
                  <option value="medicamento">Medicamento</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <!-- Categoría -->
              <div class="form-group">
                <label>Categoría</label>
                <select formControlName="categoria_id">
                  <option [value]="null">Sin categoría</option>
                  <option *ngFor="let c of categorias" [value]="c.id">{{ c.nombre }}</option>
                </select>
              </div>

              <!-- Código barras -->
              <div class="form-group">
                <label>Código de barras</label>
                <input formControlName="codigo_barras" placeholder="Ej: 7501234567890" />
              </div>

              <!-- Unidad -->
              <div class="form-group">
                <label>Unidad</label>
                <select formControlName="unidad">
                  <option value="unidad">Unidad</option>
                  <option value="caja">Caja</option>
                  <option value="blister">Blíster</option>
                  <option value="frasco">Frasco</option>
                  <option value="ampolla">Ampolla</option>
                  <option value="kg">Kilogramo</option>
                  <option value="litro">Litro</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <!-- Precio -->
              <div class="form-group">
                <label>Precio de venta *</label>
                <div class="input-prefix">
                  <span>Q</span>
                  <input type="number" step="0.01" min="0" formControlName="precio" placeholder="0.00" />
                </div>
                <span class="field-error" *ngIf="f['precio'].touched && f['precio'].invalid">Requerido</span>
              </div>

              <!-- Costo -->
              <div class="form-group">
                <label>Costo</label>
                <div class="input-prefix">
                  <span>Q</span>
                  <input type="number" step="0.01" min="0" formControlName="costo" placeholder="0.00" />
                </div>
              </div>

              <!-- Margen (calculado) -->
              <div class="form-group" *ngIf="margen !== null">
                <label>Margen estimado</label>
                <div class="margen-display" [ngClass]="margen >= 0 ? 'margen-pos' : 'margen-neg'">
                  <span class="material-icons">{{ margen >= 0 ? 'trending_up' : 'trending_down' }}</span>
                  {{ margen | number:'1.1-1' }}%
                </div>
              </div>

              <!-- Requiere receta (solo medicamentos) -->
              <div class="form-group form-group-check" *ngIf="f['tipo'].value === 'medicamento'">
                <label class="check-label">
                  <input type="checkbox" formControlName="requiere_receta" />
                  <span>Requiere receta médica</span>
                </label>
              </div>

              <!-- Estado (solo edición) -->
              <div class="form-group form-group-check" *ngIf="editingId">
                <label class="check-label">
                  <input type="checkbox" formControlName="estado" />
                  <span>Producto activo</span>
                </label>
              </div>

              <!-- Stock inicial (solo creación) -->
              <ng-container *ngIf="!editingId">
                <div class="form-group col-2 section-divider">
                  <div class="section-title">
                    <span class="material-icons">inventory</span> Stock inicial (opcional)
                  </div>
                </div>
                <div class="form-group">
                  <label>Cantidad inicial</label>
                  <input type="number" min="0" formControlName="stock_inicial" placeholder="0" />
                </div>
                <div class="form-group" *ngIf="planService.isPlus">
                  <label>Bodega</label>
                  <select formControlName="bodega_id">
                    <option [value]="null">Seleccionar bodega</option>
                    <option *ngFor="let b of bodegas" [value]="b.id">{{ b.nombre }} ({{ b.sucursal_nombre }})</option>
                  </select>
                </div>
                <div class="bodega-auto-note" *ngIf="!planService.isPlus">
                  <span class="material-icons">info</span>
                  Se usará la bodega principal de tu sucursal automáticamente
                </div>
              </ng-container>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Producto') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" [class.show]="toast.show" [class.toast-error]="toast.error">
      <span class="material-icons">{{ toast.error ? 'error' : 'check_circle' }}</span>
      {{ toast.msg }}
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: var(--space-lg); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; letter-spacing: .5px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }

    /* Filtros */
    .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .filters-bar { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-sm) var(--space-md); flex-wrap: wrap; }
    .filter-search { display: flex; align-items: center; gap: var(--space-sm); flex: 1; min-width: 200px; }
    .search-icon { color: var(--text-disabled); font-size: 20px; }
    .search-input { border: none; outline: none; background: none; font-size: 14px; color: var(--text); flex: 1; }
    .filter-selects { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
    .filter-selects select { padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; color: var(--text); background: var(--surface); outline: none; cursor: pointer; }

    /* Tabla */
    .table-card { }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table thead tr { border-bottom: 2px solid var(--border); }
    .data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
    .data-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .data-table tbody tr:hover { background: var(--surface-hover); }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .td-id { color: var(--text-disabled); font-size: 12px; font-family: monospace; }
    .td-sec { color: var(--text-secondary); }
    .td-mono { font-family: monospace; font-size: 12px; color: var(--text-secondary); }
    .td-num { font-weight: 600; text-align: right; }
    .td-actions { display: flex; gap: 4px; }
    .td-loading, .td-empty { text-align: center; padding: 40px; color: var(--text-disabled); }
    .td-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }

    /* Product cell */
    .product-cell { display: flex; align-items: center; gap: 10px; }
    .prod-icon { width: 34px; height: 34px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .prod-icon .material-icons { font-size: 18px; }
    .icon-producto { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .icon-medicamento { background: color-mix(in srgb, #10b981 12%, transparent); color: #10b981; }
    .icon-servicio { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }
    .prod-name { font-weight: 600; color: var(--text); font-size: 13px; }
    .prod-unit { font-size: 11px; color: var(--text-disabled); }

    /* Chips */
    .chip { display: inline-flex; padding: 3px 9px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .chip-producto { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .chip-medicamento { background: color-mix(in srgb, #10b981 12%, transparent); color: #10b981; }
    .chip-servicio { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }

    /* Stock badge */
    .stock-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; padding: 3px 8px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700; }
    .stock-ok { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .stock-zero { background: color-mix(in srgb, var(--error) 10%, transparent); color: var(--error); }
    .stock-low { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #d97706; }
    .stock-cell { display: flex; align-items: center; gap: 6px; }
    .stock-low-tag { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 600; color: #d97706; }
    .stock-low-tag .material-icons { font-size: 13px; }

    /* Badges estado */
    .badge { display: inline-flex; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .badge-green { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .badge-red { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }

    /* Table footer */
    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: var(--space-sm) var(--space-md); border-top: 1px solid var(--border-light); }
    .total-count { font-size: 12px; color: var(--text-secondary); }
    .pagination { display: flex; align-items: center; gap: var(--space-sm); }
    .page-btn { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); }
    .page-btn:disabled { opacity: .4; cursor: default; }
    .page-info { font-size: 13px; color: var(--text-secondary); min-width: 60px; text-align: center; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: var(--radius-md); border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all var(--transition-fast); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-primary:disabled { opacity: .6; cursor: default; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn .material-icons { font-size: 18px; }
    .icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: var(--radius-sm); color: var(--text-secondary); display: flex; align-items: center; transition: all var(--transition-fast); }
    .icon-btn:hover { background: var(--surface-active); color: var(--primary); }
    .icon-btn-danger:hover { color: var(--error); }
    .icon-btn-pedir { color: var(--text-disabled); }
    .icon-btn-pedir:hover { color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); }
    .icon-btn .material-icons { font-size: 18px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
    .modal-lg { max-width: 680px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface); z-index: 1; }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; border-radius: var(--radius-sm); padding: 4px; }
    .modal-close:hover { background: var(--surface-hover); }
    .modal-body { padding: var(--space-lg); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-light); }

    /* Form */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .col-2 { grid-column: 1 / -1; }
    .form-group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; color: var(--text); background: var(--surface); outline: none; transition: border-color var(--transition-fast); }
    .form-group input:focus, .form-group select:focus { border-color: var(--primary); }
    .field-error { font-size: 11px; color: var(--error); }
    .form-group-check { justify-content: flex-end; padding-bottom: 4px; }
    .check-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); }
    .check-label input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--primary); }

    /* Input prefix */
    .input-prefix { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .input-prefix span { padding: 8px 10px; background: var(--surface-hover); font-size: 13px; font-weight: 600; color: var(--text-secondary); border-right: 1px solid var(--border); }
    .input-prefix input { border: none; padding: 8px 10px; font-size: 14px; color: var(--text); background: var(--surface); outline: none; flex: 1; }

    /* Margen */
    .margen-display { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; padding: 8px 12px; border-radius: var(--radius-md); }
    .margen-pos { background: color-mix(in srgb, var(--success) 10%, transparent); color: var(--success); }
    .margen-neg { background: color-mix(in srgb, var(--error) 10%, transparent); color: var(--error); }
    .margen-display .material-icons { font-size: 18px; }

    /* Section divider */
    .section-divider { border-top: 1px solid var(--border-light); padding-top: var(--space-md); margin-top: var(--space-sm); }
    .section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text-secondary); }
    .section-title .material-icons { font-size: 16px; }
    .bodega-auto-note { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); padding: 8px 12px; background: color-mix(in srgb, var(--primary) 6%, transparent); border-radius: var(--radius-md); border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent); }
    .bodega-auto-note .material-icons { font-size: 15px; color: var(--primary); flex-shrink: 0; }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Pedido rápido */
    .pedido-prod-info { display: flex; gap: 14px; align-items: flex-start; padding: 14px; background: var(--surface-hover); border-radius: var(--radius-md); border: 1px solid var(--border); }
    .ppi-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ppi-icon .material-icons { font-size: 22px; }
    .ppi-nombre { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .ppi-detalle { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ppi-minimo { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
    .pedido-sugerencia { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: color-mix(in srgb, #f59e0b 8%, transparent); border: 1px solid color-mix(in srgb, #f59e0b 25%, transparent); border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); flex-wrap: wrap; }
    .pedido-sugerencia .material-icons { font-size: 16px; color: #d97706; }
    .pedido-sugerencia strong { color: var(--text); }
    .btn-link { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
    .input-field { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; color: var(--text); background: var(--surface); outline: none; width: 100%; box-sizing: border-box; }
    .input-field:focus { border-color: var(--primary); }
    .input-prefix-wrap { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .input-prefix-wrap span { padding: 8px 10px; background: var(--surface-hover); font-size: 13px; font-weight: 600; color: var(--text-secondary); border-right: 1px solid var(--border); }
    .input-prefix-wrap input { border: none; padding: 8px 10px; font-size: 14px; color: var(--text); background: var(--surface); outline: none; flex: 1; width: 100%; }
  `]
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  bodegas: any[] = [];

  search = '';
  filterCategoria = '';
  filterTipo = '';
  filterEstado = '';
  page = 1;
  limit = 15;
  total = 0;
  totalPages = 1;
  loading = false;
  saving = false;

  showModal = false;
  editingId: number | null = null;
  form!: FormGroup;

  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router,
    public planService: PlanService,
    public carrito: CarritoService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.loadCategorias();
    this.loadBodegas();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipo: ['producto', Validators.required],
      categoria_id: [null],
      codigo_barras: [''],
      unidad: ['unidad'],
      precio: [0, [Validators.required, Validators.min(0)]],
      costo: [0],
      requiere_receta: [false],
      estado: [true],
      stock_inicial: [0],
      bodega_id: [null]
    });
  }

  get f() { return this.form.controls; }

  get margen(): number | null {
    const precio = +this.form.value.precio;
    const costo = +this.form.value.costo;
    if (!precio) return null;
    return ((precio - costo) / precio) * 100;
  }

  load(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, search: this.search };
    if (this.filterCategoria) params.categoria_id = this.filterCategoria;
    if (this.filterTipo) params.tipo = this.filterTipo;
    if (this.filterEstado !== '') params.estado = this.filterEstado;

    this.api.get<Producto[]>('/productos', params).subscribe({
      next: r => {
        this.loading = false;
        this.productos = r.data as any;
        if (r.pagination) {
          this.total = r.pagination.total;
          this.totalPages = r.pagination.totalPages;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  loadCategorias(): void {
    this.api.get<Categoria[]>('/categorias').subscribe({
      next: r => { this.categorias = r.data as any; }
    });
  }

  loadBodegas(): void {
    this.api.get<any[]>('/bodegas').subscribe({
      next: r => { this.bodegas = r.data as any; },
      error: () => {}
    });
  }

  onSearch(): void { this.page = 1; this.load(); }
  changePage(p: number): void { this.page = p; this.load(); }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({
      tipo: 'producto', unidad: 'unidad',
      precio: 0, costo: 0,
      requiere_receta: false, estado: true,
      stock_inicial: 0, bodega_id: null
    });
    this.showModal = true;
  }

  openEdit(p: Producto): void {
    this.editingId = p.id;
    this.form.patchValue({
      nombre: p.nombre,
      tipo: p.tipo,
      categoria_id: p.categoria_id,
      codigo_barras: p.codigo_barras || '',
      unidad: p.unidad || 'unidad',
      precio: p.precio,
      costo: p.costo,
      requiere_receta: p.requiere_receta === 1,
      estado: p.estado === 1
    });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;

    const payload: any = {
      nombre: v.nombre,
      tipo: v.tipo,
      categoria_id: v.categoria_id || null,
      codigo_barras: v.codigo_barras || null,
      unidad: v.unidad,
      precio: +v.precio,
      costo: +v.costo,
      requiere_receta: v.requiere_receta ? 1 : 0,
      estado: v.estado ? 1 : 0
    };

    if (!this.editingId) {
      payload.stock_inicial = +v.stock_inicial || 0;
      payload.bodega_id = v.bodega_id || null;
    }

    const obs = this.editingId
      ? this.api.put(`/productos/${this.editingId}`, payload)
      : this.api.post('/productos', payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        this.showToast(this.editingId ? 'Producto actualizado' : 'Producto creado');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al guardar', true);
      }
    });
  }

  toggleEstado(p: Producto): void {
    const nuevoEstado = p.estado === 1 ? 0 : 1;
    const msg = nuevoEstado === 0 ? `¿Desactivar "${p.nombre}"?` : `¿Activar "${p.nombre}"?`;
    if (!confirm(msg)) return;
    this.api.put(`/productos/${p.id}`, {
      nombre: p.nombre, tipo: p.tipo, categoria_id: p.categoria_id,
      codigo_barras: p.codigo_barras, unidad: p.unidad,
      precio: p.precio, costo: p.costo,
      requiere_receta: p.requiere_receta, estado: nuevoEstado
    }).subscribe({
      next: () => { this.load(); this.showToast(nuevoEstado === 1 ? 'Producto activado' : 'Producto desactivado'); },
      error: () => this.showToast('Error al cambiar estado', true)
    });
  }

  tipoLabel(tipo: string): string {
    return { producto: 'Producto', medicamento: 'Medicamento', servicio: 'Servicio' }[tipo] || tipo;
  }

  tipoIcon(tipo: string): string {
    return { producto: 'inventory_2', medicamento: 'medication', servicio: 'miscellaneous_services' }[tipo] || 'inventory_2';
  }

  mostrarLock(): void {
    this.showToast('Esta función requiere plan Plus o Full', true);
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3500);
  }
}
