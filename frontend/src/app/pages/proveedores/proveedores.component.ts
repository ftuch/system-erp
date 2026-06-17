import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Proveedor {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  contacto: string;
  estado: number;
  created_at: string;
}

@Component({
  selector: 'app-proveedores',
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">PROVEEDORES</h2>
          <p class="page-subtitle">Gestión de proveedores y contactos comerciales</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <span class="material-icons">add_business</span> Nuevo Proveedor
        </button>
      </div>

      <!-- Filtros -->
      <div class="card filters-bar">
        <div class="filter-search">
          <span class="material-icons search-icon">search</span>
          <input class="search-input" placeholder="Buscar por nombre, NIT o contacto..."
                 [(ngModel)]="search" (input)="onSearch()" />
        </div>
        <div class="filter-selects">
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
                <th>Proveedor</th>
                <th>NIT</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="9" class="td-center">
                  <span class="material-icons spin">refresh</span> Cargando...
                </td>
              </tr>
              <tr *ngIf="!loading && proveedores.length === 0">
                <td colspan="9" class="td-center td-empty">No se encontraron proveedores</td>
              </tr>
              <tr *ngFor="let p of proveedores" [class.row-inactive]="p.estado === 0">
                <td class="td-id">{{ p.id }}</td>
                <td>
                  <div class="prov-cell">
                    <div class="prov-avatar">{{ initials(p.nombre) }}</div>
                    <div>
                      <div class="prov-name">{{ p.nombre }}</div>
                    </div>
                  </div>
                </td>
                <td class="td-mono">{{ p.nit || '—' }}</td>
                <td class="td-sec">{{ p.contacto || '—' }}</td>
                <td class="td-sec">{{ p.telefono || '—' }}</td>
                <td class="td-sec">{{ p.email || '—' }}</td>
                <td class="td-sec td-trunc" [title]="p.direccion">{{ p.direccion || '—' }}</td>
                <td>
                  <span class="badge" [ngClass]="p.estado === 1 ? 'badge-green' : 'badge-red'">
                    {{ p.estado === 1 ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="icon-btn" title="Editar" (click)="openEdit(p)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="icon-btn" [title]="p.estado === 1 ? 'Desactivar' : 'Activar'"
                          (click)="toggleEstado(p)">
                    <span class="material-icons" [style.color]="p.estado === 1 ? 'var(--success)' : 'var(--error)'">
                      {{ p.estado === 1 ? 'toggle_on' : 'toggle_off' }}
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer paginación -->
        <div class="table-footer">
          <span class="total-count">{{ total }} proveedores</span>
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
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-avatar">
              {{ editingId && form.value.nombre ? initials(form.value.nombre) : '?' }}
            </div>
            <h3>{{ editingId ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h3>
          </div>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">

              <div class="form-group col-2">
                <label>Nombre / Razón social *</label>
                <input formControlName="nombre" placeholder="Ej: Distribuidora Central S.A." />
                <span class="field-error" *ngIf="f['nombre'].touched && f['nombre'].invalid">Requerido</span>
              </div>

              <div class="form-group">
                <label>NIT</label>
                <input formControlName="nit" placeholder="Ej: 12345678-9" />
              </div>

              <div class="form-group">
                <label>Nombre de contacto</label>
                <input formControlName="contacto" placeholder="Ej: María González" />
              </div>

              <div class="form-group">
                <label>Teléfono</label>
                <input formControlName="telefono" placeholder="Ej: 2222-3333" />
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" formControlName="email" placeholder="Ej: ventas@proveedor.com" />
                <span class="field-error" *ngIf="f['email'].touched && f['email'].errors?.['email']">Email inválido</span>
              </div>

              <div class="form-group col-2">
                <label>Dirección</label>
                <input formControlName="direccion" placeholder="Ej: 10 Calle 5-45, Zona 9" />
              </div>

              <div class="form-group form-group-check" *ngIf="editingId">
                <label class="check-label">
                  <input type="checkbox" formControlName="estado" />
                  <span>Proveedor activo</span>
                </label>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Proveedor') }}
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
    .filter-selects select { padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; color: var(--text); background: var(--surface); outline: none; cursor: pointer; }

    /* Tabla */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table thead tr { border-bottom: 2px solid var(--border); }
    .data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .data-table tbody tr:hover { background: var(--surface-hover); }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .row-inactive { opacity: 0.55; }
    .td-id { color: var(--text-disabled); font-size: 12px; font-family: monospace; width: 50px; }
    .td-sec { color: var(--text-secondary); font-size: 13px; }
    .td-mono { font-family: monospace; font-size: 12px; }
    .td-trunc { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-actions { display: flex; gap: 4px; }
    .td-center { text-align: center; padding: 40px; color: var(--text-disabled); }
    .td-empty { font-style: italic; }

    /* Proveedor cell */
    .prov-cell { display: flex; align-items: center; gap: 10px; }
    .prov-avatar { width: 34px; height: 34px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .prov-name { font-weight: 600; color: var(--text); }

    /* Badge */
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
    .icon-btn .material-icons { font-size: 18px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface); z-index: 1; }
    .modal-title-wrap { display: flex; align-items: center; gap: var(--space-sm); }
    .modal-avatar { width: 38px; height: 38px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
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

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  search = '';
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

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit: [''],
      contacto: [''],
      telefono: [''],
      email: ['', Validators.email],
      direccion: [''],
      estado: [true]
    });
  }

  get f() { return this.form.controls; }

  load(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, search: this.search };
    if (this.filterEstado !== '') params.estado = this.filterEstado;

    this.api.get<Proveedor[]>('/proveedores', params).subscribe({
      next: r => {
        this.loading = false;
        this.proveedores = r.data as any;
        if (r.pagination) {
          this.total = r.pagination.total;
          this.totalPages = r.pagination.totalPages;
        }
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

  openEdit(p: Proveedor): void {
    this.editingId = p.id;
    this.form.patchValue({
      nombre: p.nombre,
      nit: p.nit || '',
      contacto: p.contacto || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      estado: p.estado === 1
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
      nit: v.nit || null,
      contacto: v.contacto || null,
      telefono: v.telefono || null,
      email: v.email || null,
      direccion: v.direccion || null,
      estado: v.estado ? 1 : 0
    };

    const obs = this.editingId
      ? this.api.put(`/proveedores/${this.editingId}`, payload)
      : this.api.post('/proveedores', payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        this.showToast(this.editingId ? 'Proveedor actualizado' : 'Proveedor creado');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al guardar', true);
      }
    });
  }

  toggleEstado(p: Proveedor): void {
    const nuevoEstado = p.estado === 1 ? 0 : 1;
    const msg = nuevoEstado === 0 ? `¿Desactivar "${p.nombre}"?` : `¿Activar "${p.nombre}"?`;
    if (!confirm(msg)) return;
    this.api.put(`/proveedores/${p.id}`, { ...p, estado: nuevoEstado }).subscribe({
      next: () => { this.load(); this.showToast(nuevoEstado === 1 ? 'Proveedor activado' : 'Proveedor desactivado'); },
      error: () => this.showToast('Error al cambiar estado', true)
    });
  }

  initials(nombre: string): string {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3000);
  }
}
