import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Persona {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  direccion: string;
  tipo: 'cliente' | 'paciente' | 'ambos';
  email: string;
  created_at: string;
}

@Component({
  selector: 'app-clientes',
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">CLIENTES</h2>
          <p class="page-subtitle">Gestión de clientes y pacientes</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <span class="material-icons">person_add</span> Nuevo Cliente
        </button>
      </div>

      <!-- Filtros -->
      <div class="card filters-bar">
        <div class="filter-search">
          <span class="material-icons search-icon">search</span>
          <input class="search-input" placeholder="Buscar por nombre, NIT o teléfono..."
                 [(ngModel)]="search" (input)="onSearch()" />
        </div>
        <div class="filter-selects">
          <select [(ngModel)]="filterTipo" (change)="onSearch()">
            <option value="">Todos los tipos</option>
            <option value="cliente">Clientes</option>
            <option value="paciente">Pacientes</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
      </div>

      <!-- Stats rápidas -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="material-icons stat-icon icon-blue">people</span>
          <div>
            <div class="stat-val">{{ total }}</div>
            <div class="stat-label">Total registros</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons stat-icon icon-green">shopping_cart</span>
          <div>
            <div class="stat-val">{{ countTipo('cliente') }}</div>
            <div class="stat-label">Clientes</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons stat-icon icon-purple">local_hospital</span>
          <div>
            <div class="stat-val">{{ countTipo('paciente') }}</div>
            <div class="stat-label">Pacientes</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons stat-icon icon-amber">swap_horiz</span>
          <div>
            <div class="stat-val">{{ countTipo('ambos') }}</div>
            <div class="stat-label">Ambos</div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>NIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="8" class="td-center">
                  <span class="material-icons spin">refresh</span> Cargando...
                </td>
              </tr>
              <tr *ngIf="!loading && personas.length === 0">
                <td colspan="8" class="td-center td-empty">No se encontraron clientes</td>
              </tr>
              <tr *ngFor="let p of personas">
                <td class="td-id">{{ p.id }}</td>
                <td>
                  <div class="person-cell">
                    <div class="avatar" [ngClass]="'avatar-' + p.tipo">{{ initials(p.nombre) }}</div>
                    <span class="person-name">{{ p.nombre }}</span>
                  </div>
                </td>
                <td class="td-mono">{{ p.nit || '—' }}</td>
                <td class="td-sec">{{ p.telefono || '—' }}</td>
                <td class="td-sec">{{ p.email || '—' }}</td>
                <td class="td-sec td-trunc" [title]="p.direccion">{{ p.direccion || '—' }}</td>
                <td>
                  <span class="chip" [ngClass]="'chip-' + p.tipo">{{ tipoLabel(p.tipo) }}</span>
                </td>
                <td class="td-actions">
                  <button class="icon-btn" title="Editar" (click)="openEdit(p)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="icon-btn icon-btn-danger" title="Eliminar" (click)="deletePersona(p)">
                    <span class="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer paginación -->
        <div class="table-footer">
          <span class="total-count">{{ total }} registros</span>
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
            <div class="modal-avatar" [ngClass]="'avatar-' + form.value.tipo">
              {{ editingId ? initials(form.value.nombre) : '?' }}
            </div>
            <h3>{{ editingId ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
          </div>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">

              <div class="form-group col-2">
                <label>Nombre completo *</label>
                <input formControlName="nombre" placeholder="Ej: Juan García López" />
                <span class="field-error" *ngIf="f['nombre'].touched && f['nombre'].invalid">Requerido</span>
              </div>

              <div class="form-group">
                <label>NIT</label>
                <input formControlName="nit" placeholder="Ej: 12345678-9 o CF" />
              </div>

              <div class="form-group">
                <label>Tipo *</label>
                <select formControlName="tipo">
                  <option value="cliente">Cliente</option>
                  <option value="paciente">Paciente</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div class="form-group">
                <label>Teléfono</label>
                <input formControlName="telefono" placeholder="Ej: 5555-1234" />
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" formControlName="email" placeholder="Ej: correo@gmail.com" />
                <span class="field-error" *ngIf="f['email'].touched && f['email'].errors?.['email']">Email inválido</span>
              </div>

              <div class="form-group col-2">
                <label>Dirección</label>
                <input formControlName="direccion" placeholder="Ej: 5a Avenida 10-50, Zona 1" />
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Cliente') }}
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

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--space-md); }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: var(--space-md); display: flex; align-items: center; gap: var(--space-md); }
    .stat-icon { font-size: 32px; }
    .icon-blue { color: var(--primary); }
    .icon-green { color: var(--success); }
    .icon-purple { color: #8b5cf6; }
    .icon-amber { color: #f59e0b; }
    .stat-val { font-size: 22px; font-weight: 800; color: var(--text); line-height: 1; }
    .stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }

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
    .td-id { color: var(--text-disabled); font-size: 12px; font-family: monospace; width: 50px; }
    .td-sec { color: var(--text-secondary); font-size: 13px; }
    .td-mono { font-family: monospace; font-size: 12px; }
    .td-trunc { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-actions { display: flex; gap: 4px; }
    .td-center { text-align: center; padding: 40px; color: var(--text-disabled); display: table-cell; }
    .td-empty { font-style: italic; }

    /* Person cell */
    .person-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .avatar-cliente { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .avatar-paciente { background: color-mix(in srgb, #8b5cf6 15%, transparent); color: #8b5cf6; }
    .avatar-ambos { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #f59e0b; }
    .person-name { font-weight: 600; color: var(--text); }

    /* Chips */
    .chip { display: inline-flex; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .chip-cliente { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .chip-paciente { background: color-mix(in srgb, #8b5cf6 12%, transparent); color: #8b5cf6; }
    .chip-ambos { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }

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
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface); z-index: 1; }
    .modal-title-wrap { display: flex; align-items: center; gap: var(--space-sm); }
    .modal-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
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

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ClientesComponent implements OnInit {
  personas: Persona[] = [];
  search = '';
  filterTipo = '';
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
      tipo: ['cliente', Validators.required],
      telefono: [''],
      email: ['', Validators.email],
      direccion: ['']
    });
  }

  get f() { return this.form.controls; }

  load(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, search: this.search };
    if (this.filterTipo) params.tipo = this.filterTipo;

    this.api.get<Persona[]>('/personas', params).subscribe({
      next: r => {
        this.loading = false;
        this.personas = r.data as any;
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

  countTipo(tipo: string): number {
    return this.personas.filter(p => p.tipo === tipo || (tipo !== 'ambos' && p.tipo === 'ambos')).length;
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ tipo: 'cliente' });
    this.showModal = true;
  }

  openEdit(p: Persona): void {
    this.editingId = p.id;
    this.form.patchValue({
      nombre: p.nombre,
      nit: p.nit || '',
      tipo: p.tipo,
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || ''
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
      tipo: v.tipo,
      telefono: v.telefono || null,
      email: v.email || null,
      direccion: v.direccion || null
    };

    const obs = this.editingId
      ? this.api.put(`/personas/${this.editingId}`, payload)
      : this.api.post('/personas', payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        this.showToast(this.editingId ? 'Cliente actualizado' : 'Cliente creado');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al guardar', true);
      }
    });
  }

  deletePersona(p: Persona): void {
    if (!confirm(`¿Eliminar a "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.api.delete(`/personas/${p.id}`).subscribe({
      next: () => { this.load(); this.showToast('Cliente eliminado'); },
      error: () => this.showToast('Error al eliminar', true)
    });
  }

  initials(nombre: string): string {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  tipoLabel(tipo: string): string {
    return { cliente: 'Cliente', paciente: 'Paciente', ambos: 'Ambos' }[tipo] || tipo;
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3000);
  }
}
