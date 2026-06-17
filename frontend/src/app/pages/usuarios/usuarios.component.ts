import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService, RolService } from '../../services/usuario.service';
import { ApiService } from '../../services/api.service';
import { Usuario, Rol, Sucursal } from '../../models';

@Component({
  selector: 'app-usuarios',
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">USUARIOS</h2>
          <p class="page-subtitle">Gestión de usuarios del sistema</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <span class="material-icons">person_add</span> Nuevo Usuario
        </button>
      </div>

      <!-- Barra búsqueda -->
      <div class="card search-bar">
        <span class="material-icons search-icon">search</span>
        <input class="search-input" placeholder="Buscar por nombre o usuario..."
               [(ngModel)]="search" (input)="onSearch()" />
      </div>

      <!-- Tabla -->
      <div class="card table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td class="td-id">{{ u.id }}</td>
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ initials(u.nombre) }}</div>
                    <span>{{ u.nombre }}</span>
                  </div>
                </td>
                <td><code class="user-code">{{ u.usuario }}</code></td>
                <td><span class="badge badge-blue">{{ u.rol_nombre || '—' }}</span></td>
                <td>{{ u.sucursal_nombre || '—' }}</td>
                <td>
                  <span class="badge" [class.badge-green]="u.estado === 1" [class.badge-red]="u.estado === 0">
                    {{ u.estado === 1 ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="icon-btn" title="Editar" (click)="openEdit(u)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="icon-btn" title="Cambiar contraseña" (click)="openPassword(u)">
                    <span class="material-icons">lock_reset</span>
                  </button>
                  <button class="icon-btn icon-btn-danger" title="Desactivar" (click)="desactivar(u)"
                          *ngIf="u.estado === 1">
                    <span class="material-icons">person_off</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!usuarios.length">
                <td colspan="7" class="empty-row">Sin resultados</td>
              </tr>
            </tbody>
          </table>
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
    </div>

    <!-- Modal crear / editar -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-group">
                <label>Nombre completo *</label>
                <input formControlName="nombre" placeholder="Ej: Juan Pérez" />
                <span class="field-error" *ngIf="f['nombre'].touched && f['nombre'].invalid">Requerido</span>
              </div>
              <div class="form-group">
                <label>Nombre de usuario *</label>
                <input formControlName="usuario" placeholder="Ej: jperez" />
                <span class="field-error" *ngIf="f['usuario'].touched && f['usuario'].invalid">Requerido</span>
              </div>
              <div class="form-group" *ngIf="!editingId">
                <label>Contraseña *</label>
                <input type="password" formControlName="password" placeholder="Mínimo 5 caracteres" />
                <span class="field-error" *ngIf="f['password'].touched && f['password'].invalid">Mínimo 5 caracteres</span>
              </div>
              <div class="form-group">
                <label>Rol *</label>
                <select formControlName="rol_id">
                  <option value="">Seleccionar rol</option>
                  <option *ngFor="let r of roles" [value]="r.id">{{ r.nombre }}</option>
                </select>
                <span class="field-error" *ngIf="f['rol_id'].touched && f['rol_id'].invalid">Requerido</span>
              </div>
              <div class="form-group">
                <label>Sucursal</label>
                <select formControlName="sucursal_id">
                  <option value="">Sin sucursal</option>
                  <option *ngFor="let s of sucursales" [value]="s.id">{{ s.nombre }}</option>
                </select>
              </div>
              <div class="form-group form-group-check">
                <label class="check-label">
                  <input type="checkbox" formControlName="puede_ajustar_inventario" />
                  <span>Puede ajustar inventario</span>
                </label>
              </div>
              <div class="form-group form-group-check" *ngIf="editingId">
                <label class="check-label">
                  <input type="checkbox" formControlName="estado" [value]="1" />
                  <span>Usuario activo</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                <span class="material-icons spin" *ngIf="saving">refresh</span>
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Usuario') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal cambiar contraseña -->
    <div class="modal-backdrop" *ngIf="showPwdModal" (click)="closePwdModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Cambiar Contraseña</h3>
          <button class="modal-close" (click)="closePwdModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Usuario: <strong>{{ pwdTarget?.usuario }}</strong></p>
          <form [formGroup]="pwdForm" (ngSubmit)="savePassword()">
            <div class="form-group">
              <label>Nueva contraseña *</label>
              <input type="password" formControlName="password" placeholder="Mínimo 5 caracteres" />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closePwdModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="pwdForm.invalid || saving">
                {{ saving ? 'Guardando...' : 'Cambiar Contraseña' }}
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
    .search-bar {
      display: flex; align-items: center; gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md); background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius-lg);
    }
    .search-icon { color: var(--text-disabled); font-size: 20px; }
    .search-input { border: none; outline: none; background: none; font-size: 14px; color: var(--text); flex: 1; }

    /* Card / Table */
    .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .table-card { }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .5px; color: var(--text-secondary); background: var(--surface-hover); border-bottom: 1px solid var(--border); text-transform: uppercase; }
    .data-table td { padding: 10px 14px; color: var(--text); border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--surface-hover); }
    .td-id { color: var(--text-disabled); font-size: 12px; }
    .empty-row { text-align: center; color: var(--text-disabled); font-style: italic; padding: 32px !important; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-sm { width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-code { background: var(--surface-active); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 12px; font-family: monospace; }

    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
    .badge-blue { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .badge-green { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .badge-red { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }

    .td-actions { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: var(--radius-sm); color: var(--text-secondary); display: flex; align-items: center; transition: background var(--transition-fast), color var(--transition-fast); }
    .icon-btn:hover { background: var(--surface-active); color: var(--primary); }
    .icon-btn-danger:hover { background: var(--error-light); color: var(--error); }
    .icon-btn .material-icons { font-size: 18px; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); border-top: 1px solid var(--border-light); }
    .page-btn { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 13px; color: var(--text-secondary); min-width: 60px; text-align: center; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: var(--radius-md); border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all var(--transition-fast); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-primary:disabled { opacity: .6; cursor: default; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn .material-icons { font-size: 18px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
    .modal-sm { max-width: 380px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; border-radius: var(--radius-sm); padding: 4px; }
    .modal-close:hover { background: var(--surface-hover); color: var(--text); }
    .modal-body { padding: var(--space-lg); }
    .modal-hint { font-size: 13px; color: var(--text-secondary); margin: 0 0 var(--space-md); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-light); }

    /* Form */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
    @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .form-group input, .form-group select {
      padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md);
      font-size: 14px; color: var(--text); background: var(--surface);
      outline: none; transition: border-color var(--transition-fast);
    }
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
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  sucursales: Sucursal[] = [];

  search = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  saving = false;

  showModal = false;
  editingId: number | null = null;
  form!: FormGroup;

  showPwdModal = false;
  pwdTarget: Usuario | null = null;
  pwdForm!: FormGroup;

  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  constructor(
    private svc: UsuarioService,
    private rolSvc: RolService,
    private api: ApiService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.buildPwdForm();
    this.load();
    this.loadCombos();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      usuario: ['', Validators.required],
      password: ['', [Validators.minLength(5)]],
      rol_id: ['', Validators.required],
      sucursal_id: [''],
      puede_ajustar_inventario: [false],
      estado: [true]
    });
  }

  private buildPwdForm(): void {
    this.pwdForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  get f() { return this.form.controls; }

  load(): void {
    this.svc.getAll({ page: this.page, limit: this.limit, search: this.search }).subscribe({
      next: r => {
        this.usuarios = r.data as any;
        if (r.pagination) this.totalPages = r.pagination.totalPages;
      }
    });
  }

  private loadCombos(): void {
    this.rolSvc.getSimple().subscribe(r => this.roles = r.data as any);
    this.api.get<Sucursal[]>('/sucursales/activas').subscribe(r => this.sucursales = r.data as any);
  }

  onSearch(): void { this.page = 1; this.load(); }
  changePage(p: number): void { this.page = p; this.load(); }

  initials(nombre: string): string {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ puede_ajustar_inventario: false, estado: true });
    this.f['password'].setValidators([Validators.required, Validators.minLength(5)]);
    this.f['password'].updateValueAndValidity();
    this.showModal = true;
  }

  openEdit(u: Usuario): void {
    this.editingId = u.id;
    this.f['password'].clearValidators();
    this.f['password'].updateValueAndValidity();
    this.form.patchValue({
      nombre: u.nombre, usuario: u.usuario,
      rol_id: u.rol_id, sucursal_id: u.sucursal_id || '',
      puede_ajustar_inventario: u.puede_ajustar_inventario === 1,
      estado: u.estado === 1
    });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    const payload: any = {
      nombre: v.nombre, usuario: v.usuario,
      rol_id: +v.rol_id, sucursal_id: v.sucursal_id ? +v.sucursal_id : null,
      puede_ajustar_inventario: v.puede_ajustar_inventario ? 1 : 0,
      estado: v.estado ? 1 : 0
    };
    if (!this.editingId) payload.password = v.password;

    const obs = this.editingId
      ? this.svc.update(this.editingId, payload)
      : this.svc.create(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        this.showToast(this.editingId ? 'Usuario actualizado' : 'Usuario creado');
      },
      error: e => {
        this.saving = false;
        this.showToast(e?.error?.message || 'Error al guardar', true);
      }
    });
  }

  openPassword(u: Usuario): void {
    this.pwdTarget = u;
    this.pwdForm.reset();
    this.showPwdModal = true;
  }

  closePwdModal(): void { this.showPwdModal = false; }

  savePassword(): void {
    if (this.pwdForm.invalid || !this.pwdTarget) return;
    this.saving = true;
    this.svc.updatePassword(this.pwdTarget.id, this.pwdForm.value.password).subscribe({
      next: () => {
        this.saving = false;
        this.closePwdModal();
        this.showToast('Contraseña actualizada');
      },
      error: () => { this.saving = false; this.showToast('Error al cambiar contraseña', true); }
    });
  }

  desactivar(u: Usuario): void {
    if (!confirm(`¿Desactivar al usuario "${u.nombre}"?`)) return;
    this.svc.delete(u.id).subscribe({
      next: () => { this.load(); this.showToast('Usuario desactivado'); },
      error: () => this.showToast('Error al desactivar', true)
    });
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3000);
  }
}
