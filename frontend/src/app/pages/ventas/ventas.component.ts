import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CajaService } from '../../services/caja.service';

interface LineItem {
  producto_id: number;
  nombre: string;
  codigo_barras: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

interface Pago {
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  monto: number;
  referencia: string;
}

@Component({
  selector: 'app-ventas',
  template: `
<!-- Bloqueo si no hay caja abierta -->
<div class="caja-cerrada-overlay" *ngIf="!cajaAbierta && !cargandoCaja">
  <div class="cc-card">
    <span class="material-icons cc-icon">lock</span>
    <h2>Caja Cerrada</h2>
    <p>No puedes realizar ventas sin una caja abierta.</p>
    <p class="cc-sub">Abre una caja desde el módulo de <strong>Caja</strong> para comenzar a vender.</p>
    <button class="cc-btn" (click)="irACaja()">
      <span class="material-icons">account_balance_wallet</span> Ir a Caja
    </button>
  </div>
</div>

<div class="pos-root" *ngIf="cajaAbierta">

  <!-- ═══ COLUMNA IZQUIERDA: búsqueda + lista ═══ -->
  <div class="pos-left">

    <!-- Barra búsqueda -->
    <div class="search-bar">
      <span class="material-icons sb-icon">qr_code_scanner</span>
      <input #searchInput type="text" class="sb-input" placeholder="Escanear código o buscar producto..."
             [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange($event)"
             (keydown.enter)="onEnterSearch()" autocomplete="off" />
      <span class="material-icons sb-clear" *ngIf="searchTerm" (click)="clearSearch()">close</span>
    </div>

    <!-- Dropdown resultados -->
    <div class="search-results" *ngIf="searchResults.length > 0">
      <div class="sr-item" *ngFor="let p of searchResults" (click)="agregarProducto(p)">
        <div class="sr-info">
          <span class="sr-nombre">{{ p.nombre }}</span>
          <span class="sr-codigo">{{ p.codigo_barras }}</span>
        </div>
        <div class="sr-right">
          <span class="sr-precio">Q {{ p.precio | number:'1.2-2' }}</span>
          <span class="sr-stock" [class.low]="p.stock_total <= 5">{{ p.stock_total }} u.</span>
        </div>
      </div>
    </div>
    <div class="search-empty" *ngIf="searchTerm && searchResults.length === 0 && !searching">
      <span class="material-icons">search_off</span> Sin resultados para "{{ searchTerm }}"
    </div>

    <!-- Tabla de ítems -->
    <div class="items-table-wrap">
      <table class="items-table" *ngIf="items.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Producto</th>
            <th class="tc">Cant.</th>
            <th class="tc">Precio</th>
            <th class="tc">Subtotal</th>
            <th class="tc">Quitar</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of items; let i = index" [class.row-active]="selectedRow === i"
              (click)="selectedRow = i">
            <td class="td-num">{{ i + 1 }}</td>
            <td class="td-prod">
              <span class="prod-nombre">{{ item.nombre }}</span>
              <span class="prod-cod">{{ item.codigo_barras }}</span>
            </td>
            <td class="tc td-qty">
              <div class="qty-ctrl">
                <button class="qty-btn" (click)="cambiarCantidad(i, -1); $event.stopPropagation()">−</button>
                <input type="number" class="qty-input" min="1" [value]="item.cantidad"
                       (change)="setCantidad(i, $event)" (click)="$event.stopPropagation()" />
                <button class="qty-btn" (click)="cambiarCantidad(i, 1); $event.stopPropagation()">+</button>
              </div>
            </td>
            <td class="tc td-precio">Q {{ item.precio | number:'1.2-2' }}</td>
            <td class="tc td-sub">Q {{ item.subtotal | number:'1.2-2' }}</td>
            <td class="tc">
              <button class="remove-btn" (click)="quitarItem(i); $event.stopPropagation()">
                <span class="material-icons">delete_outline</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-cart" *ngIf="items.length === 0">
        <span class="material-icons ec-icon">shopping_cart</span>
        <p>Busca o escanea un producto para comenzar</p>
      </div>
    </div>

    <!-- Historial rápido -->
    <div class="historial-bar" *ngIf="historial.length > 0">
      <span class="hb-label">Últimas ventas:</span>
      <div class="hb-item" *ngFor="let h of historial" (click)="verVenta(h)">
        <span class="hb-num">#{{ h.correlativo }}</span>
        <span class="hb-monto">Q {{ h.total | number:'1.2-2' }}</span>
      </div>
    </div>
  </div>

  <!-- ═══ COLUMNA DERECHA: totales + cobro ═══ -->
  <div class="pos-right">

    <!-- Cliente (opcional) -->
    <div class="right-section">
      <div class="rs-header">
        <span class="material-icons">person</span>
        <span>Cliente</span>
        <span class="rs-opt">opcional</span>
      </div>
      <div class="cliente-row">
        <input type="text" class="cl-input" placeholder="NIT o nombre del cliente..."
               [(ngModel)]="clienteSearch" (ngModelChange)="buscarCliente($event)" />
        <button class="cl-cf" title="Consumidor final" (click)="setConsumidorFinal()"
                [class.active]="clienteId === null">CF</button>
      </div>
      <div class="cl-results" *ngIf="clienteResultados.length > 0">
        <div class="cl-item" *ngFor="let c of clienteResultados" (click)="seleccionarCliente(c)">
          <strong>{{ c.nombre }}</strong> <span>{{ c.nit }}</span>
        </div>
      </div>
      <div class="cl-selected" *ngIf="clienteNombre">
        <span class="material-icons">check_circle</span> {{ clienteNombre }}
        <button class="cl-remove" (click)="setConsumidorFinal()"><span class="material-icons">close</span></button>
      </div>
    </div>

    <!-- Totales -->
    <div class="totales-box">
      <div class="tot-row">
        <span>Subtotal</span>
        <span>Q {{ subtotal | number:'1.2-2' }}</span>
      </div>
      <div class="tot-row tot-desc" *ngIf="descuento > 0">
        <span>Descuento</span>
        <span class="desc-val">- Q {{ descuento | number:'1.2-2' }}</span>
      </div>
      <div class="tot-divider"></div>
      <div class="tot-row tot-total">
        <span>TOTAL</span>
        <span class="total-val">Q {{ total | number:'1.2-2' }}</span>
      </div>
    </div>

    <!-- Descuento rápido -->
    <div class="desc-row">
      <span class="material-icons desc-icon">local_offer</span>
      <input type="number" class="desc-input" placeholder="% desc." min="0" max="100"
             [(ngModel)]="descPct" (ngModelChange)="calcTotales()" />
      <span class="desc-pct-label">%</span>
    </div>

    <!-- Formas de pago -->
    <div class="right-section">
      <div class="rs-header">
        <span class="material-icons">payments</span>
        <span>Forma de pago</span>
      </div>
      <div class="metodos-grid">
        <button class="metodo-btn" [class.active]="pagoActivo === 'efectivo'"
                (click)="setPago('efectivo')">
          <span class="material-icons">payments</span> Efectivo
        </button>
        <button class="metodo-btn" [class.active]="pagoActivo === 'tarjeta'"
                (click)="setPago('tarjeta')">
          <span class="material-icons">credit_card</span> Tarjeta
          <span class="pend-badge">Próx.</span>
        </button>
        <button class="metodo-btn" [class.active]="pagoActivo === 'transferencia'"
                (click)="setPago('transferencia')">
          <span class="material-icons">account_balance</span> Transfer.
          <span class="pend-badge">Próx.</span>
        </button>
      </div>

      <!-- Efectivo -->
      <div class="pago-efectivo" *ngIf="pagoActivo === 'efectivo'">
        <label class="pe-label">Efectivo recibido</label>
        <div class="pe-input-wrap">
          <span class="pe-prefix">Q</span>
          <input #efectivoInput type="number" class="pe-input" min="0" step="0.50"
                 [(ngModel)]="efectivoRecibido" (ngModelChange)="calcCambio()" placeholder="0.00" />
        </div>
        <div class="quick-amounts">
          <button class="qa-btn" *ngFor="let a of quickAmounts()" (click)="setEfectivo(a)">
            Q {{ a | number:'1.2-2' }}
          </button>
        </div>
        <div class="cambio-row" [class.cambio-ok]="cambio >= 0" [class.cambio-neg]="cambio < 0">
          <span>Cambio</span>
          <span class="cambio-val">Q {{ cambio | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Tarjeta / Transferencia (próximamente) -->
      <div class="pago-pendiente" *ngIf="pagoActivo !== 'efectivo'">
        <span class="material-icons pp-icon">construction</span>
        <p>Integración con pasarela de pago <strong>pendiente de configurar</strong>.</p>
        <p class="pp-sub">Por ahora se registra como pago {{ pagoActivo }} sin procesamiento electrónico.</p>
        <div class="form-group" style="margin-top:12px">
          <label>Referencia / # autorización (opcional)</label>
          <input type="text" class="pp-ref" [(ngModel)]="pagoReferencia" placeholder="Ej: 0012345..." />
        </div>
      </div>
    </div>

    <!-- Botón cobrar -->
    <button class="btn-cobrar" [disabled]="!puedeVender() || saving" (click)="cobrar()">
      <span class="material-icons spin" *ngIf="saving">refresh</span>
      <span class="material-icons" *ngIf="!saving">check_circle</span>
      {{ saving ? 'Procesando...' : 'COBRAR  Q ' + (total | number:'1.2-2') }}
    </button>

    <button class="btn-limpiar" (click)="limpiar()" *ngIf="items.length > 0 && !saving">
      <span class="material-icons">delete_sweep</span> Limpiar venta
    </button>
  </div>
</div>

<!-- ═══ Modal: Ticket / Comprobante ═══ -->
<div class="modal-backdrop" *ngIf="showTicket" (click)="cerrarTicket()">
  <div class="ticket-modal" (click)="$event.stopPropagation()">
    <div class="ticket-header">
      <span class="material-icons t-icon-ok">check_circle</span>
      <h3>Venta Exitosa</h3>
      <p class="t-num">Venta # <strong>{{ ventaCreada?.correlativo }}</strong></p>
    </div>
    <div class="ticket-body">
      <div class="t-row" *ngFor="let item of itemsCobrados">
        <span>{{ item.nombre }} x{{ item.cantidad }}</span>
        <span>Q {{ item.subtotal | number:'1.2-2' }}</span>
      </div>
      <div class="t-divider"></div>
      <div class="t-row t-total"><span>TOTAL</span><span>Q {{ totalCobrado | number:'1.2-2' }}</span></div>
      <div class="t-row t-metodo"><span>Pagó ({{ pagoMetodoCobrado }})</span><span>Q {{ pagoMontoCobrado | number:'1.2-2' }}</span></div>
      <div class="t-row t-cambio" *ngIf="cambioCobrado > 0"><span>Cambio</span><span class="cambio-ok-val">Q {{ cambioCobrado | number:'1.2-2' }}</span></div>
    </div>
    <div class="ticket-footer">
      <button class="btn btn-ghost" (click)="cerrarTicket()">Cerrar</button>
      <button class="btn btn-primary" (click)="nuevaVenta()">
        <span class="material-icons">add</span> Nueva venta
      </button>
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
    :host { display: block; height: calc(100vh - var(--header-height, 64px)); overflow: hidden; }
    .pos-root { display: flex; height: 100%; gap: 0; background: var(--bg); overflow: hidden; }

    /* ── Columna izquierda ── */
    .pos-left { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 16px; gap: 12px; min-width: 0; }

    /* Barra búsqueda */
    .search-bar { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 2px solid var(--primary); border-radius: var(--radius-lg); padding: 10px 14px; box-shadow: 0 0 0 4px color-mix(in srgb,var(--primary) 10%,transparent); flex-shrink: 0; }
    .sb-icon { color: var(--primary); font-size: 22px; }
    .sb-input { flex: 1; border: none; outline: none; font-size: 16px; font-weight: 500; background: transparent; color: var(--text); }
    .sb-clear { color: var(--text-disabled); cursor: pointer; font-size: 18px; }
    .sb-clear:hover { color: var(--error); }

    /* Resultados búsqueda */
    .search-results { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); max-height: 220px; overflow-y: auto; z-index: 10; }
    .sr-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; transition: background var(--transition-fast); border-bottom: 1px solid var(--border-light); }
    .sr-item:last-child { border-bottom: none; }
    .sr-item:hover { background: var(--surface-hover); }
    .sr-info { display: flex; flex-direction: column; gap: 2px; }
    .sr-nombre { font-size: 14px; font-weight: 600; color: var(--text); }
    .sr-codigo { font-size: 11px; color: var(--text-disabled); font-family: monospace; }
    .sr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .sr-precio { font-size: 15px; font-weight: 700; color: var(--primary); }
    .sr-stock { font-size: 11px; color: var(--success); }
    .sr-stock.low { color: var(--error); }
    .search-empty { display: flex; align-items: center; gap: 8px; padding: 14px; color: var(--text-disabled); font-size: 13px; }

    /* Tabla ítems */
    .items-table-wrap { flex: 1; overflow-y: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .items-table th { padding: 10px 12px; background: var(--surface-hover); font-weight: 700; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; border-bottom: 1px solid var(--border); position: sticky; top: 0; }
    .items-table td { padding: 9px 12px; border-bottom: 1px solid var(--border-light); }
    .items-table tr:last-child td { border-bottom: none; }
    .items-table tr.row-active { background: color-mix(in srgb,var(--primary) 6%,transparent); }
    .tc { text-align: center; }
    .td-num { color: var(--text-disabled); font-size: 12px; width: 30px; }
    .td-prod { display: flex; flex-direction: column; gap: 2px; }
    .prod-nombre { font-weight: 600; color: var(--text); }
    .prod-cod { font-size: 11px; color: var(--text-disabled); font-family: monospace; }
    .td-precio { color: var(--text-secondary); }
    .td-sub { font-weight: 700; color: var(--text); }
    .qty-ctrl { display: flex; align-items: center; gap: 4px; justify-content: center; }
    .qty-btn { width: 26px; height: 26px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-hover); cursor: pointer; font-size: 16px; font-weight: 700; color: var(--text); display: flex; align-items: center; justify-content: center; }
    .qty-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    .qty-input { width: 44px; text-align: center; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px; font-size: 13px; font-weight: 700; background: var(--surface); color: var(--text); outline: none; }
    .qty-input:focus { border-color: var(--primary); }
    .remove-btn { width: 28px; height: 28px; border: none; background: none; cursor: pointer; color: var(--text-disabled); display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); }
    .remove-btn:hover { background: color-mix(in srgb,var(--error) 12%,transparent); color: var(--error); }
    .remove-btn .material-icons { font-size: 18px; }
    .empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--text-disabled); gap: 12px; }
    .ec-icon { font-size: 48px; opacity: .4; }

    /* Historial */
    .historial-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 2px; }
    .hb-label { font-size: 11px; color: var(--text-disabled); font-weight: 600; }
    .hb-item { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-full); padding: 4px 10px; cursor: pointer; font-size: 12px; }
    .hb-item:hover { background: var(--surface-hover); }
    .hb-num { font-weight: 700; color: var(--primary); }
    .hb-monto { color: var(--text-secondary); }

    .right-section { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
    .rs-header { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px; }
    .rs-header .material-icons { font-size: 16px; }
    .rs-opt { margin-left: auto; font-weight: 400; color: var(--text-disabled); text-transform: none; }

    /* Cliente */
    .cliente-row { display: flex; gap: 8px; }
    .cl-input { flex: 1; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 10px; font-size: 13px; background: var(--surface); color: var(--text); outline: none; }
    .cl-input:focus { border-color: var(--primary); }
    .cl-cf { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); font-size: 12px; font-weight: 700; cursor: pointer; color: var(--text-secondary); }
    .cl-cf.active { background: color-mix(in srgb,var(--primary) 12%,transparent); color: var(--primary); border-color: var(--primary); }
    .cl-results { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-top: 4px; }
    .cl-item { padding: 8px 10px; cursor: pointer; font-size: 13px; border-bottom: 1px solid var(--border-light); display: flex; gap: 8px; }
    .cl-item:hover { background: var(--surface-hover); }
    .cl-selected { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; color: var(--success); font-weight: 600; }
    .cl-selected .material-icons { font-size: 16px; }
    .cl-remove { border: none; background: none; cursor: pointer; color: var(--text-disabled); display: flex; align-items: center; margin-left: auto; }

    /* Totales */
    .totales-box { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
    .tot-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 14px; color: var(--text-secondary); }
    .tot-divider { border-top: 2px solid var(--border); margin: 8px 0; }
    .tot-total { font-size: 18px; font-weight: 900; color: var(--text); }
    .total-val { font-size: 24px; color: var(--primary); }
    .desc-val { color: var(--error); font-weight: 600; }

    /* Descuento */
    .desc-row { display: flex; align-items: center; gap: 8px; padding: 4px 2px; }
    .desc-icon { color: var(--text-disabled); font-size: 18px; }
    .desc-input { width: 64px; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px 8px; font-size: 13px; text-align: center; background: var(--surface); color: var(--text); outline: none; }
    .desc-input:focus { border-color: var(--primary); }
    .desc-pct-label { font-size: 13px; color: var(--text-secondary); }

    /* Métodos de pago */
    .metodos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 12px; }
    .metodo-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border: 2px solid var(--border); border-radius: var(--radius-md); background: var(--surface); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--text-secondary); transition: all var(--transition-fast); position: relative; }
    .metodo-btn .material-icons { font-size: 20px; }
    .metodo-btn.active { border-color: var(--primary); background: color-mix(in srgb,var(--primary) 8%,transparent); color: var(--primary); }
    .pend-badge { position: absolute; top: 4px; right: 4px; background: #f59e0b; color: #fff; font-size: 8px; padding: 1px 4px; border-radius: 4px; font-weight: 700; }

    /* Efectivo */
    .pago-efectivo { display: flex; flex-direction: column; gap: 10px; }
    .pe-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
    .pe-input-wrap { display: flex; align-items: center; border: 2px solid var(--primary); border-radius: var(--radius-md); overflow: hidden; }
    .pe-prefix { padding: 10px 12px; background: color-mix(in srgb,var(--primary) 10%,transparent); font-weight: 700; color: var(--primary); font-size: 16px; }
    .pe-input { flex: 1; border: none; outline: none; padding: 10px 12px; font-size: 20px; font-weight: 700; color: var(--text); background: var(--surface); }
    .quick-amounts { display: flex; gap: 6px; flex-wrap: wrap; }
    .qa-btn { padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--surface-hover); font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-secondary); }
    .qa-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    .cambio-row { display: flex; justify-content: space-between; padding: 10px 12px; border-radius: var(--radius-md); font-size: 15px; font-weight: 700; }
    .cambio-row.cambio-ok { background: color-mix(in srgb,var(--success) 10%,transparent); color: var(--success); }
    .cambio-row.cambio-neg { background: color-mix(in srgb,var(--error) 10%,transparent); color: var(--error); }
    .cambio-val { font-size: 18px; }

    /* Pago pendiente */
    .pago-pendiente { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 8px; }
    .pp-icon { font-size: 32px; color: #f59e0b; }
    .pago-pendiente p { font-size: 13px; color: var(--text-secondary); margin: 0; }
    .pp-sub { font-size: 11px !important; color: var(--text-disabled) !important; }
    .pp-ref { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 10px; font-size: 13px; background: var(--surface); color: var(--text); outline: none; }

    /* Botón cobrar */
    .btn-cobrar { width: 100%; padding: 18px; border: none; border-radius: var(--radius-lg); background: var(--primary); color: #fff; font-size: 18px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all var(--transition-fast); box-shadow: 0 4px 14px color-mix(in srgb,var(--primary) 35%,transparent); }
    .btn-cobrar:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
    .btn-cobrar:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .btn-cobrar .material-icons { font-size: 22px; }
    .btn-limpiar { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .btn-limpiar:hover { background: color-mix(in srgb,var(--error) 8%,transparent); color: var(--error); border-color: var(--error); }

    /* Ticket modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); }
    .ticket-modal { background: var(--surface); border-radius: var(--radius-xl); padding: 0; width: 360px; overflow: hidden; box-shadow: var(--shadow-xl); }
    .ticket-header { background: var(--success); color: #fff; padding: 28px 24px 20px; text-align: center; }
    .t-icon-ok { font-size: 48px; margin-bottom: 8px; }
    .ticket-header h3 { margin: 0 0 4px; font-size: 22px; }
    .t-num { margin: 0; font-size: 14px; opacity: .85; }
    .ticket-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 8px; }
    .t-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary); }
    .t-divider { border-top: 1px dashed var(--border); margin: 4px 0; }
    .t-total { font-weight: 900; font-size: 18px; color: var(--text); }
    .t-metodo { color: var(--text-secondary); }
    .t-cambio { color: var(--success); font-weight: 700; }
    .cambio-ok-val { color: var(--success); }
    .ticket-footer { display: flex; gap: 10px; padding: 16px 24px 24px; }
    .btn { padding: 10px 18px; border-radius: var(--radius-md); border: none; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-ghost { background: var(--surface-hover); color: var(--text-secondary); border: 1px solid var(--border); }
    .btn-primary { background: var(--primary); color: #fff; flex: 1; justify-content: center; }
    .btn-primary .material-icons { font-size: 18px; }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all .25s; pointer-events: none; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Columna derecha (PC siempre fija) ── */
    .pos-right { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; background: var(--surface); border-left: 1px solid var(--border); padding: 16px; overflow-y: auto; }

    /* Caja cerrada overlay */
    .caja-cerrada-overlay { display: flex; align-items: center; justify-content: center; height: calc(100vh - var(--header-height, 64px)); background: var(--bg); }
    .cc-card { text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 48px 40px; max-width: 400px; box-shadow: var(--shadow-lg); }
    .cc-icon { font-size: 64px; color: var(--error); opacity: .7; }
    .cc-card h2 { margin: 16px 0 8px; font-size: 24px; color: var(--text); }
    .cc-card p { margin: 0 0 8px; font-size: 14px; color: var(--text-secondary); }
    .cc-sub { font-size: 13px; color: var(--text-disabled); }
    .cc-btn { margin-top: 20px; padding: 12px 24px; border: none; border-radius: var(--radius-md); background: var(--primary); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all var(--transition-fast); }
    .cc-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

    /* ── Responsive: solo móvil/tablet real (<= 768px) ── */
    @media (max-width: 768px) {
      :host { height: auto; overflow: auto; }
      .pos-root { flex-direction: column; height: auto; min-height: calc(100vh - var(--header-height, 64px)); overflow: visible; }

      .pos-left { padding: 10px; gap: 8px; overflow: visible; }

      .items-table-wrap { overflow-x: auto; max-height: 260px; }
      .items-table { min-width: 460px; }

      .historial-bar { padding: 4px 2px; }

      .pos-right {
        width: 100%;
        border-left: none;
        border-top: 2px solid var(--border);
        padding: 12px;
        gap: 10px;
        overflow-y: visible;
      }

      .totales-box { padding: 10px 12px; }
      .total-val { font-size: 20px; }
      .metodo-btn { padding: 12px 4px; font-size: 12px; }
      .btn-cobrar { padding: 20px; font-size: 17px; }
      .qty-btn { width: 32px; height: 32px; font-size: 18px; }
      .qty-input { width: 48px; font-size: 14px; }
    }

    @media (max-width: 480px) {
      .search-bar { padding: 8px 10px; }
      .sb-input { font-size: 15px; }
      .pos-right { padding: 10px; }
      .right-section { padding: 10px; }
      .items-table { min-width: 380px; }
      .ticket-modal { width: 95vw; }
    }
  `]
})
export class VentasComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  items: LineItem[] = [];
  searchTerm = '';
  searchResults: any[] = [];
  searching = false;
  selectedRow: number | null = null;

  clienteSearch = '';
  clienteId: number | null = null;
  clienteNombre = '';
  clienteResultados: any[] = [];

  descPct = 0;
  subtotal = 0;
  descuento = 0;
  total = 0;

  pagoActivo: 'efectivo' | 'tarjeta' | 'transferencia' = 'efectivo';
  efectivoRecibido = 0;
  cambio = 0;
  pagoReferencia = '';

  saving = false;
  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  showTicket = false;
  ventaCreada: any = null;
  itemsCobrados: LineItem[] = [];
  totalCobrado = 0;
  pagoMetodoCobrado = '';
  pagoMontoCobrado = 0;
  cambioCobrado = 0;

  historial: any[] = [];

  private searchSubject = new Subject<string>();
  private clienteSubject = new Subject<string>();

  cajaActiva: any = null;
  cajaAbierta = false;
  cargandoCaja = true;

  constructor(private api: ApiService, private cajaService: CajaService, private router: Router) {}

  ngOnInit(): void {
    this.cajaService.verificarCajaActiva().subscribe({
      next: r => {
        this.cajaActiva = r.data;
        this.cajaAbierta = !!r.data;
        this.cargandoCaja = false;
      },
      error: () => {
        this.cajaAbierta = false;
        this.cargandoCaja = false;
      }
    });
    this.loadHistorial();

    this.searchSubject.pipe(debounceTime(250), distinctUntilChanged()).subscribe(term => {
      this.buscarProductos(term);
    });
    this.clienteSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      if (term.length >= 2) {
        this.api.get<any[]>('/personas', { search: term, limit: 5 }).subscribe({
          next: r => { this.clienteResultados = (r.data as any) || []; }
        });
      } else {
        this.clienteResultados = [];
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.clienteSubject.complete();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onEnterSearch(): void {
    if (this.searchResults.length === 1) {
      this.agregarProducto(this.searchResults[0]);
    } else if (this.searchResults.length > 1) {
      this.agregarProducto(this.searchResults[0]);
    }
  }

  private buscarProductos(term: string): void {
    if (!term || term.trim().length < 1) { this.searchResults = []; return; }
    this.searching = true;
    this.api.get<any[]>('/productos', { search: term, limit: 8, estado: 1 }).subscribe({
      next: r => {
        this.searching = false;
        this.searchResults = (r.data as any) || [];
      },
      error: () => { this.searching = false; this.searchResults = []; }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.searchInput?.nativeElement?.focus();
  }

  agregarProducto(p: any): void {
    const idx = this.items.findIndex(i => i.producto_id === p.id);
    if (idx >= 0) {
      this.items[idx].cantidad++;
      this.items[idx].subtotal = +(this.items[idx].cantidad * this.items[idx].precio).toFixed(2);
      this.selectedRow = idx;
    } else {
      this.items.push({
        producto_id: p.id,
        nombre: p.nombre,
        codigo_barras: p.codigo_barras || '',
        precio: +p.precio,
        cantidad: 1,
        subtotal: +p.precio
      });
      this.selectedRow = this.items.length - 1;
    }
    this.clearSearch();
    this.calcTotales();
  }

  cambiarCantidad(i: number, delta: number): void {
    const item = this.items[i];
    const nueva = item.cantidad + delta;
    if (nueva <= 0) { this.quitarItem(i); return; }
    item.cantidad = nueva;
    item.subtotal = +(nueva * item.precio).toFixed(2);
    this.calcTotales();
  }

  setCantidad(i: number, event: any): void {
    const val = parseInt(event.target.value);
    if (!val || val <= 0) { this.quitarItem(i); return; }
    this.items[i].cantidad = val;
    this.items[i].subtotal = +(val * this.items[i].precio).toFixed(2);
    this.calcTotales();
  }

  quitarItem(i: number): void {
    this.items.splice(i, 1);
    this.selectedRow = null;
    this.calcTotales();
  }

  calcTotales(): void {
    this.subtotal = +this.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
    this.descuento = +(this.subtotal * (this.descPct / 100)).toFixed(2);
    this.total = +(this.subtotal - this.descuento).toFixed(2);
    this.calcCambio();
  }

  calcCambio(): void {
    this.cambio = +(this.efectivoRecibido - this.total).toFixed(2);
  }

  quickAmounts(): number[] {
    const t = this.total;
    const base = [50, 100, 200, 500];
    const exact = Math.ceil(t);
    return [...new Set([exact, ...base.filter(a => a >= t)])].sort((a,b) => a-b).slice(0, 4);
  }

  setEfectivo(a: number): void {
    this.efectivoRecibido = a;
    this.calcCambio();
  }

  setPago(m: 'efectivo' | 'tarjeta' | 'transferencia'): void {
    this.pagoActivo = m;
  }

  buscarCliente(term: string): void {
    this.clienteSubject.next(term);
    if (!term) { this.clienteId = null; this.clienteNombre = ''; }
  }

  seleccionarCliente(c: any): void {
    this.clienteId = c.id;
    this.clienteNombre = c.nombre;
    this.clienteSearch = c.nombre;
    this.clienteResultados = [];
  }

  setConsumidorFinal(): void {
    this.clienteId = null;
    this.clienteNombre = '';
    this.clienteSearch = '';
    this.clienteResultados = [];
  }

  puedeVender(): boolean {
    if (this.items.length === 0) return false;
    if (this.pagoActivo === 'efectivo' && this.efectivoRecibido < this.total) return false;
    return true;
  }

  cobrar(): void {
    if (!this.puedeVender()) return;
    this.saving = true;

    const pagos: Pago[] = [{
      metodo: this.pagoActivo,
      monto: this.pagoActivo === 'efectivo' ? this.efectivoRecibido : this.total,
      referencia: this.pagoReferencia || ''
    }];

    const body = {
      persona_id: this.clienteId,
      tipo: 'tienda',
      total: this.total,
      caja_id: this.cajaActiva?.id || null,
      detalle: this.items.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio: i.precio,
        subtotal: i.subtotal
      })),
      pagos
    };

    this.api.post<any>('/ventas', body).subscribe({
      next: r => {
        this.saving = false;
        this.ventaCreada = r.data;
        this.itemsCobrados = [...this.items];
        this.totalCobrado = this.total;
        this.pagoMetodoCobrado = this.pagoActivo;
        this.pagoMontoCobrado = pagos[0].monto;
        this.cambioCobrado = this.pagoActivo === 'efectivo' ? this.cambio : 0;
        this.showTicket = true;
        this.loadHistorial();
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al procesar la venta', true);
      }
    });
  }

  nuevaVenta(): void {
    this.showTicket = false;
    this.limpiar();
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
  }

  cerrarTicket(): void {
    this.showTicket = false;
  }

  limpiar(): void {
    this.items = [];
    this.selectedRow = null;
    this.descPct = 0;
    this.efectivoRecibido = 0;
    this.pagoReferencia = '';
    this.setConsumidorFinal();
    this.calcTotales();
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  verVenta(h: any): void {
    this.showToast(`Venta #${h.correlativo} — Q ${h.total}`);
  }

  irACaja(): void {
    this.router.navigate(['/caja']);
  }

  private loadHistorial(): void {
    this.api.get<any[]>('/ventas', { limit: 5 }).subscribe({
      next: r => { this.historial = (r.data as any) || []; }
    });
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => { this.toast.show = false; }, 3500);
  }
}
