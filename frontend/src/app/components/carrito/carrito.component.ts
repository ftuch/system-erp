import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService, CarritoItem } from '../../services/carrito.service';
import { PlanService } from '../../services/plan.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-carrito',
  template: `
    <!-- Overlay -->
    <div class="carrito-overlay" *ngIf="carrito.isOpen" (click)="carrito.cerrar()"></div>

    <!-- Drawer -->
    <div class="carrito-drawer" [class.open]="carrito.isOpen">
      <div class="carrito-header">
        <div class="carrito-title">
          <span class="material-icons">shopping_cart</span>
          Carrito de pedido
          <span class="carrito-count" *ngIf="carrito.count > 0">{{ carrito.count }}</span>
        </div>
        <button class="carrito-close" (click)="carrito.cerrar()">
          <span class="material-icons">close</span>
        </button>
      </div>

      <!-- Plan bloqueado -->
      <div class="plan-lock" *ngIf="!planService.canUsePedidos()">
        <span class="material-icons">lock</span>
        <div>
          <div class="lock-title">Función Plan Plus / Full</div>
          <div class="lock-desc">Actualiza tu plan para crear pedidos desde productos.</div>
        </div>
      </div>

      <!-- Vacío -->
      <div class="carrito-empty" *ngIf="planService.canUsePedidos() && items.length === 0">
        <span class="material-icons">shopping_cart</span>
        <p>El carrito está vacío</p>
        <span class="empty-hint">Usa el botón <span class="material-icons" style="font-size:14px;vertical-align:middle">add_shopping_cart</span> en la tabla de productos</span>
      </div>

      <!-- Lista de ítems -->
      <div class="carrito-items" *ngIf="planService.canUsePedidos() && items.length > 0">
        <div class="carrito-item" *ngFor="let item of items; let i = index">
          <div class="item-tipo-icon" [ngClass]="'tipo-' + item.tipo">
            <span class="material-icons">{{ tipoIcon(item.tipo) }}</span>
          </div>
          <div class="item-info">
            <div class="item-nombre">{{ item.nombre }}</div>
            <div class="item-meta">
              <span class="item-unidad">{{ item.unidad }}</span>
              <span class="item-stock" *ngIf="item.stock_actual >= 0">
                Stock: {{ item.stock_actual }}
              </span>
            </div>
            <div class="item-precio-row">
              <div class="input-prefix-sm">
                <span>Q</span>
                <input type="number" min="0" step="0.01"
                       [value]="item.precio_unitario"
                       (change)="setPrecio(i, $event)" />
              </div>
              <span class="item-sub">= Q {{ item.subtotal | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="item-qty-col">
            <button class="qty-btn" (click)="carrito.setCantidad(i, item.cantidad - 1)">
              <span class="material-icons">remove</span>
            </button>
            <input type="number" min="1" class="qty-input"
                   [value]="item.cantidad"
                   (change)="setCantidad(i, $event)" />
            <button class="qty-btn" (click)="carrito.setCantidad(i, item.cantidad + 1)">
              <span class="material-icons">add</span>
            </button>
          </div>
          <button class="item-remove" (click)="carrito.quitar(i)">
            <span class="material-icons">delete_outline</span>
          </button>
        </div>
      </div>

      <!-- Footer con total y observaciones -->
      <div class="carrito-footer" *ngIf="planService.canUsePedidos() && items.length > 0">
        <div class="footer-obs">
          <label>Observaciones</label>
          <input type="text" [(ngModel)]="observaciones" placeholder="Notas del pedido (opcional)..." />
        </div>
        <div class="footer-total">
          <span>Total referencial</span>
          <span class="total-val">Q {{ carrito.total | number:'1.2-2' }}</span>
        </div>
        <div class="footer-actions">
          <button class="btn-vaciar" (click)="vaciar()">
            <span class="material-icons">delete_sweep</span> Vaciar
          </button>
          <button class="btn-crear" (click)="crearPedido()" [disabled]="saving">
            <span class="material-icons spin" *ngIf="saving">refresh</span>
            <span class="material-icons" *ngIf="!saving">send</span>
            {{ saving ? 'Creando...' : 'Crear Pedido' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="carrito-toast" [class.show]="toast.show" [class.toast-err]="toast.error">
      <span class="material-icons">{{ toast.error ? 'error' : 'check_circle' }}</span>
      {{ toast.msg }}
    </div>
  `,
  styles: [`
    .carrito-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 1000; }

    .carrito-drawer {
      position: fixed; top: 0; right: 0; height: 100vh; width: 400px; max-width: 100vw;
      background: var(--surface); box-shadow: var(--shadow-xl);
      z-index: 1001; display: flex; flex-direction: column;
      transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
    }
    .carrito-drawer.open { transform: translateX(0); }

    .carrito-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      background: var(--surface); flex-shrink: 0;
    }
    .carrito-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700; color: var(--text);
    }
    .carrito-title .material-icons { color: var(--primary); font-size: 22px; }
    .carrito-count {
      background: var(--primary); color: #fff;
      border-radius: 50%; width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .carrito-close {
      background: none; border: none; cursor: pointer; color: var(--text-secondary);
      padding: 4px; border-radius: var(--radius-sm); display: flex;
    }
    .carrito-close:hover { background: var(--surface-hover); }

    /* Plan lock */
    .plan-lock {
      display: flex; gap: 16px; align-items: flex-start;
      margin: 24px; padding: 20px; border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--error) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
    }
    .plan-lock .material-icons { color: var(--error); font-size: 28px; flex-shrink: 0; }
    .lock-title { font-size: 14px; font-weight: 700; color: var(--text); }
    .lock-desc  { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

    /* Vacío */
    .carrito-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px;
      color: var(--text-disabled); padding: 40px;
    }
    .carrito-empty .material-icons { font-size: 52px; opacity: .4; }
    .carrito-empty p { font-size: 15px; font-weight: 600; margin: 0; }
    .empty-hint { font-size: 12px; color: var(--text-secondary); text-align: center; }

    /* Items */
    .carrito-items { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .carrito-item {
      display: flex; gap: 10px; align-items: flex-start;
      padding: 12px; border-radius: var(--radius-md);
      border: 1px solid var(--border); background: var(--surface);
      transition: box-shadow .15s;
    }
    .carrito-item:hover { box-shadow: var(--shadow-sm); }
    .item-tipo-icon {
      width: 36px; height: 36px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .tipo-producto    { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .tipo-medicamento { background: color-mix(in srgb, #10b981 12%, transparent); color: #10b981; }
    .tipo-servicio    { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #d97706; }
    .item-tipo-icon .material-icons { font-size: 18px; }

    .item-info { flex: 1; min-width: 0; }
    .item-nombre { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { display: flex; gap: 8px; margin-top: 2px; }
    .item-unidad { font-size: 11px; color: var(--text-disabled); }
    .item-stock  { font-size: 11px; color: var(--text-secondary); }
    .item-precio-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .input-prefix-sm {
      display: flex; align-items: center; border: 1px solid var(--border);
      border-radius: var(--radius-sm); overflow: hidden;
    }
    .input-prefix-sm span { padding: 4px 6px; background: var(--surface-hover); font-size: 11px; color: var(--text-secondary); border-right: 1px solid var(--border); }
    .input-prefix-sm input { border: none; padding: 4px 6px; font-size: 12px; color: var(--text); background: var(--surface); outline: none; width: 60px; }
    .item-sub { font-size: 12px; font-weight: 700; color: var(--text); }

    .item-qty-col { display: flex; flex-direction: column; align-items: center; gap: 3px; flex-shrink: 0; }
    .qty-btn { background: var(--surface-hover); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .qty-btn:hover { background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); border-color: var(--primary); }
    .qty-btn .material-icons { font-size: 14px; }
    .qty-input { width: 34px; text-align: center; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px; font-size: 13px; font-weight: 700; color: var(--text); background: var(--surface); outline: none; }
    .item-remove { background: none; border: none; cursor: pointer; color: var(--text-disabled); padding: 4px; border-radius: var(--radius-sm); display: flex; align-items: center; flex-shrink: 0; }
    .item-remove:hover { color: var(--error); background: color-mix(in srgb, var(--error) 8%, transparent); }
    .item-remove .material-icons { font-size: 18px; }

    /* Footer */
    .carrito-footer {
      padding: 16px 20px; border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 12px; flex-shrink: 0;
      background: var(--surface);
    }
    .footer-obs label { font-size: 11px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 5px; }
    .footer-obs input { width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; color: var(--text); background: var(--surface); outline: none; }
    .footer-obs input:focus { border-color: var(--primary); }
    .footer-total { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--surface-hover); border-radius: var(--radius-md); }
    .footer-total span { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .total-val { font-size: 22px; font-weight: 800; color: var(--text); }
    .footer-actions { display: flex; gap: 8px; }
    .btn-vaciar {
      display: flex; align-items: center; gap: 5px;
      background: none; border: 1px solid var(--border); color: var(--text-secondary);
      padding: 8px 14px; border-radius: var(--radius-md); cursor: pointer; font-size: 13px; font-weight: 600;
    }
    .btn-vaciar:hover { border-color: var(--error); color: var(--error); }
    .btn-vaciar .material-icons { font-size: 16px; }
    .btn-crear {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      background: var(--primary); color: #fff; border: none;
      padding: 10px 18px; border-radius: var(--radius-md); cursor: pointer;
      font-size: 14px; font-weight: 700; transition: background .15s;
    }
    .btn-crear:hover:not(:disabled) { background: var(--primary-dark); }
    .btn-crear:disabled { opacity: .6; cursor: default; }
    .btn-crear .material-icons { font-size: 18px; }

    /* Toast */
    .carrito-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(12px);
      z-index: 1100; background: var(--text); color: var(--surface);
      padding: 12px 20px; border-radius: var(--radius-md);
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 500; opacity: 0;
      transition: all .25s; pointer-events: none; box-shadow: var(--shadow-lg);
      white-space: nowrap;
    }
    .carrito-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .carrito-toast.toast-err { background: var(--error); }
    .carrito-toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CarritoComponent implements OnInit {
  items: CarritoItem[] = [];
  observaciones = '';
  saving = false;
  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  constructor(
    public carrito: CarritoService,
    public planService: PlanService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carrito.items$.subscribe(items => this.items = items);
  }

  tipoIcon(tipo: string): string {
    return { producto: 'inventory_2', medicamento: 'medication', servicio: 'miscellaneous_services' }[tipo] || 'inventory_2';
  }

  setCantidad(i: number, e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value);
    if (!isNaN(v)) this.carrito.setCantidad(i, v);
  }

  setPrecio(i: number, e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(v)) this.carrito.setPrecio(i, v);
  }

  vaciar(): void {
    if (!confirm('¿Vaciar el carrito?')) return;
    this.carrito.vaciar();
  }

  crearPedido(): void {
    if (!this.items.length) return;
    this.saving = true;
    const payload = {
      observaciones: this.observaciones || null,
      detalle: this.items.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario
      }))
    };
    this.api.post('/pedidos', payload).subscribe({
      next: (r: any) => {
        this.saving = false;
        this.carrito.vaciar();
        this.carrito.cerrar();
        this.observaciones = '';
        this.showToast(`Pedido ${r.data?.numero} creado exitosamente`);
        setTimeout(() => this.router.navigate(['/pedidos']), 1200);
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al crear el pedido', true);
      }
    });
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3500);
  }
}
