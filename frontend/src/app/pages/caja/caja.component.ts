import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CajaService, CajaActiva } from '../../services/caja.service';

interface Sucursal { id: number; nombre: string; }
interface Movimiento { id: number; tipo: string; categoria: string; monto: number; descripcion: string; fecha: string; usuario_nombre: string; }
interface Denominacion { valor: number; label: string; tipo: 'billete' | 'moneda'; cantidad: number; }

@Component({
  selector: 'app-caja',
  template: `
    <div class="page">

      <!-- ESTADO: CARGANDO -->
      <div class="loading-state" *ngIf="cargando">
        <span class="material-icons spin">refresh</span> Verificando caja...
      </div>

      <!-- ESTADO: SIN CAJA ABIERTA -->
      <ng-container *ngIf="!caja && !cargando">
        <div class="page-header">
          <div>
            <h2 class="page-title">CAJA</h2>
            <p class="page-subtitle">No hay caja abierta en tu sucursal</p>
          </div>
        </div>

        <div class="empty-caja">
          <div class="empty-icon-wrap">
            <span class="material-icons empty-icon">account_balance_wallet</span>
          </div>
          <h3>No hay caja abierta</h3>
          <p>Debes abrir una caja para poder realizar ventas y registrar movimientos.</p>
          <button class="btn btn-primary btn-lg" (click)="abrirModal()">
            <span class="material-icons">lock_open</span> Abrir Caja
          </button>
        </div>
      </ng-container>

      <!-- ESTADO: CAJA ABIERTA -->
      <ng-container *ngIf="caja">
        <div class="page-header">
          <div>
            <h2 class="page-title">CAJA</h2>
            <p class="page-subtitle">{{ caja.sucursal_nombre }} · Abierta por {{ caja.usuario_nombre }}</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-ghost" (click)="showMovimientoModal = true">
              <span class="material-icons">swap_horiz</span> Movimiento
            </button>
            <button class="btn btn-danger" (click)="openCerrarModal()">
              <span class="material-icons">lock</span> Cerrar Caja
            </button>
          </div>
        </div>

        <!-- Resumen de caja -->
        <div class="resumen-grid">
          <div class="resumen-card resumen-blue">
            <span class="material-icons">account_balance_wallet</span>
            <div>
              <div class="resumen-label">Monto inicial</div>
              <div class="resumen-val">Q {{ caja.monto_inicial | number:'1.2-2' }}</div>
            </div>
          </div>
          <div class="resumen-card resumen-green">
            <span class="material-icons">arrow_downward</span>
            <div>
              <div class="resumen-label">Total ingresos</div>
              <div class="resumen-val">Q {{ totalIngresos | number:'1.2-2' }}</div>
            </div>
          </div>
          <div class="resumen-card resumen-red">
            <span class="material-icons">arrow_upward</span>
            <div>
              <div class="resumen-label">Total egresos</div>
              <div class="resumen-val">Q {{ totalEgresos | number:'1.2-2' }}</div>
            </div>
          </div>
          <div class="resumen-card resumen-purple">
            <span class="material-icons">calculate</span>
            <div>
              <div class="resumen-label">Saldo en caja</div>
              <div class="resumen-val">Q {{ saldo | number:'1.2-2' }}</div>
            </div>
          </div>
        </div>

        <!-- Info caja -->
        <div class="card info-card">
          <div class="info-row">
            <span class="material-icons info-icon">store</span>
            <div>
              <div class="info-label">Sucursal</div>
              <div class="info-val">{{ caja.sucursal_nombre }}</div>
            </div>
          </div>
          <div class="info-row">
            <span class="material-icons info-icon">person</span>
            <div>
              <div class="info-label">Abierta por</div>
              <div class="info-val">{{ caja.usuario_nombre }}</div>
            </div>
          </div>
          <div class="info-row">
            <span class="material-icons info-icon">schedule</span>
            <div>
              <div class="info-label">Fecha apertura</div>
              <div class="info-val">{{ caja.fecha_apertura | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
          </div>
          <div class="info-row">
            <span class="material-icons info-icon">tag</span>
            <div>
              <div class="info-label">ID Caja</div>
              <div class="info-val"># {{ caja.id }}</div>
            </div>
          </div>
        </div>

        <!-- Movimientos -->
        <div class="card table-card">
          <div class="table-header-row">
            <h3 class="table-title">Movimientos</h3>
            <button class="btn btn-sm btn-ghost" (click)="loadMovimientos()">
              <span class="material-icons">refresh</span>
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Usuario</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="movimientos.length === 0">
                  <td colspan="6" class="td-center">Sin movimientos registrados</td>
                </tr>
                <tr *ngFor="let m of movimientos">
                  <td class="td-sec td-sm">{{ m.fecha | date:'dd/MM HH:mm' }}</td>
                  <td>
                    <span class="chip" [ngClass]="m.tipo === 'ingreso' ? 'chip-green' : 'chip-red'">
                      <span class="material-icons chip-icon">{{ m.tipo === 'ingreso' ? 'add_circle' : 'remove_circle' }}</span>
                      {{ m.tipo | titlecase }}
                    </span>
                  </td>
                  <td class="td-sec">{{ m.categoria || '—' }}</td>
                  <td class="td-sec">{{ m.descripcion || '—' }}</td>
                  <td class="td-sec">{{ m.usuario_nombre }}</td>
                  <td class="text-right" [ngClass]="m.tipo === 'ingreso' ? 'monto-pos' : 'monto-neg'">
                    {{ m.tipo === 'ingreso' ? '+' : '-' }} Q {{ m.monto | number:'1.2-2' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Acceso rápido a ventas -->
        <div class="quick-actions">
          <button class="quick-btn" routerLink="/ventas">
            <span class="material-icons">point_of_sale</span>
            <span>Ir a Ventas</span>
          </button>
        </div>
      </ng-container>
    </div>

    <!-- Modal: Abrir Caja -->
    <div class="modal-backdrop" *ngIf="showAbrirModal" (click)="showAbrirModal = false">
      <div class="modal modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons">lock_open</span> Abrir Caja</h3>
          <button class="modal-close" (click)="showAbrirModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="abrirForm" (ngSubmit)="abrirCaja()">

            <!-- Info cajero (auto) -->
            <div class="cajero-banner">
              <span class="material-icons">badge</span>
              <div>
                <div class="cajero-label">Cajero</div>
                <div class="cajero-nombre">{{ cajeroNombre }}</div>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Sucursal *</label>
                <select formControlName="sucursal_id">
                  <option [value]="null">Seleccionar sucursal</option>
                  <option *ngFor="let s of sucursales" [value]="s.id">{{ s.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Nombre de caja</label>
                <input formControlName="nombre" placeholder="Ej: Caja 1 — Turno mañana" />
              </div>
            </div>

            <!-- Denominaciones apertura -->
            <div class="denom-section">
              <div class="denom-section-title">
                <span class="material-icons">payments</span> Conteo de efectivo inicial
              </div>
              <div class="denom-grid">
                <div class="denom-group-label">Billetes</div>
                <div class="denom-group-label text-right">Subtotal</div>
                <ng-container *ngFor="let d of denomsApertura">
                  <ng-container *ngIf="d.tipo === 'billete'">
                    <div class="denom-row">
                      <div class="denom-chip billete">Q {{ d.valor | number:'1.0-0' }}</div>
                      <span class="denom-x">×</span>
                      <div class="denom-input-wrap">
                        <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad > 0 ? d.cantidad-1 : 0; calcTotal('apertura')">−</button>
                        <input type="number" min="0" [(ngModel)]="d.cantidad" [ngModelOptions]="{standalone:true}"
                               (input)="calcTotal('apertura')" class="denom-qty" />
                        <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad+1; calcTotal('apertura')">+</button>
                      </div>
                      <div class="denom-sub">Q {{ d.cantidad * d.valor | number:'1.2-2' }}</div>
                    </div>
                  </ng-container>
                </ng-container>

                <div class="denom-group-label" style="margin-top:8px">Monedas</div>
                <div class="denom-group-label text-right" style="margin-top:8px"></div>
                <ng-container *ngFor="let d of denomsApertura">
                  <ng-container *ngIf="d.tipo === 'moneda'">
                    <div class="denom-row">
                      <div class="denom-chip moneda">Q {{ d.valor | number:'1.2-2' }}</div>
                      <span class="denom-x">×</span>
                      <div class="denom-input-wrap">
                        <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad > 0 ? d.cantidad-1 : 0; calcTotal('apertura')">−</button>
                        <input type="number" min="0" [(ngModel)]="d.cantidad" [ngModelOptions]="{standalone:true}"
                               (input)="calcTotal('apertura')" class="denom-qty" />
                        <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad+1; calcTotal('apertura')">+</button>
                      </div>
                      <div class="denom-sub">Q {{ d.cantidad * d.valor | number:'1.2-2' }}</div>
                    </div>
                  </ng-container>
                </ng-container>
              </div>

              <div class="denom-total">
                <span>Total a ingresar</span>
                <span class="denom-total-val">Q {{ totalApertura | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="showAbrirModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="abrirForm.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Abriendo...' : 'Abrir Caja — Q ' + (totalApertura | number:"1.2-2") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: Movimiento -->
    <div class="modal-backdrop" *ngIf="showMovimientoModal" (click)="showMovimientoModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons">swap_horiz</span> Registrar Movimiento</h3>
          <button class="modal-close" (click)="showMovimientoModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="movForm" (ngSubmit)="registrarMovimiento()">
            <div class="form-grid">
              <div class="form-group">
                <label>Tipo *</label>
                <select formControlName="tipo">
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div class="form-group">
                <label>Categoría</label>
                <input formControlName="categoria" placeholder="Ej: Préstamo, Gasto" />
              </div>
              <div class="form-group col-2">
                <label>Monto *</label>
                <div class="input-prefix">
                  <span>Q</span>
                  <input type="number" step="0.01" min="0.01" formControlName="monto" placeholder="0.00" />
                </div>
              </div>
              <div class="form-group col-2">
                <label>Descripción</label>
                <input formControlName="descripcion" placeholder="Detalle del movimiento..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="showMovimientoModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="movForm.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : 'Registrar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: Cerrar Caja -->
    <div class="modal-backdrop" *ngIf="showCerrarModal" (click)="showCerrarModal = false">
      <div class="modal modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons">lock</span> Cerrar Caja</h3>
          <button class="modal-close" (click)="showCerrarModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">

          <!-- Resumen sistema -->
          <div class="cierre-resumen">
            <div class="cierre-row"><span>Monto inicial</span><span>Q {{ caja?.monto_inicial | number:'1.2-2' }}</span></div>
            <div class="cierre-row"><span>Total ingresos</span><span class="pos">+ Q {{ totalIngresos | number:'1.2-2' }}</span></div>
            <div class="cierre-row"><span>Total egresos</span><span class="neg">- Q {{ totalEgresos | number:'1.2-2' }}</span></div>
            <div class="cierre-row cierre-total"><span>Saldo esperado sistema</span><span>Q {{ saldo | number:'1.2-2' }}</span></div>
          </div>

          <!-- Denominaciones cierre -->
          <div class="denom-section" style="margin-top:16px">
            <div class="denom-section-title">
              <span class="material-icons">payments</span> Conteo físico de efectivo
            </div>
            <div class="denom-grid">
              <div class="denom-group-label">Billetes</div>
              <div class="denom-group-label text-right">Subtotal</div>
              <ng-container *ngFor="let d of denomsCierre">
                <ng-container *ngIf="d.tipo === 'billete'">
                  <div class="denom-row">
                    <div class="denom-chip billete">Q {{ d.valor | number:'1.0-0' }}</div>
                    <span class="denom-x">×</span>
                    <div class="denom-input-wrap">
                      <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad > 0 ? d.cantidad-1 : 0; calcTotal('cierre')">−</button>
                      <input type="number" min="0" [(ngModel)]="d.cantidad" [ngModelOptions]="{standalone:true}"
                             (input)="calcTotal('cierre')" class="denom-qty" />
                      <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad+1; calcTotal('cierre')">+</button>
                    </div>
                    <div class="denom-sub">Q {{ d.cantidad * d.valor | number:'1.2-2' }}</div>
                  </div>
                </ng-container>
              </ng-container>

              <div class="denom-group-label" style="margin-top:8px">Monedas</div>
              <div class="denom-group-label text-right" style="margin-top:8px"></div>
              <ng-container *ngFor="let d of denomsCierre">
                <ng-container *ngIf="d.tipo === 'moneda'">
                  <div class="denom-row">
                    <div class="denom-chip moneda">Q {{ d.valor | number:'1.2-2' }}</div>
                    <span class="denom-x">×</span>
                    <div class="denom-input-wrap">
                      <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad > 0 ? d.cantidad-1 : 0; calcTotal('cierre')">−</button>
                      <input type="number" min="0" [(ngModel)]="d.cantidad" [ngModelOptions]="{standalone:true}"
                             (input)="calcTotal('cierre')" class="denom-qty" />
                      <button type="button" class="denom-btn" (click)="d.cantidad = d.cantidad+1; calcTotal('cierre')">+</button>
                    </div>
                    <div class="denom-sub">Q {{ d.cantidad * d.valor | number:'1.2-2' }}</div>
                  </div>
                </ng-container>
              </ng-container>
            </div>

            <div class="denom-total">
              <span>Total físico contado</span>
              <span class="denom-total-val">Q {{ totalCierre | number:'1.2-2' }}</span>
            </div>

            <div class="diferencia-banner" [ngClass]="diferenciaCierre === 0 ? 'dif-ok' : diferenciaCierre > 0 ? 'dif-sobre' : 'dif-falta'">
              <span class="material-icons">{{ diferenciaCierre === 0 ? 'check_circle' : diferenciaCierre > 0 ? 'trending_up' : 'trending_down' }}</span>
              <div>
                <div class="dif-label">{{ diferenciaCierre === 0 ? 'Cuadre exacto' : diferenciaCierre > 0 ? 'Sobrante' : 'Faltante' }}</div>
                <div class="dif-val">Q {{ diferenciaCierre | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="showCerrarModal = false">Cancelar</button>
            <button class="btn btn-danger" (click)="cerrarCaja()" [disabled]="saving">
              <span class="material-icons spin" *ngIf="saving">refresh</span>
              {{ saving ? 'Cerrando...' : 'Confirmar Cierre' }}
            </button>
          </div>
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
    .header-actions { display: flex; gap: var(--space-sm); }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; padding: 40px; justify-content: center; }

    /* Empty state */
    .empty-caja { display: flex; flex-direction: column; align-items: center; gap: var(--space-lg); padding: 64px 24px; text-align: center; }
    .empty-icon-wrap { width: 96px; height: 96px; border-radius: 50%; background: color-mix(in srgb, var(--primary) 10%, transparent); display: flex; align-items: center; justify-content: center; }
    .empty-icon { font-size: 52px; color: var(--primary); }
    .empty-caja h3 { font-size: 22px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-caja p { font-size: 14px; color: var(--text-secondary); margin: 0; max-width: 380px; }

    /* Resumen grid */
    .resumen-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-md); }
    .resumen-card { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md) var(--space-lg); border-radius: var(--radius-lg); border: 1px solid var(--border); }
    .resumen-card .material-icons { font-size: 32px; }
    .resumen-blue { background: color-mix(in srgb, var(--primary) 8%, var(--surface)); }
    .resumen-blue .material-icons { color: var(--primary); }
    .resumen-green { background: color-mix(in srgb, var(--success) 8%, var(--surface)); }
    .resumen-green .material-icons { color: var(--success); }
    .resumen-red { background: color-mix(in srgb, var(--error) 8%, var(--surface)); }
    .resumen-red .material-icons { color: var(--error); }
    .resumen-purple { background: color-mix(in srgb, #8b5cf6 8%, var(--surface)); }
    .resumen-purple .material-icons { color: #8b5cf6; }
    .resumen-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
    .resumen-val { font-size: 20px; font-weight: 800; color: var(--text); margin-top: 2px; }

    /* Info card */
    .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .info-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0; }
    .info-row { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md) var(--space-lg); border-right: 1px solid var(--border-light); }
    .info-row:last-child { border-right: none; }
    .info-icon { font-size: 22px; color: var(--text-disabled); }
    .info-label { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
    .info-val { font-size: 14px; font-weight: 600; color: var(--text); margin-top: 2px; }

    /* Table */
    .table-header-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--border-light); }
    .table-title { font-size: 14px; font-weight: 700; color: var(--text); margin: 0; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .data-table tbody tr:hover { background: var(--surface-hover); }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .td-center { text-align: center; padding: 32px; color: var(--text-disabled); font-style: italic; }
    .td-sec { color: var(--text-secondary); }
    .td-sm { font-size: 12px; }
    .text-right { text-align: right; }
    .monto-pos { color: var(--success); font-weight: 700; text-align: right; }
    .monto-neg { color: var(--error); font-weight: 700; text-align: right; }

    /* Chips */
    .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .chip-icon { font-size: 13px; }
    .chip-green { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .chip-red { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }

    /* Quick actions */
    .quick-actions { display: flex; gap: var(--space-md); }
    .quick-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text); transition: all var(--transition-fast); box-shadow: var(--shadow-sm); }
    .quick-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    .quick-btn .material-icons { font-size: 22px; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: var(--radius-md); border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all var(--transition-fast); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-primary:disabled { opacity: .6; cursor: default; }
    .btn-danger { background: var(--error); color: #fff; }
    .btn-danger:hover { filter: brightness(0.9); }
    .btn-danger:disabled { opacity: .6; cursor: default; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn-lg { padding: 12px 28px; font-size: 15px; }
    .btn-sm { padding: 5px 10px; font-size: 12px; }
    .btn .material-icons { font-size: 18px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; }
    .modal-xl { max-width: 640px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
    .modal-header h3 .material-icons { font-size: 20px; color: var(--primary); }
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
    .input-prefix { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .input-prefix span { padding: 8px 10px; background: var(--surface-hover); font-size: 13px; font-weight: 600; color: var(--text-secondary); border-right: 1px solid var(--border); }
    .input-prefix input { border: none; padding: 8px 10px; font-size: 14px; color: var(--text); background: var(--surface); outline: none; flex: 1; }

    /* Cajero banner */
    .cajero-banner { display: flex; align-items: center; gap: 10px; background: color-mix(in srgb, var(--primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: var(--space-md); }
    .cajero-banner .material-icons { color: var(--primary); font-size: 22px; }
    .cajero-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
    .cajero-nombre { font-size: 15px; font-weight: 700; color: var(--text); }

    /* Denominaciones */
    .denom-section { border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
    .denom-section-title { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: var(--surface-hover); font-size: 13px; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
    .denom-section-title .material-icons { font-size: 17px; }
    .denom-grid { padding: 12px 14px; display: grid; grid-template-columns: auto 1fr; gap: 6px 0; align-items: center; }
    .denom-group-label { font-size: 11px; font-weight: 700; color: var(--text-disabled); text-transform: uppercase; letter-spacing: .5px; padding: 4px 0 2px; grid-column: 1 / -1; }
    .text-right { text-align: right; }
    .denom-row { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 4px 0; }
    .denom-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 64px; padding: 4px 10px; border-radius: var(--radius-md); font-size: 13px; font-weight: 700; }
    .billete { background: color-mix(in srgb, #10b981 12%, transparent); color: #059669; }
    .moneda { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #d97706; }
    .denom-x { color: var(--text-disabled); font-size: 16px; }
    .denom-input-wrap { display: flex; align-items: center; gap: 2px; }
    .denom-btn { width: 28px; height: 28px; border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-sm); cursor: pointer; font-size: 16px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); }
    .denom-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    .denom-qty { width: 54px; text-align: center; padding: 4px 6px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; color: var(--text); background: var(--surface); outline: none; }
    .denom-qty:focus { border-color: var(--primary); }
    .denom-sub { font-size: 13px; font-weight: 600; color: var(--text); min-width: 90px; text-align: right; margin-left: auto; }
    .denom-total { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-top: 2px solid var(--border); background: var(--surface-hover); }
    .denom-total span { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
    .denom-total-val { font-size: 22px; font-weight: 800; color: var(--text); }

    /* Diferencia banner */
    .diferencia-banner { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-md); margin-top: 12px; }
    .diferencia-banner .material-icons { font-size: 28px; }
    .dif-label { font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .dif-val { font-size: 20px; font-weight: 800; }
    .dif-ok { background: color-mix(in srgb, var(--success) 10%, transparent); color: var(--success); }
    .dif-sobre { background: color-mix(in srgb, #f59e0b 10%, transparent); color: #d97706; }
    .dif-falta { background: color-mix(in srgb, var(--error) 10%, transparent); color: var(--error); }

    /* Cierre resumen */
    .cierre-resumen { background: var(--surface-hover); border-radius: var(--radius-md); padding: var(--space-md); display: flex; flex-direction: column; gap: 8px; }
    .cierre-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary); }
    .cierre-total { font-weight: 700; color: var(--text); border-top: 1px solid var(--border); padding-top: 8px; font-size: 15px; }
    .pos { color: var(--success); }
    .neg { color: var(--error); }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CajaComponent implements OnInit {
  caja: CajaActiva | null = null;
  sucursales: Sucursal[] = [];
  movimientos: Movimiento[] = [];
  totalIngresos = 0;
  totalEgresos = 0;
  cargando = true;
  cajeroNombre = '';

  showAbrirModal = false;
  showMovimientoModal = false;
  showCerrarModal = false;
  saving = false;

  abrirForm!: FormGroup;
  movForm!: FormGroup;

  totalApertura = 0;
  totalCierre = 0;

  denomsApertura: Denominacion[] = this.buildDenoms();
  denomsCierre: Denominacion[] = this.buildDenoms();

  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cajaService: CajaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadSucursales();
    const user = this.authService.getCurrentUser();
    this.cajeroNombre = user?.nombre || user?.usuario || 'Usuario actual';

    this.cajaService.verificarCajaActiva().subscribe({
      next: () => {
        this.cargando = false;
        this.caja = this.cajaService.cajaActiva;
        if (this.caja) this.loadMovimientos();
      },
      error: () => { this.cargando = false; }
    });

    this.cajaService.caja$.subscribe(c => { this.caja = c; });
  }

  private buildDenoms(): Denominacion[] {
    return [
      { valor: 200,  label: 'Q200',   tipo: 'billete', cantidad: 0 },
      { valor: 100,  label: 'Q100',   tipo: 'billete', cantidad: 0 },
      { valor: 50,   label: 'Q50',    tipo: 'billete', cantidad: 0 },
      { valor: 20,   label: 'Q20',    tipo: 'billete', cantidad: 0 },
      { valor: 10,   label: 'Q10',    tipo: 'moneda',  cantidad: 0 },
      { valor: 5,    label: 'Q5',     tipo: 'moneda',  cantidad: 0 },
      { valor: 1,    label: 'Q1',     tipo: 'moneda',  cantidad: 0 },
      { valor: 0.50, label: 'Q0.50',  tipo: 'moneda',  cantidad: 0 },
      { valor: 0.25, label: 'Q0.25',  tipo: 'moneda',  cantidad: 0 },
      { valor: 0.10, label: 'Q0.10',  tipo: 'moneda',  cantidad: 0 },
    ];
  }

  calcTotal(tipo: 'apertura' | 'cierre'): void {
    const denoms = tipo === 'apertura' ? this.denomsApertura : this.denomsCierre;
    const total = denoms.reduce((s, d) => s + (d.cantidad * d.valor), 0);
    if (tipo === 'apertura') this.totalApertura = Math.round(total * 100) / 100;
    else this.totalCierre = Math.round(total * 100) / 100;
  }

  private buildForms(): void {
    this.abrirForm = this.fb.group({
      sucursal_id: [null, Validators.required],
      nombre: ['']
    });
    this.movForm = this.fb.group({
      tipo: ['ingreso', Validators.required],
      categoria: [''],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      descripcion: ['']
    });
  }

  get saldo(): number {
    return Math.round(((this.caja?.monto_inicial || 0) + this.totalIngresos - this.totalEgresos) * 100) / 100;
  }

  get diferenciaCierre(): number {
    return Math.round((this.totalCierre - this.saldo) * 100) / 100;
  }

  abrirModal(): void {
    this.denomsApertura = this.buildDenoms();
    this.totalApertura = 0;
    this.showAbrirModal = true;
  }

  loadSucursales(): void {
    this.api.get<Sucursal[]>('/sucursales/activas').subscribe({
      next: r => { this.sucursales = r.data as any; }
    });
  }

  loadMovimientos(): void {
    if (!this.caja) return;
    this.api.get<any>(`/cajas/${this.caja.id}`).subscribe({
      next: r => {
        const data = r.data as any;
        this.movimientos = data.movimientos || [];
        this.totalIngresos = this.movimientos
          .filter((m: any) => m.tipo === 'ingreso')
          .reduce((s: number, m: any) => s + +m.monto, 0);
        this.totalEgresos = this.movimientos
          .filter((m: any) => m.tipo === 'egreso')
          .reduce((s: number, m: any) => s + +m.monto, 0);
      }
    });
  }

  abrirCaja(): void {
    if (this.abrirForm.invalid) return;
    this.saving = true;
    const v = this.abrirForm.value;
    this.api.post('/cajas/abrir', {
      sucursal_id: +v.sucursal_id,
      nombre: v.nombre || null,
      monto_inicial: this.totalApertura
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showAbrirModal = false;
        this.showToast('Caja abierta — Q ' + this.totalApertura.toFixed(2));
        this.cajaService.verificarCajaActiva().subscribe(() => { this.loadMovimientos(); });
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al abrir caja', true);
      }
    });
  }

  registrarMovimiento(): void {
    if (this.movForm.invalid || !this.caja) return;
    this.saving = true;
    const v = this.movForm.value;
    this.api.post('/cajas/movimiento', {
      caja_id: this.caja.id,
      tipo: v.tipo,
      categoria: v.categoria || null,
      monto: +v.monto,
      descripcion: v.descripcion || null
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showMovimientoModal = false;
        this.movForm.reset({ tipo: 'ingreso' });
        this.loadMovimientos();
        this.showToast('Movimiento registrado');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al registrar', true);
      }
    });
  }

  cerrarCaja(): void {
    if (!this.caja) return;
    if (!confirm('¿Confirmar el cierre de caja?')) return;
    this.saving = true;
    this.api.post(`/cajas/${this.caja.id}/cerrar`, {
      monto_cierre: this.totalCierre
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showCerrarModal = false;
        this.cajaService.setCaja(null);
        this.movimientos = [];
        this.totalIngresos = 0;
        this.totalEgresos = 0;
        this.showToast('Caja cerrada exitosamente');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al cerrar caja', true);
      }
    });
  }

  openCerrarModal(): void {
    this.denomsCierre = this.buildDenoms();
    this.totalCierre = 0;
    this.showCerrarModal = true;
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3500);
  }
}
