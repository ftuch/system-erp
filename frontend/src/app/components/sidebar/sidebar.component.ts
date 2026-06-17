import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Menu, Usuario } from '../../models';

@Component({
  selector: 'app-sidebar',
  template: `
    <!-- Overlay móvil -->
    <div class="sidebar-overlay" *ngIf="mobileOpen" (click)="closeMobile()"></div>

    <aside class="sidebar" [class.collapsed]="collapsed" [class.mobile-open]="mobileOpen">
      <!-- Logo / Brand -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <span class="material-icons">point_of_sale</span>
        </div>
        <span class="brand-text" *ngIf="!collapsed">{{ sucursalNombre }}</span>
        <button class="collapse-btn" (click)="toggleCollapse()" [title]="collapsed ? 'Expandir' : 'Contraer'">
          <span class="material-icons">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </div>

      <!-- Nav items -->
      <nav class="sidebar-nav">
        <ng-container *ngFor="let item of menuTree">
          <!-- Item sin hijos -->
          <a *ngIf="!item.children || item.children.length === 0"
             [routerLink]="['/' + stripSlash(item.ruta)]"
             class="nav-item"
             [class.active]="isActive(item.ruta)"
             [title]="item.nombre">
            <span class="material-icons nav-icon">{{ item.icono }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.nombre }}</span>
          </a>

          <!-- Item con hijos (grupo) -->
          <div *ngIf="item.children && item.children.length > 0" class="nav-group">
            <button class="nav-item nav-group-toggle"
                    [class.open]="item._open"
                    [class.active]="isGroupActive(item)"
                    (click)="toggleGroup(item)"
                    [title]="item.nombre">
              <span class="material-icons nav-icon">{{ item.icono }}</span>
              <span class="nav-label" *ngIf="!collapsed">{{ item.nombre }}</span>
              <span class="material-icons nav-arrow" *ngIf="!collapsed">
                {{ item._open ? 'expand_less' : 'expand_more' }}
              </span>
            </button>
            <div class="nav-children" [class.open]="item._open && !collapsed">
              <a *ngFor="let child of item.children"
                 [routerLink]="['/' + stripSlash(child.ruta)]"
                 class="nav-item nav-child"
                 [class.active]="isActive(child.ruta)"
                 [title]="child.nombre">
                <span class="material-icons nav-icon">{{ child.icono }}</span>
                <span class="nav-label">{{ child.nombre }}</span>
              </a>
            </div>
          </div>
        </ng-container>
      </nav>

      <!-- Selector de tema -->
      <div class="sidebar-theme-wrap" *ngIf="!collapsed">
        <div class="sidebar-divider"></div>
        <app-theme-selector [inline]="true" [showLabel]="true"></app-theme-selector>
      </div>
      <div class="sidebar-theme-icon" *ngIf="collapsed" title="Cambiar tema">
        <app-theme-selector [inline]="true" [showLabel]="false"></app-theme-selector>
      </div>

      <!-- Footer del sidebar -->
      <div class="sidebar-footer" *ngIf="currentUser">
        <div class="user-avatar">{{ getInitials(currentUser.nombre) }}</div>
        <div class="user-details" *ngIf="!collapsed">
          <span class="user-name">{{ currentUser.nombre }}</span>
          <span class="user-role">{{ currentUser.rol_nombre }}</span>
        </div>
        <button class="logout-btn" (click)="logout()" title="Cerrar sesión">
          <span class="material-icons">logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-normal);
      overflow: hidden;
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--z-fixed);
      box-shadow: var(--shadow-sm);
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed); }

    /* Overlay móvil */
    .sidebar-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      z-index: calc(var(--z-fixed) - 1);
      backdrop-filter: blur(2px);
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: var(--sidebar-width) !important;
        transition: transform var(--transition-normal);
        box-shadow: var(--shadow-xl);
      }
      .sidebar.mobile-open { transform: translateX(0); }
      .sidebar-overlay { display: block; }
      .collapse-btn { display: none; }
    }

    /* Brand */
    .sidebar-brand {
      display: flex;
      align-items: center;
      padding: 0 12px;
      height: var(--header-height);
      border-bottom: 1px solid var(--border);
      gap: 10px;
      flex-shrink: 0;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand-icon .material-icons { color: #fff; font-size: 20px; }
    .brand-text {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: background var(--transition-fast);
    }
    .collapse-btn:hover { background: var(--surface-hover); }
    .collapse-btn .material-icons { font-size: 18px; }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: 0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      background: none;
      border: none;
      text-align: left;
      transition: background var(--transition-fast), color var(--transition-fast);
      white-space: nowrap;
      position: relative;
    }
    .nav-item:hover {
      background: var(--surface-hover);
      color: var(--text);
    }
    .nav-item.active {
      background: color-mix(in srgb, var(--primary) 10%, transparent);
      color: var(--primary);
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--primary);
      border-radius: 0 2px 2px 0;
    }
    .nav-icon { font-size: 20px; flex-shrink: 0; }
    .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .nav-arrow { font-size: 18px; color: var(--text-disabled); }

    /* Grupos con hijos */
    .nav-group-toggle.open { color: var(--text); }
    .nav-children { overflow: hidden; max-height: 0; transition: max-height var(--transition-normal); }
    .nav-children.open { max-height: 400px; }
    .nav-child { padding-left: 48px; font-size: 13px; }

    /* Footer */
    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      background: var(--primary);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .logout-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      transition: color var(--transition-fast), background var(--transition-fast);
      flex-shrink: 0;
    }
    .logout-btn:hover { color: var(--error); background: var(--error-light); }
    .logout-btn .material-icons { font-size: 18px; }

    /* Theme section */
    .sidebar-divider { height: 1px; background: var(--border); margin: 4px 0; }
    .sidebar-theme-wrap { flex-shrink: 0; }
    .sidebar-theme-icon { flex-shrink: 0; display: flex; justify-content: center; padding: 4px 0; }

    /* Collapsed state */
    .sidebar.collapsed .sidebar-brand { justify-content: center; padding: 0 8px; }
    .sidebar.collapsed .collapse-btn { margin-left: auto; }

    /* Cerrar sidebar en móvil al navegar */
    @media (max-width: 768px) {
      .nav-item { padding: 13px 16px; font-size: 15px; }
      .nav-child { padding-left: 48px; font-size: 14px; }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = false;
  mobileOpen = false;
  isMobile = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.mobileOpen = false;
  }
  currentUser: Usuario | null = null;
  menuTree: any[] = [];
  sucursalNombre = 'ERP Sistema';

  private subs = new Subscription();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.sucursal_nombre) {
      this.sucursalNombre = this.currentUser.sucursal_nombre;
    }
    this.buildMenuTree();
    this.subs.add(this.authService.menus$.subscribe(() => this.buildMenuTree()));
    // Cerrar drawer al navegar en móvil
    this.subs.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => { if (this.isMobile) this.closeMobile(); })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private buildMenuTree(): void {
    const menus = this.authService.getMenus().filter(m => m.puede_ver === 1);
    const roots = menus.filter(m => !m.padre_id);
    const children = menus.filter(m => !!m.padre_id);

    const prevOpenIds = new Set(
      this.menuTree.filter((n: any) => n._open).map((n: any) => n.id)
    );

    this.menuTree = roots.map(r => {
      const kids = children.filter(c => c.padre_id === r.id);
      const wasOpen = prevOpenIds.has(r.id);
      const isActive = kids.some(c => this.isActive(c.ruta));
      return {
        ...r,
        _open: wasOpen || isActive,
        children: kids
      };
    });
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  openMobile(): void { this.mobileOpen = true; this.mobileOpenChange.emit(true); }
  closeMobile(): void { this.mobileOpen = false; this.mobileOpenChange.emit(false); }

  toggleGroup(item: any): void {
    item._open = !item._open;
  }

  isActive(ruta: string): boolean {
    return this.router.url === ruta || this.router.url.startsWith(ruta + '/');
  }

  isGroupActive(item: any): boolean {
    return item.children?.some((c: any) => this.isActive(c.ruta));
  }

  stripSlash(ruta: string): string {
    return ruta ? ruta.replace(/^\/+/, '') : '';
  }

  getInitials(nombre: string): string {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
