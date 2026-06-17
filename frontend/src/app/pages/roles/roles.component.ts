import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService, MenuService } from '../../services/usuario.service';
import { Rol, Menu } from '../../models';

interface PermisoRow {
  menu_id: number;
  menu_nombre: string;
  menu_icono: string;
  padre_id?: number;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

@Component({
  selector: 'app-roles',
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">ROLES Y PERMISOS</h2>
          <p class="page-subtitle">Configura qué puede ver y hacer cada rol</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <span class="material-icons">add</span> Nuevo Rol
        </button>
      </div>

      <!-- Lista de roles -->
      <div class="roles-layout">
        <!-- Panel izquierdo: lista -->
        <div class="card roles-list">
          <div class="roles-list-header">
            <span class="section-title">Roles del sistema</span>
          </div>
          <div class="role-item" *ngFor="let r of roles"
               [class.active]="selectedRol?.id === r.id"
               (click)="selectRol(r)">
            <div class="role-icon">
              <span class="material-icons">shield</span>
            </div>
            <div class="role-info">
              <span class="role-name">{{ r.nombre }}</span>
              <span class="role-count">{{ getPermCount(r.id) }} módulos</span>
            </div>
            <div class="role-actions">
              <button class="icon-btn" (click)="openEdit(r); $event.stopPropagation()" title="Editar nombre">
                <span class="material-icons">edit</span>
              </button>
              <button class="icon-btn icon-btn-danger" (click)="deleteRol(r); $event.stopPropagation()" title="Eliminar">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
          <div class="roles-empty" *ngIf="!roles.length">Sin roles</div>
        </div>

        <!-- Panel derecho: permisos -->
        <div class="card permisos-panel" *ngIf="selectedRol">
          <div class="permisos-header">
            <div>
              <h3 class="permisos-title">Permisos: {{ selectedRol.nombre }}</h3>
              <p class="permisos-hint">Marca qué puede hacer este rol en cada módulo</p>
            </div>
            <button class="btn btn-primary" (click)="savePermisos()" [disabled]="saving">
              <span class="material-icons">save</span>
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>

          <!-- Acceso rápido: seleccionar todos -->
          <div class="quick-actions">
            <button class="btn-quick" (click)="toggleAll(true)">Activar todo</button>
            <button class="btn-quick" (click)="toggleAll(false)">Desactivar todo</button>
          </div>

          <div class="table-wrap">
            <table class="perm-table">
              <thead>
                <tr>
                  <th class="th-menu">Módulo</th>
                  <th class="th-perm">Ver</th>
                  <th class="th-perm">Crear</th>
                  <th class="th-perm">Editar</th>
                  <th class="th-perm">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let g of menuGroups">
                  <!-- Grupo padre -->
                  <tr class="group-row" *ngIf="g.children.length">
                    <td colspan="5">
                      <span class="material-icons group-icon">{{ g.icono }}</span>
                      {{ g.nombre }}
                    </td>
                  </tr>
                  <!-- Hijos -->
                  <tr *ngFor="let p of g.children" class="perm-row">
                    <td class="td-menu">
                      <span class="material-icons menu-icon-sm">{{ p.menu_icono }}</span>
                      {{ p.menu_nombre }}
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="p.puede_ver">
                        <input type="checkbox" [(ngModel)]="p.puede_ver" (change)="onVerChange(p)" />
                      </label>
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="p.puede_crear" [class.disabled]="!p.puede_ver">
                        <input type="checkbox" [(ngModel)]="p.puede_crear" [disabled]="!p.puede_ver" />
                      </label>
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="p.puede_editar" [class.disabled]="!p.puede_ver">
                        <input type="checkbox" [(ngModel)]="p.puede_editar" [disabled]="!p.puede_ver" />
                      </label>
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="p.puede_eliminar" [class.disabled]="!p.puede_ver">
                        <input type="checkbox" [(ngModel)]="p.puede_eliminar" [disabled]="!p.puede_ver" />
                      </label>
                    </td>
                  </tr>
                  <!-- Menú raíz sin hijos -->
                  <tr *ngIf="!g.children.length" class="perm-row">
                    <td class="td-menu">
                      <span class="material-icons menu-icon-sm">{{ g.icono }}</span>
                      {{ g.nombre }}
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="g.perm!.puede_ver">
                        <input type="checkbox" [(ngModel)]="g.perm!.puede_ver" (change)="onVerChange(g.perm!)" />
                      </label>
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="g.perm!.puede_crear" [class.disabled]="!g.perm!.puede_ver">
                        <input type="checkbox" [(ngModel)]="g.perm!.puede_crear" [disabled]="!g.perm!.puede_ver" />
                      </label>
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="g.perm!.puede_editar" [class.disabled]="!g.perm!.puede_ver">
                        <input type="checkbox" [(ngModel)]="g.perm!.puede_editar" [disabled]="!g.perm!.puede_ver" />
                      </label>
                    </td>
                    <td class="td-perm">
                      <label class="toggle" [class.on]="g.perm!.puede_eliminar" [class.disabled]="!g.perm!.puede_ver">
                        <input type="checkbox" [(ngModel)]="g.perm!.puede_eliminar" [disabled]="!g.perm!.puede_ver" />
                      </label>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card permisos-empty" *ngIf="!selectedRol">
          <span class="material-icons empty-icon">manage_accounts</span>
          <p>Selecciona un rol para configurar sus permisos</p>
        </div>
      </div>
    </div>

    <!-- Modal nombre rol -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="saveRol()">
            <div class="form-group">
              <label>Nombre del rol *</label>
              <input formControlName="nombre" placeholder="Ej: Vendedor, Supervisor..." />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear') }}
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

    /* Layout dos columnas */
    .roles-layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--space-md); align-items: start; }
    @media (max-width: 768px) { .roles-layout { grid-template-columns: 1fr; } }

    /* Roles list */
    .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .roles-list-header { padding: var(--space-md) var(--space-md) var(--space-sm); }
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--text-secondary); }
    .role-item { display: flex; align-items: center; gap: 12px; padding: 12px var(--space-md); cursor: pointer; transition: background var(--transition-fast); border-left: 3px solid transparent; }
    .role-item:hover { background: var(--surface-hover); }
    .role-item.active { background: color-mix(in srgb, var(--primary) 8%, var(--surface)); border-left-color: var(--primary); }
    .role-icon { width: 34px; height: 34px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--primary) 12%, transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .role-icon .material-icons { font-size: 18px; color: var(--primary); }
    .role-info { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
    .role-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .role-count { font-size: 11px; color: var(--text-secondary); }
    .role-actions { display: flex; gap: 2px; opacity: 0; transition: opacity var(--transition-fast); }
    .role-item:hover .role-actions { opacity: 1; }
    .roles-empty { padding: var(--space-lg); text-align: center; color: var(--text-disabled); font-size: 13px; }

    /* Permisos panel */
    .permisos-panel { }
    .permisos-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); padding: var(--space-lg); border-bottom: 1px solid var(--border); }
    .permisos-title { font-size: 16px; font-weight: 700; color: var(--text); margin: 0; }
    .permisos-hint { font-size: 12px; color: var(--text-secondary); margin: 4px 0 0; }

    .quick-actions { display: flex; gap: var(--space-sm); padding: var(--space-sm) var(--space-lg); border-bottom: 1px solid var(--border-light); }
    .btn-quick { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px 12px; font-size: 12px; cursor: pointer; color: var(--text-secondary); transition: all var(--transition-fast); }
    .btn-quick:hover { background: var(--surface-hover); color: var(--text); }

    .table-wrap { overflow-x: auto; }
    .perm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .perm-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .5px; color: var(--text-secondary); background: var(--surface-hover); border-bottom: 1px solid var(--border); text-transform: uppercase; }
    .th-menu { min-width: 200px; }
    .th-perm { text-align: center; width: 80px; }
    .perm-table td { padding: 9px 14px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .perm-table tr:last-child td { border-bottom: none; }

    .group-row td { background: var(--surface-active); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-secondary); padding: 8px 14px; display: flex; align-items: center; gap: 8px; }
    .group-icon { font-size: 16px; }
    .perm-row:hover td { background: var(--surface-hover); }
    .td-menu { display: flex; align-items: center; gap: 8px; color: var(--text); padding-left: 24px !important; }
    .menu-icon-sm { font-size: 16px; color: var(--text-secondary); }
    .td-perm { text-align: center; }

    /* Toggle checkbox visual */
    .toggle { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    .toggle input { width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer; }
    .toggle.disabled { opacity: 0.4; cursor: not-allowed; }
    .toggle.disabled input { cursor: not-allowed; }

    /* Permisos empty */
    .permisos-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-md); padding: 60px var(--space-lg); color: var(--text-secondary); }
    .empty-icon { font-size: 48px; color: var(--border); }

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
    .icon-btn-danger:hover { background: var(--error-light); color: var(--error); }
    .icon-btn .material-icons { font-size: 17px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: var(--z-modal-backdrop); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal { background: var(--surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 560px; }
    .modal-sm { max-width: 360px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; border-radius: var(--radius-sm); padding: 4px; }
    .modal-close:hover { background: var(--surface-hover); }
    .modal-body { padding: var(--space-lg); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-light); }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .form-group input { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; color: var(--text); background: var(--surface); outline: none; transition: border-color var(--transition-fast); }
    .form-group input:focus { border-color: var(--primary); }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; z-index: var(--z-tooltip); background: var(--text); color: var(--surface); padding: 12px 18px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all var(--transition-normal); pointer-events: none; box-shadow: var(--shadow-lg); }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-error { background: var(--error); }
    .toast .material-icons { font-size: 18px; }
  `]
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  allMenus: Menu[] = [];
  selectedRol: Rol | null = null;
  permisos: PermisoRow[] = [];
  menuGroups: any[] = [];
  permCountMap: Map<number, number> = new Map();

  showModal = false;
  editingId: number | null = null;
  form!: FormGroup;
  saving = false;
  toast = { show: false, msg: '', error: false };
  private toastTimer: any;

  constructor(
    private rolSvc: RolService,
    private menuSvc: MenuService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({ nombre: ['', Validators.required] });
    this.menuSvc.getAll().subscribe(r => {
      this.allMenus = r.data as any;
      this.loadRoles();
    });
  }

  loadRoles(): void {
    this.rolSvc.getAll().subscribe(r => {
      this.roles = r.data as any;
      this.roles.forEach(rol => this.loadPermCount(rol.id));
      if (this.selectedRol) {
        const updated = this.roles.find(r => r.id === this.selectedRol!.id);
        if (updated) this.selectRol(updated);
      }
    });
  }

  private loadPermCount(rolId: number): void {
    this.rolSvc.getById(rolId).subscribe(r => {
      const permisos = (r.data as any).permisos || [];
      this.permCountMap.set(rolId, permisos.filter((p: any) => p.puede_ver).length);
    });
  }

  getPermCount(rolId: number): number {
    return this.permCountMap.get(rolId) || 0;
  }

  selectRol(rol: Rol): void {
    this.selectedRol = rol;
    this.rolSvc.getById(rol.id).subscribe(r => {
      const existing: any[] = (r.data as any).permisos || [];
      this.buildPermisos(existing);
    });
  }

  private buildPermisos(existing: any[]): void {
    const rows: PermisoRow[] = this.allMenus.map(m => {
      const ex = existing.find((e: any) => e.menu_id === m.id);
      return {
        menu_id: m.id,
        menu_nombre: m.nombre,
        menu_icono: m.icono || 'menu',
        padre_id: m.padre_id,
        puede_ver: ex ? !!ex.puede_ver : false,
        puede_crear: ex ? !!ex.puede_crear : false,
        puede_editar: ex ? !!ex.puede_editar : false,
        puede_eliminar: ex ? !!ex.puede_eliminar : false
      };
    });

    const roots = this.allMenus.filter(m => !m.padre_id);
    this.menuGroups = roots.map(r => {
      const children = rows.filter(p => p.padre_id === r.id);
      const ownPerm = rows.find(p => p.menu_id === r.id)!;
      return { ...r, perm: ownPerm, children };
    });

    this.permisos = rows;
  }

  onVerChange(p: PermisoRow): void {
    if (!p.puede_ver) {
      p.puede_crear = false;
      p.puede_editar = false;
      p.puede_eliminar = false;
    }
  }

  toggleAll(on: boolean): void {
    this.permisos.forEach(p => {
      p.puede_ver = on;
      p.puede_crear = on;
      p.puede_editar = on;
      p.puede_eliminar = on;
    });
  }

  savePermisos(): void {
    if (!this.selectedRol) return;
    this.saving = true;
    const payload = {
      nombre: this.selectedRol.nombre,
      permisos: this.permisos.map(p => ({
        menu_id: p.menu_id,
        puede_ver: p.puede_ver ? 1 : 0,
        puede_crear: p.puede_crear ? 1 : 0,
        puede_editar: p.puede_editar ? 1 : 0,
        puede_eliminar: p.puede_eliminar ? 1 : 0
      }))
    };
    this.rolSvc.update(this.selectedRol.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.loadPermCount(this.selectedRol!.id);
        this.showToast('Permisos guardados correctamente');
      },
      error: () => { this.saving = false; this.showToast('Error al guardar permisos', true); }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset();
    this.showModal = true;
  }

  openEdit(r: Rol): void {
    this.editingId = r.id;
    this.form.patchValue({ nombre: r.nombre });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveRol(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.editingId
      ? this.rolSvc.update(this.editingId, { nombre: this.form.value.nombre, permisos: [] })
      : this.rolSvc.create({ nombre: this.form.value.nombre, permisos: [] } as any);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadRoles();
        this.showToast(this.editingId ? 'Rol actualizado' : 'Rol creado');
      },
      error: () => { this.saving = false; this.showToast('Error al guardar', true); }
    });
  }

  deleteRol(r: Rol): void {
    if (!confirm(`¿Eliminar el rol "${r.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.rolSvc.delete(r.id).subscribe({
      next: () => {
        if (this.selectedRol?.id === r.id) this.selectedRol = null;
        this.loadRoles();
        this.showToast('Rol eliminado');
      },
      error: () => this.showToast('Error al eliminar', true)
    });
  }

  private showToast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg, error };
    this.toastTimer = setTimeout(() => this.toast.show = false, 3000);
  }
}
