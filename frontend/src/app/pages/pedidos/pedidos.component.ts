import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Producto { id: number; nombre: string; codigo_barras: string; precio: number; unidad: string; }
interface Pedido {
  id: number; numero: string; estado: string; total: number;
  sucursal_nombre: string; usuario_nombre: string; revisor_nombre: string;
  despachador_nombre: string; fecha_pedido: string; observaciones: string;
  comentario_revision: string; detalle?: any[];
}
interface Config {
  requiere_revision: number; requiere_despacho: number; descuenta_inventario: number;
  descuenta_en: string; rol_revisor_id: number | null; rol_despachador_id: number | null;
  permite_despacho_parcial: number;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado',
  recibido: 'Recibido', recibido_parcial: 'Parcial', cancelado: 'Cancelado'
};
const ESTADO_CLASS: Record<string, string> = {
  pendiente: 'chip-yellow', aprobado: 'chip-blue', rechazado: 'chip-red',
  recibido: 'chip-green', recibido_parcial: 'chip-orange', cancelado: 'chip-gray'
};

@Component({
  selector: 'app-pedidos',
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">PEDIDOS</h2>
          <p class="page-subtitle">Gestión de pedidos con flujo de aprobación</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost btn-sm" (click)="showConfigModal = true">
            <span class="material-icons">tune</span> Configurar flujo
          </button>
          <button class="btn btn-primary" (click)="abrirCrear()">
            <span class="material-icons">add</span> Nuevo pedido
          </button>
        </div>
      </div>

      <!-- Flujo visual -->
      <div class="flujo-banner" *ngIf="config">
        <div class="flujo-step" [class.active]="true">
          <span class="material-icons">edit_note</span> Crear
        </div>
        <span class="flujo-arrow">→</span>
        <div class="flujo-step" [class.active]="config.requiere_revision" [class.inactive]="!config.requiere_revision">
          <span class="material-icons">how_to_reg</span>
          {{ config.requiere_revision ? 'Aprobar' : 'Sin revisión' }}
        </div>
        <span class="flujo-arrow">→</span>
        <div class="flujo-step" [class.active]="config.requiere_despacho" [class.inactive]="!config.requiere_despacho">
          <span class="material-icons">move_to_inbox</span>
          {{ config.requiere_despacho ? 'Recibir' : 'Sin recepción' }}
        </div>
        <div class="flujo-inv" *ngIf="config.descuenta_inventario">
          <span class="material-icons">add_box</span>
          Ingresa al inventario al recibir
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-row">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input placeholder="Buscar por número, sucursal o usuario..." [(ngModel)]="search"
                 (input)="onSearch()" />
        </div>
        <select [(ngModel)]="filtroEstado" (change)="load()">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
          <option value="recibido">Recibido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <!-- Tabla -->
      <div class="card table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Estado</th>
                <th>Sucursal</th>
                <th>Solicitante</th>
                <th>Total</th>
                <th>Fecha</th>
                <th class="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="td-center">
                  <span class="material-icons spin">refresh</span> Cargando...
                </td>
              </tr>
              <tr *ngIf="!loading && pedidos.length === 0">
                <td colspan="7" class="td-center">No hay pedidos registrados</td>
              </tr>
              <tr *ngFor="let p of pedidos">
                <td><span class="num-badge">{{ p.numero }}</span></td>
                <td>
                  <span class="chip" [ngClass]="getEstadoClass(p.estado)">
                    {{ getEstadoLabel(p.estado) }}
                  </span>
                </td>
                <td class="td-sec">{{ p.sucursal_nombre }}</td>
                <td class="td-sec">{{ p.usuario_nombre }}</td>
                <td class="td-monto">Q {{ p.total | number:'1.2-2' }}</td>
                <td class="td-sec td-sm">{{ p.fecha_pedido | date:'dd/MM/yy HH:mm' }}</td>
                <td class="td-actions">
                  <button class="action-btn view" title="Ver detalle" (click)="verDetalle(p)">
                    <span class="material-icons">visibility</span>
                  </button>
                  <button class="action-btn approve" title="Aprobar"
                          *ngIf="p.estado === 'pendiente' && config?.requiere_revision"
                          (click)="accion(p, 'aprobar')">
                    <span class="material-icons">check_circle</span>
                  </button>
                  <button class="action-btn receive" title="Marcar como recibido"
                          *ngIf="(p.estado === 'aprobado' && config?.requiere_despacho) || (p.estado === 'pendiente' && !config?.requiere_revision)"
                          (click)="accion(p, 'recibir')">
                    <span class="material-icons">move_to_inbox</span>
                  </button>
                  <button class="action-btn reject" title="Rechazar"
                          *ngIf="['pendiente','aprobado'].includes(p.estado)"
                          (click)="accion(p, 'rechazar')">
                    <span class="material-icons">thumb_down</span>
                  </button>
                  <button class="action-btn cancel" title="Cancelar"
                          *ngIf="['pendiente','aprobado'].includes(p.estado)"
                          (click)="accion(p, 'cancelar')">
                    <span class="material-icons">block</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" [disabled]="page <= 1" (click)="goPage(page - 1)">
            <span class="material-icons">chevron_left</span>
          </button>
          <span class="page-info">{{ page }} / {{ totalPages }}</span>
          <button class="page-btn" [disabled]="page >= totalPages" (click)="goPage(page + 1)">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Modal: Crear Pedido ═══ -->
    <div class="modal-backdrop" *ngIf="showCrearModal" (click)="showCrearModal = false">
      <div class="modal modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons">add_shopping_cart</span> Nuevo Pedido</h3>
          <button class="modal-close" (click)="showCrearModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="crearForm" (ngSubmit)="crear()">
            <div class="form-group">
              <label>Observaciones</label>
              <input formControlName="observaciones" placeholder="Notas u observaciones del pedido..." />
            </div>

            <!-- Buscador de productos -->
            <div class="prod-search-row">
              <div class="search-box flex1">
                <span class="material-icons">search</span>
                <input placeholder="Buscar producto por nombre o código..."
                       [(ngModel)]="prodSearch" [ngModelOptions]="{standalone:true}"
                       (input)="buscarProductos()" />
              </div>
            </div>
            <div class="prod-results" *ngIf="prodResultados.length > 0">
              <div class="prod-result-item" *ngFor="let p of prodResultados" (click)="agregarProducto(p)">
                <span class="material-icons" style="font-size:16px; color: var(--text-disabled)">add_circle_outline</span>
                <span class="prod-nombre">{{ p.nombre }}</span>
                <span class="prod-codigo">{{ p.codigo_barras }}</span>
                <span class="prod-precio">Q {{ p.precio | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Detalle -->
            <div class="detalle-section" *ngIf="detalleItems.length > 0">
              <div class="detalle-header">
                <span>Producto</span><span>Cant.</span><span>Precio u.</span><span>Subtotal</span><span></span>
              </div>
              <div class="detalle-row" *ngFor="let item of detalleItems; let i = index">
                <span class="detalle-nombre">{{ item.nombre }}</span>
                <input type="number" min="1" [(ngModel)]="item.cantidad"
                       [ngModelOptions]="{standalone:true}"
                       (input)="recalcItem(i)" class="detalle-qty" />
                <div class="input-prefix sm">
                  <span>Q</span>
                  <input type="number" min="0" step="0.01" [(ngModel)]="item.precio_unitario"
                         [ngModelOptions]="{standalone:true}"
                         (input)="recalcItem(i)" />
                </div>
                <span class="detalle-sub">Q {{ item.subtotal | number:'1.2-2' }}</span>
                <button type="button" class="action-btn cancel" (click)="quitarItem(i)">
                  <span class="material-icons">delete_outline</span>
                </button>
              </div>
              <div class="detalle-total">
                <span>Total</span>
                <span class="detalle-total-val">Q {{ totalPedido | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="empty-detalle" *ngIf="detalleItems.length === 0">
              <span class="material-icons">shopping_cart</span>
              Busca y agrega productos al pedido
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="showCrearModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary"
                      [disabled]="detalleItems.length === 0 || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Creando...' : 'Crear Pedido' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ═══ Modal: Ver Detalle ═══ -->
    <div class="modal-backdrop" *ngIf="showDetalleModal" (click)="showDetalleModal = false">
      <div class="modal modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <span class="material-icons">receipt_long</span>
            Pedido {{ pedidoActual?.numero }}
            <span class="chip" [ngClass]="getEstadoClass(pedidoActual?.estado || '')" style="margin-left:8px">
              {{ getEstadoLabel(pedidoActual?.estado || '') }}
            </span>
          </h3>
          <button class="modal-close" (click)="showDetalleModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body" *ngIf="pedidoActual">
          <div class="detalle-info-grid">
            <div class="di-item"><div class="di-label">Sucursal</div><div class="di-val">{{ pedidoActual.sucursal_nombre }}</div></div>
            <div class="di-item"><div class="di-label">Solicitante</div><div class="di-val">{{ pedidoActual.usuario_nombre }}</div></div>
            <div class="di-item"><div class="di-label">Revisor</div><div class="di-val">{{ pedidoActual.revisor_nombre || '—' }}</div></div>
            <div class="di-item"><div class="di-label">Despachador</div><div class="di-val">{{ pedidoActual.despachador_nombre || '—' }}</div></div>
            <div class="di-item col2" *ngIf="pedidoActual.observaciones"><div class="di-label">Observaciones</div><div class="di-val">{{ pedidoActual.observaciones }}</div></div>
            <div class="di-item col2" *ngIf="pedidoActual.comentario_revision"><div class="di-label">Comentario revisión</div><div class="di-val">{{ pedidoActual.comentario_revision }}</div></div>
          </div>

          <div class="detalle-section" style="margin-top:16px">
            <div class="detalle-header">
              <span>Producto</span><span>Unidad</span><span>Cant.</span><span>Precio u.</span><span>Subtotal</span>
            </div>
            <div class="detalle-row readonly" *ngFor="let d of pedidoActual.detalle">
              <span class="detalle-nombre">{{ d.producto_nombre }}</span>
              <span class="td-sec">{{ d.unidad || '—' }}</span>
              <span class="td-sec">{{ d.cantidad }}</span>
              <span class="td-sec">Q {{ d.precio_unitario | number:'1.2-2' }}</span>
              <span class="detalle-sub">Q {{ d.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="detalle-total">
              <span>Total</span>
              <span class="detalle-total-val">Q {{ pedidoActual.total | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Modal: Aprobar / Rechazar / Cancelar ═══ -->
    <div class="modal-backdrop" *ngIf="showAccionModal && accionActual !== 'recibir'" (click)="showAccionModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <span class="material-icons">{{ accionActual === 'aprobar' ? 'check_circle' : accionActual === 'rechazar' ? 'thumb_down' : 'block' }}</span>
            {{ accionLabel }}
          </h3>
          <button class="modal-close" (click)="showAccionModal = false"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <p class="accion-desc">
            {{ accionActual === 'aprobar' ? '¿Aprobar el pedido ' : accionActual === 'rechazar' ? '¿Rechazar el pedido ' : '¿Cancelar el pedido ' }}
            <strong>{{ pedidoAccion?.numero }}</strong>?
          </p>
          <div class="form-group" *ngIf="accionActual === 'aprobar' || accionActual === 'rechazar'">
            <label>Comentario {{ accionActual === 'rechazar' ? '(requerido)' : '(opcional)' }}</label>
            <input [(ngModel)]="comentarioAccion"
                   placeholder="{{ accionActual === 'rechazar' ? 'Motivo del rechazo...' : 'Observaciones de la aprobación...' }}" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="showAccionModal = false">Cancelar</button>
            <button class="btn" [ngClass]="accionActual === 'rechazar' || accionActual === 'cancelar' ? 'btn-danger' : 'btn-primary'"
                    (click)="confirmarAccion()" [disabled]="(accionActual === 'rechazar' && !comentarioAccion) || saving">
              <span class="material-icons spin" *ngIf="saving">refresh</span>
              {{ saving ? 'Procesando...' : accionLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Modal: Recibir pedido (parcial + bonificación) ═══ -->
    <div class="modal-backdrop" *ngIf="showAccionModal && accionActual === 'recibir'" (click)="showAccionModal = false">
      <div class="modal modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons">move_to_inbox</span> Recibir Pedido {{ pedidoAccion?.numero }}</h3>
          <button class="modal-close" (click)="showAccionModal = false"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">

          <div class="recep-hint">
            <span class="material-icons">info</span>
            Ajusta la <strong>cantidad recibida</strong> si el proveedor entrega menos de lo pedido.
            Agrega <strong>bonificación</strong> si el proveedor envía unidades extra sin costo.
            Ambas se suman al inventario.
          </div>

          <!-- Tabla de recepción -->
          <div class="recep-table-wrap">
            <table class="recep-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="tc">Pedido</th>
                  <th class="tc">Recibido</th>
                  <th class="tc">Bonificación</th>
                  <th class="tc">Total ingresa</th>
                  <th class="tc">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ri of recepcionItems">
                  <td class="td-prod">{{ ri.nombre }}</td>
                  <td class="tc td-pedido">{{ ri.cantidad }}</td>
                  <td class="tc">
                    <input type="number" class="recep-input" min="0" [max]="ri.cantidad"
                           [(ngModel)]="ri.cantidad_recibida"
                           (ngModelChange)="recalcRecepcion(ri)" />
                  </td>
                  <td class="tc">
                    <input type="number" class="recep-input recep-bono" min="0"
                           [(ngModel)]="ri.bonificacion"
                           (ngModelChange)="recalcRecepcion(ri)" />
                  </td>
                  <td class="tc td-total">
                    <span [class.parcial]="ri.cantidad_recibida < ri.cantidad">
                      {{ ri.cantidad_recibida + ri.bonificacion }}
                    </span>
                  </td>
                  <td class="tc">
                    <span class="chip chip-sm" [ngClass]="ri.cantidad_recibida >= ri.cantidad ? 'chip-green' : ri.cantidad_recibida > 0 ? 'chip-orange' : 'chip-red'">
                      {{ ri.cantidad_recibida >= ri.cantidad ? 'Completo' : ri.cantidad_recibida > 0 ? 'Parcial' : 'Sin recibir' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-group" style="margin-top:16px">
            <label>Observaciones de recepción (opcional)</label>
            <input type="text" [(ngModel)]="obsRecepcion" placeholder="Ej: proveedor entrego 5 de 10 unidades..." />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="showAccionModal = false">Cancelar</button>
            <button class="btn btn-primary" (click)="confirmarRecibir()" [disabled]="saving">
              <span class="material-icons spin" *ngIf="saving">refresh</span>
              {{ saving ? 'Registrando...' : 'Confirmar Recepción' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Modal: Config flujo ═══ -->
    <div class="modal-backdrop" *ngIf="showConfigModal" (click)="showConfigModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons">tune</span> Configurar Flujo de Pedidos</h3>
          <button class="modal-close" (click)="showConfigModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body" *ngIf="configForm">
          <form [formGroup]="configForm" (ngSubmit)="guardarConfig()">
            <div class="toggle-group">
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Requiere revisión / aprobación</div>
                  <div class="toggle-desc">El pedido debe ser aprobado antes de recibirse</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" formControlName="requiere_revision" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Requiere paso de despacho</div>
                  <div class="toggle-desc">Se necesita confirmar el despacho físico por separado</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" formControlName="requiere_despacho" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Descuenta inventario automáticamente</div>
                  <div class="toggle-desc">Al procesar el pedido se descuenta el stock</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" formControlName="descuenta_inventario" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="form-group" *ngIf="configForm.value.descuenta_inventario">
                <label>¿Cuándo descontar inventario?</label>
                <select formControlName="descuenta_en">
                  <option value="aprobacion">Al aprobar</option>
                  <option value="recepcion">Al recibir</option>
                </select>
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Permite recepción parcial</div>
                  <div class="toggle-desc">Se puede recibir menos cantidad de la solicitada</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" formControlName="permite_despacho_parcial" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- Preview flujo -->
            <div class="flujo-preview">
              <div class="fp-title">Flujo resultante:</div>
              <div class="fp-steps">
                <span class="fp-step">Crear</span>
                <span class="fp-arrow">→</span>
                <span class="fp-step" [class.dim]="!configForm.value.requiere_revision">
                  {{ configForm.value.requiere_revision ? 'Aprobar' : '(sin aprobación)' }}
                </span>
                <span class="fp-arrow">→</span>
                <span class="fp-step" [class.dim]="!configForm.value.requiere_despacho">
                  {{ configForm.value.requiere_despacho ? 'Recibir' : '(sin recepción)' }}
                </span>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="showConfigModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : 'Guardar configuración' }}
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
    .page-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }
    .header-actions { display: flex; gap: var(--space-sm); align-items: center; }

    /* Flujo banner */
    .flujo-banner { display: flex; align-items: center; gap: 12px; padding: 12px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); flex-wrap: wrap; }
    .flujo-step { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-secondary); padding: 6px 12px; border-radius: var(--radius-full); background: var(--surface-hover); }
    .flujo-step.active { color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); }
    .flujo-step.inactive { opacity: .4; text-decoration: line-through; }
    .flujo-step .material-icons { font-size: 16px; }
    .flujo-arrow { color: var(--text-disabled); font-size: 18px; }
    .flujo-inv { margin-left: auto; font-size: 12px; color: var(--success); font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .flujo-inv .material-icons { font-size: 15px; }

    /* Filters */
    .filters-row { display: flex; gap: var(--space-md); align-items: center; }
    .search-box { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 12px; flex: 1; }
    .search-box .material-icons { font-size: 18px; color: var(--text-disabled); }
    .search-box input { border: none; background: none; outline: none; font-size: 14px; color: var(--text); width: 100%; }
    .search-box.flex1 { flex: 1; }
    .filters-row select { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; color: var(--text); background: var(--surface); outline: none; }

    /* Table */
    .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .data-table tbody tr:hover { background: var(--surface-hover); }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .th-actions { text-align: right; }
    .td-actions { text-align: right; white-space: nowrap; }
    .td-sec { color: var(--text-secondary); }
    .td-sm { font-size: 12px; }
    .td-monto { font-weight: 700; color: var(--text); }
    .td-center { text-align: center; padding: 32px; color: var(--text-disabled); font-style: italic; }

    /* Chips */
    .chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .chip-yellow { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #d97706; }
    .chip-blue   { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .chip-green  { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .chip-red    { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }
    .chip-gray   { background: color-mix(in srgb, var(--text-disabled) 15%, transparent); color: var(--text-disabled); }
    .chip-orange { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #d97706; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }

    /* Num badge */
    .num-badge { font-family: monospace; font-size: 13px; font-weight: 700; color: var(--text); background: var(--surface-hover); padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); }

    /* Action buttons */
    .action-btn { width: 30px; height: 30px; border: none; border-radius: var(--radius-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all var(--transition-fast); background: none; }
    .action-btn .material-icons { font-size: 17px; }
    .action-btn.view   { color: var(--primary); } .action-btn.view:hover   { background: color-mix(in srgb, var(--primary) 12%, transparent); }
    .action-btn.approve { color: var(--success); } .action-btn.approve:hover { background: color-mix(in srgb, var(--success) 12%, transparent); }
    .action-btn.reject   { color: var(--error); }  .action-btn.reject:hover  { background: color-mix(in srgb, var(--error) 12%, transparent); }
    .action-btn.receive  { color: #0ea5e9; }         .action-btn.receive:hover { background: color-mix(in srgb, #0ea5e9 12%, transparent); }
    .action-btn.cancel  { color: var(--text-disabled); } .action-btn.cancel:hover { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-md); padding: var(--space-md); border-top: 1px solid var(--border-light); }
    .page-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: var(--primary); color: #fff; border-color: var(--primary); }
    .page-btn:disabled { opacity: .4; cursor: default; }
    .page-info { font-size: 13px; color: var(--text-secondary); font-weight: 600; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: var(--radius-md); border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all var(--transition-fast); }
    .btn-primary { background: var(--primary); color: #fff; } .btn-primary:hover { background: var(--primary-dark); } .btn-primary:disabled { opacity: .6; cursor: default; }
    .btn-danger  { background: var(--error); color: #fff; } .btn-danger:hover { filter: brightness(.9); } .btn-danger:disabled { opacity: .6; cursor: default; }
    .btn-ghost   { background: none; border: 1px solid var(--border); color: var(--text-secondary); } .btn-ghost:hover { background: var(--surface-hover); }
    .btn-sm { padding: 5px 12px; font-size: 12px; }
    .btn .material-icons { font-size: 18px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 500px; max-height: 92vh; overflow-y: auto; }
    .modal-xl { max-width: 700px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface); z-index: 1; }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
    .modal-header h3 .material-icons { font-size: 20px; color: var(--primary); }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; border-radius: var(--radius-sm); padding: 4px; }
    .modal-close:hover { background: var(--surface-hover); }
    .modal-body { padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-sm); padding-top: var(--space-md); border-top: 1px solid var(--border-light); }

    /* Form */
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; color: var(--text); background: var(--surface); outline: none; }
    .form-group input:focus, .form-group select:focus { border-color: var(--primary); }

    /* Producto search */
    .prod-search-row { display: flex; gap: 8px; }
    .prod-results { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; max-height: 180px; overflow-y: auto; }
    .prod-result-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; border-bottom: 1px solid var(--border-light); font-size: 13px; }
    .prod-result-item:last-child { border-bottom: none; }
    .prod-result-item:hover { background: color-mix(in srgb, var(--primary) 6%, transparent); }
    .prod-nombre { flex: 1; font-weight: 500; color: var(--text); }
    .prod-codigo { font-size: 11px; color: var(--text-disabled); font-family: monospace; }
    .prod-precio { font-weight: 700; color: var(--primary); margin-left: auto; }

    /* Detalle */
    .detalle-section { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .detalle-header { display: grid; grid-template-columns: 1fr 70px 120px 100px 36px; gap: 8px; padding: 8px 12px; background: var(--surface-hover); font-size: 11px; font-weight: 700; color: var(--text-disabled); text-transform: uppercase; }
    .detalle-header.readonly { grid-template-columns: 1fr 70px 60px 100px 100px; }
    .detalle-row { display: grid; grid-template-columns: 1fr 70px 120px 100px 36px; gap: 8px; padding: 8px 12px; align-items: center; border-top: 1px solid var(--border-light); font-size: 13px; }
    .detalle-row.readonly { grid-template-columns: 1fr 70px 60px 100px 100px; }
    .detalle-nombre { font-weight: 500; color: var(--text); }
    .detalle-qty { width: 100%; padding: 5px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; text-align: center; outline: none; }
    .detalle-sub { font-weight: 700; color: var(--text); text-align: right; }
    .detalle-total { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--surface-hover); border-top: 2px solid var(--border); font-weight: 600; font-size: 14px; }
    .detalle-total-val { font-size: 20px; font-weight: 800; color: var(--text); }
    .input-prefix.sm { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
    .input-prefix.sm span { padding: 5px 7px; background: var(--surface-hover); font-size: 12px; font-weight: 600; color: var(--text-secondary); border-right: 1px solid var(--border); }
    .input-prefix.sm input { border: none; padding: 5px 7px; font-size: 13px; color: var(--text); background: var(--surface); outline: none; width: 70px; }
    .empty-detalle { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 28px; color: var(--text-disabled); font-size: 13px; border: 1px dashed var(--border); border-radius: var(--radius-md); }
    .empty-detalle .material-icons { font-size: 22px; }

    /* Detalle info grid */
    .detalle-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
    .di-item { background: var(--surface-hover); border-radius: var(--radius-md); padding: 10px 14px; }
    .di-item.col2 { grid-column: 1 / -1; }
    .di-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
    .di-val { font-size: 14px; font-weight: 500; color: var(--text); }

    /* Acción modal */
    .accion-desc { font-size: 14px; color: var(--text-secondary); margin: 0; }

    /* Toggle config */
    .toggle-group { display: flex; flex-direction: column; gap: var(--space-md); }
    .toggle-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-light); }
    .toggle-item:last-child { border-bottom: none; }
    .toggle-label { font-size: 14px; font-weight: 600; color: var(--text); }
    .toggle-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
    .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; inset: 0; background: var(--border); border-radius: 24px; transition: .3s; }
    .slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }
    input:checked + .slider { background: var(--primary); }
    input:checked + .slider:before { transform: translateX(20px); }

    /* Flujo preview */
    .flujo-preview { background: var(--surface-hover); border-radius: var(--radius-md); padding: 12px 16px; margin-top: 8px; }
    .fp-title { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; }
    .fp-steps { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .fp-step { font-size: 13px; font-weight: 600; color: var(--primary); padding: 4px 12px; background: color-mix(in srgb, var(--primary) 10%, transparent); border-radius: var(--radius-full); }
    .fp-step.dim { color: var(--text-disabled); background: var(--surface); opacity: .6; }
    .fp-arrow { color: var(--text-disabled); }

    /* Recepción modal */
    .recep-hint { display:flex; gap:10px; align-items:flex-start; padding:12px 16px; background:color-mix(in srgb,var(--primary) 6%,transparent); border:1px solid color-mix(in srgb,var(--primary) 15%,transparent); border-radius:var(--radius-md); font-size:13px; color:var(--text-secondary); margin-bottom:16px; }
    .recep-hint .material-icons { color:var(--primary); font-size:18px; flex-shrink:0; margin-top:1px; }
    .recep-table-wrap { overflow-x:auto; border:1px solid var(--border); border-radius:var(--radius-md); }
    .recep-table { width:100%; border-collapse:collapse; font-size:13px; }
    .recep-table th { padding:10px 12px; background:var(--surface-hover); font-weight:700; font-size:11px; color:var(--text-secondary); text-transform:uppercase; border-bottom:1px solid var(--border); }
    .recep-table td { padding:10px 12px; border-bottom:1px solid var(--border-light); color:var(--text); }
    .recep-table tr:last-child td { border-bottom:none; }
    .recep-table .tc { text-align:center; }
    .td-prod { font-weight:600; }
    .td-pedido { color:var(--text-secondary); font-weight:700; }
    .td-total { font-weight:800; }
    .td-total .parcial { color:#d97706; }
    .recep-input { width:64px; text-align:center; border:1px solid var(--border); border-radius:var(--radius-sm); padding:5px 6px; font-size:13px; font-weight:600; color:var(--text); background:var(--surface); outline:none; }
    .recep-input:focus { border-color:var(--primary); }
    .recep-bono { border-color:#10b981; color:#059669; }
    .recep-bono:focus { border-color:#059669; }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  config: Config | null = null;
  loading = false;
  saving = false;
  page = 1;
  totalPages = 1;
  search = '';
  filtroEstado = '';
  private searchTimer: any;

  showCrearModal = false;
  showDetalleModal = false;
  showAccionModal = false;
  showConfigModal = false;

  crearForm!: FormGroup;
  configForm!: FormGroup;

  prodSearch = '';
  prodResultados: Producto[] = [];
  detalleItems: any[] = [];

  pedidoActual: Pedido | null = null;
  pedidoAccion: Pedido | null = null;
  accionActual: 'aprobar' | 'rechazar' | 'recibir' | 'cancelar' = 'aprobar';
  comentarioAccion = '';
  recepcionItems: any[] = [];
  obsRecepcion = '';

  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  get accionLabel(): string {
    const labels: Record<string, string> = {
      aprobar: 'Aprobar pedido', rechazar: 'Rechazar pedido',
      recibir: 'Marcar como recibido', cancelar: 'Cancelar pedido'
    };
    return labels[this.accionActual] || '';
  }

  get totalPedido(): number {
    return this.detalleItems.reduce((s, i) => s + (i.subtotal || 0), 0);
  }

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.crearForm = this.fb.group({ observaciones: [''] });
    this.loadConfig();
    this.load();
  }

  loadConfig(): void {
    this.api.get<Config>('/pedidos/config').subscribe({
      next: r => {
        this.config = r.data as any;
        this.configForm = this.fb.group({
          requiere_revision:        [!!this.config?.requiere_revision],
          requiere_despacho:        [!!this.config?.requiere_despacho],
          descuenta_inventario:     [!!this.config?.descuenta_inventario],
          descuenta_en:             [this.config?.descuenta_en || 'despacho'],
          permite_despacho_parcial: [!!this.config?.permite_despacho_parcial]
        });
      }
    });
  }

  load(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: 20 };
    if (this.search) params.search = this.search;
    if (this.filtroEstado) params.estado = this.filtroEstado;

    this.api.get<Pedido[]>('/pedidos', params).subscribe({
      next: (r: any) => {
        this.pedidos = r.data;
        this.totalPages = r.pagination?.totalPages || 1;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.load(); }, 350);
  }

  goPage(p: number): void { this.page = p; this.load(); }

  getEstadoLabel(e: string): string { return ESTADO_LABEL[e] || e; }
  getEstadoClass(e: string): string { return ESTADO_CLASS[e] || ''; }

  abrirCrear(): void {
    this.detalleItems = [];
    this.prodSearch = '';
    this.prodResultados = [];
    this.crearForm.reset();
    this.showCrearModal = true;
  }

  buscarProductos(): void {
    if (!this.prodSearch.trim()) { this.prodResultados = []; return; }
    this.api.get<Producto[]>('/productos', { search: this.prodSearch, limit: 8 }).subscribe({
      next: (r: any) => { this.prodResultados = r.data || []; }
    });
  }

  agregarProducto(p: Producto): void {
    const existe = this.detalleItems.find(i => i.producto_id === p.id);
    if (existe) { existe.cantidad++; this.recalcItem(this.detalleItems.indexOf(existe)); return; }
    this.detalleItems.push({
      producto_id: p.id, nombre: p.nombre, unidad: p.unidad,
      cantidad: 1, precio_unitario: p.precio || 0, subtotal: p.precio || 0
    });
    this.prodSearch = '';
    this.prodResultados = [];
  }

  recalcItem(i: number): void {
    const item = this.detalleItems[i];
    item.subtotal = Math.round((item.cantidad * (item.precio_unitario || 0)) * 100) / 100;
  }

  quitarItem(i: number): void { this.detalleItems.splice(i, 1); }

  crear(): void {
    if (!this.detalleItems.length) return;
    this.saving = true;
    const payload = {
      observaciones: this.crearForm.value.observaciones || null,
      detalle: this.detalleItems.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario
      }))
    };
    this.api.post('/pedidos', payload).subscribe({
      next: (r: any) => {
        this.saving = false;
        this.showCrearModal = false;
        this.showToast(`Pedido ${r.data?.numero} creado exitosamente`);
        this.load();
      },
      error: e => { this.saving = false; this.showToast(e?.error?.message || 'Error al crear', true); }
    });
  }

  verDetalle(p: Pedido): void {
    this.api.get<Pedido>(`/pedidos/${p.id}`).subscribe({
      next: r => { this.pedidoActual = r.data as any; this.showDetalleModal = true; }
    });
  }

  accion(p: Pedido, tipo: 'aprobar' | 'rechazar' | 'recibir' | 'cancelar'): void {
    this.pedidoAccion = p;
    this.accionActual = tipo;
    this.comentarioAccion = '';
    if (tipo === 'recibir') {
      this.obsRecepcion = '';
      // Cargar detalle del pedido para la tabla de recepción
      this.api.get<Pedido>(`/pedidos/${p.id}`).subscribe({
        next: r => {
          const detalle = (r.data as any)?.detalle || [];
          this.recepcionItems = detalle.map((d: any) => ({
            detalle_id: d.id,
            nombre: d.producto_nombre,
            cantidad: d.cantidad,
            cantidad_recibida: d.cantidad,
            bonificacion: 0
          }));
          this.showAccionModal = true;
        }
      });
    } else {
      this.showAccionModal = true;
    }
  }

  recalcRecepcion(ri: any): void {
    ri.cantidad_recibida = Math.max(0, +ri.cantidad_recibida || 0);
    ri.bonificacion      = Math.max(0, +ri.bonificacion || 0);
  }

  confirmarRecibir(): void {
    if (!this.pedidoAccion) return;
    this.saving = true;
    const payload = {
      observaciones_recepcion: this.obsRecepcion || null,
      items: this.recepcionItems.map(ri => ({
        detalle_id: ri.detalle_id,
        cantidad_recibida: ri.cantidad_recibida,
        bonificacion: ri.bonificacion
      }))
    };
    this.api.post(`/pedidos/${this.pedidoAccion.id}/recibir`, payload).subscribe({
      next: (r: any) => {
        this.saving = false;
        this.showAccionModal = false;
        const msg = r.data?.parcial
          ? 'Recepción parcial registrada — stock actualizado'
          : 'Pedido recibido completamente — stock actualizado';
        this.showToast(msg);
        this.load();
      },
      error: e => { this.saving = false; this.showToast(e?.error?.message || 'Error al recibir', true); }
    });
  }

  confirmarAccion(): void {
    if (!this.pedidoAccion) return;
    this.saving = true;
    const id = this.pedidoAccion.id;
    const body = (this.accionActual === 'aprobar' || this.accionActual === 'rechazar')
      ? { comentario_revision: this.comentarioAccion || null }
      : {};

    this.api.post(`/pedidos/${id}/${this.accionActual}`, body).subscribe({
      next: () => {
        this.saving = false;
        this.showAccionModal = false;
        this.showToast(`Pedido ${this.accionLabel.toLowerCase()} exitosamente`);
        this.load();
      },
      error: e => { this.saving = false; this.showToast(e?.error?.message || 'Error', true); }
    });
  }

  guardarConfig(): void {
    this.saving = true;
    this.api.put('/pedidos/config', this.configForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.showConfigModal = false;
        this.showToast('Configuración guardada');
        this.loadConfig();
      },
      error: e => { this.saving = false; this.showToast(e?.error?.message || 'Error', true); }
    });
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3500);
  }
}
