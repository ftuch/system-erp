import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../models';

@Component({
  selector: 'app-sucursales',
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">SUCURSALES</h2>
          <p class="page-subtitle">Gestión de sucursales y puntos de venta</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <span class="material-icons">add_business</span> Nueva Sucursal
        </button>
      </div>

      <!-- Barra búsqueda -->
      <div class="card search-bar">
        <span class="material-icons search-icon">search</span>
        <input class="search-input" placeholder="Buscar por nombre o dirección..."
               [(ngModel)]="search" (input)="onSearch()" />
      </div>

      <!-- Grid de sucursales -->
      <div class="sucursales-grid" *ngIf="sucursales.length">
        <div class="sucursal-card" *ngFor="let s of sucursales"
             [class.inactive]="s.estado === 0">
          <div class="sc-header">
            <div class="sc-icon">
              <span class="material-icons">store</span>
            </div>
            <div class="sc-actions">
              <button class="icon-btn" title="Editar" (click)="openEdit(s)">
                <span class="material-icons">edit</span>
              </button>
              <button class="icon-btn icon-btn-danger" title="Eliminar" (click)="deleteSucursal(s)">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
          <div class="sc-body">
            <h3 class="sc-name">{{ s.nombre }}</h3>
            <div class="sc-info" *ngIf="s.direccion">
              <span class="material-icons sc-info-icon">location_on</span>
              <span>{{ s.direccion }}</span>
            </div>
            <div class="sc-info" *ngIf="s.telefono">
              <span class="material-icons sc-info-icon">phone</span>
              <span>{{ s.telefono }}</span>
            </div>
          </div>
          <div class="sc-footer">
            <span class="badge" [class.badge-green]="s.estado === 1" [class.badge-red]="s.estado === 0">
              {{ s.estado === 1 ? 'Activa' : 'Inactiva' }}
            </span>
            <span class="sc-id"># {{ s.id }}</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="card empty-state" *ngIf="!sucursales.length && !loading">
        <span class="material-icons empty-icon">store_mall_directory</span>
        <p>No se encontraron sucursales</p>
        <button class="btn btn-primary" (click)="openCreate()">Crear primera sucursal</button>
      </div>

      <!-- Paginación -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button class="page-btn" [disabled]="page === 1" (click)="changePage(page - 1)">
          <span class="material-icons">chevron_left</span>
        </button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" [disabled]="page === totalPages" (click)="changePage(page + 1)">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
    </div>

    <!-- Modal crear / editar -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-group form-group-full">
                <label>Nombre *</label>
                <input formControlName="nombre" placeholder="Ej: Sucursal Central" />
                <span class="field-error" *ngIf="f['nombre'].touched && f['nombre'].invalid">Requerido</span>
              </div>
              <div class="form-group form-group-full">
                <label>Dirección</label>
                <input formControlName="direccion" placeholder="Ej: 5a Avenida 10-50, Zona 1" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input formControlName="telefono" placeholder="Ej: 2222-3333" />
              </div>
              <div class="form-group form-group-check" *ngIf="editingId">
                <label class="check-label">
                  <input type="checkbox" formControlName="estado" />
                  <span>Sucursal activa</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Sucursal') }}
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

    /* Search */
    .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .search-bar { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); }
    .search-icon { color: var(--text-disabled); font-size: 20px; }
    .search-input { border: none; outline: none; background: none; font-size: 14px; color: var(--text); flex: 1; }

    /* Grid */
    .sucursales-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-md); }

    .sucursal-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); overflow: hidden; transition: box-shadow var(--transition-fast), transform var(--transition-fast);
    }
    .sucursal-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .sucursal-card.inactive { opacity: 0.6; }

    .sc-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-md); background: color-mix(in srgb, var(--primary) 6%, var(--surface)); border-bottom: 1px solid var(--border-light); }
    .sc-icon { width: 40px; height: 40px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--primary) 15%, transparent); display: flex; align-items: center; justify-content: center; }
    .sc-icon .material-icons { color: var(--primary); font-size: 22px; }
    .sc-actions { display: flex; gap: 4px; }

    .sc-body { padding: var(--space-md); display: flex; flex-direction: column; gap: 8px; }
    .sc-name { font-size: 15px; font-weight: 700; color: var(--text); margin: 0; }
    .sc-info { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--text-secondary); }
    .sc-info-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

    .sc-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px var(--space-md); border-top: 1px solid var(--border-light); }
    .sc-id { font-size: 11px; color: var(--text-disabled); font-family: monospace; }

    /* Badges */
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .badge-green { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .badge-red { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-sm); }
    .page-btn { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 13px; color: var(--text-secondary); min-width: 60px; text-align: center; }

    /* Empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: 60px; color: var(--text-secondary); }
    .empty-icon { font-size: 56px; color: var(--border); }

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
    .icon-btn .material-icons { font-size: 18px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 500px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; border-radius: var(--radius-sm); padding: 4px; }
    .modal-close:hover { background: var(--surface-hover); }
    .modal-body { padding: var(--space-lg); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-light); }

    /* Form */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group-full { grid-column: 1 / -1; }
    .form-group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .form-group input { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; color: var(--text); background: var(--surface); outline: none; transition: border-color var(--transition-fast); }
    .form-group input:focus { border-color: var(--primary); }
    .field-error { font-size: 11px; color: var(--error); }
    .form-group-check { justify-content: flex-end; padding-bottom: 4px; }
    .check-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); }
    .check-label input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--primary); }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SucursalesComponent implements OnInit {
  sucursales: Sucursal[] = [];
  search = '';
  page = 1;
  limit = 12;
  totalPages = 1;
  loading = false;
  saving = false;

  showModal = false;
  editingId: number | null = null;
  form!: FormGroup;

  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      direccion: [''],
      telefono: [''],
      estado: [true]
    });
  }

  get f() { return this.form.controls; }

  load(): void {
    this.loading = true;
    this.api.get<Sucursal[]>('/sucursales', { page: this.page, limit: this.limit, search: this.search })
      .subscribe({
        next: r => {
          this.loading = false;
          this.sucursales = r.data as any;
          if (r.pagination) this.totalPages = r.pagination.totalPages;
        },
        error: () => { this.loading = false; }
      });
  }

  onSearch(): void { this.page = 1; this.load(); }
  changePage(p: number): void { this.page = p; this.load(); }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ estado: true });
    this.showModal = true;
  }

  openEdit(s: Sucursal): void {
    this.editingId = s.id;
    this.form.patchValue({
      nombre: s.nombre,
      direccion: s.direccion || '',
      telefono: s.telefono || '',
      estado: s.estado === 1
    });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    const payload = {
      nombre: v.nombre,
      direccion: v.direccion || null,
      telefono: v.telefono || null,
      estado: v.estado ? 1 : 0
    };

    const obs = this.editingId
      ? this.api.put(`/sucursales/${this.editingId}`, payload)
      : this.api.post('/sucursales', payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        this.showToast(this.editingId ? 'Sucursal actualizada' : 'Sucursal creada');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al guardar', true);
      }
    });
  }

  deleteSucursal(s: Sucursal): void {
    if (!confirm(`¿Eliminar la sucursal "${s.nombre}"?`)) return;
    this.api.delete(`/sucursales/${s.id}`).subscribe({
      next: () => { this.load(); this.showToast('Sucursal eliminada'); },
      error: () => this.showToast('Error al eliminar', true)
    });
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3000);
  }
}
