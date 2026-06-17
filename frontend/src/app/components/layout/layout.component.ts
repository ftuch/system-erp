import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CajaService } from '../../services/caja.service';
import { CarritoService } from '../../services/carrito.service';
import { PlanService } from '../../services/plan.service';
import { Usuario } from '../../models';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed">
      <app-sidebar #sidebar (collapsedChange)="sidebarCollapsed = $event"></app-sidebar>
      <div class="main-wrapper">
        <header class="top-header">
          <div class="header-left">
            <button class="hamburger-btn" (click)="sidebar.openMobile()">
              <span class="material-icons">menu</span>
            </button>
            <nav class="breadcrumb" aria-label="breadcrumb">
              <span class="breadcrumb-item">Inicio</span>
              <span class="breadcrumb-sep">›</span>
              <span class="breadcrumb-item active">{{ pageTitle }}</span>
            </nav>
          </div>
          <div class="header-right">
            <a class="caja-indicator" routerLink="/caja"
               [ngClass]="hayCaja ? 'caja-open' : 'caja-closed'">
              <span class="material-icons">account_balance_wallet</span>
              <span>{{ hayCaja ? 'Caja abierta' : 'Caja Cerrada' }}</span>
            </a>
            <span class="header-user" *ngIf="currentUser">
              <span class="material-icons" style="font-size:18px; color: var(--text-secondary)">person</span>
              {{ currentUser.rol_nombre || currentUser.nombre }}
            </span>
            <button class="logout-mobile-btn" (click)="logout()" title="Cerrar sesión">
              <span class="material-icons">logout</span>
            </button>
          </div>
        </header>
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Botón flotante carrito (solo plan plus/full) -->
    <button class="carrito-fab" *ngIf="planService.canUsePedidos()"
            (click)="carritoService.toggle()" [class.has-items]="carritoService.count > 0">
      <span class="material-icons">shopping_cart</span>
      <span class="fab-badge" *ngIf="carritoService.count > 0">{{ carritoService.count }}</span>
    </button>

    <!-- Carrito drawer -->
    <app-carrito></app-carrito>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--background);
    }
    .main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      transition: margin-left var(--transition-normal);
      min-width: 0;
    }
    .app-layout.sidebar-collapsed .main-wrapper {
      margin-left: var(--sidebar-collapsed);
    }
    @media (max-width: 768px) {
      .main-wrapper { margin-left: 0 !important; }
    }
    .top-header {
      height: var(--header-height);
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-lg);
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      box-shadow: var(--shadow-sm);
    }
    .hamburger-btn {
      display: none;
      background: none; border: none; cursor: pointer;
      color: var(--text-secondary); padding: 6px;
      border-radius: var(--radius-sm);
      align-items: center; justify-content: center;
      margin-right: 4px;
    }
    .hamburger-btn:hover { background: var(--surface-hover); color: var(--text); }
    .hamburger-btn .material-icons { font-size: 22px; }
    .logout-mobile-btn {
      display: none;
      background: none; border: none; cursor: pointer;
      color: var(--text-secondary); padding: 6px;
      border-radius: var(--radius-sm);
      align-items: center; justify-content: center;
    }
    .logout-mobile-btn:hover { color: var(--error); background: var(--error-light); }
    .logout-mobile-btn .material-icons { font-size: 22px; }
    @media (max-width: 768px) {
      .hamburger-btn { display: flex; }
      .breadcrumb-item:not(.active) { display: none; }
      .breadcrumb-sep { display: none; }
      .header-user { display: none; }
      .logout-mobile-btn { display: flex; }
    }
    .breadcrumb { display: flex; align-items: center; gap: 6px; }
    .breadcrumb-item { font-size: 13px; color: var(--text-secondary); }
    .breadcrumb-item.active { font-weight: 600; color: var(--text); }
    .breadcrumb-sep { color: var(--text-disabled); font-size: 16px; }
    .header-right { display: flex; align-items: center; gap: var(--space-md); }
    .caja-indicator { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: var(--radius-full); font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all var(--transition-fast); }
    .caja-open { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .caja-closed { background: color-mix(in srgb, var(--error) 12%, transparent); color: var(--error); }
    .caja-indicator .material-icons { font-size: 16px; }
    .header-user {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }
    .page-content {
      flex: 1;
      padding: var(--space-lg);
      overflow-y: auto;
    }
    @media (max-width: 768px) {
      .page-content { padding: var(--space-md) var(--space-sm); }
      .top-header { padding: 0 var(--space-sm); }
    }
    .carrito-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 999;
      width: 54px; height: 54px; border-radius: 50%;
      background: var(--surface); border: 2px solid var(--border);
      box-shadow: var(--shadow-lg); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); transition: all .2s;
    }
    .carrito-fab:hover { background: var(--primary); color: #fff; border-color: var(--primary); transform: scale(1.08); }
    .carrito-fab.has-items { background: var(--primary); color: #fff; border-color: var(--primary); }
    .carrito-fab .material-icons { font-size: 24px; }
    .fab-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--error); color: #fff;
      border-radius: 50%; width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; border: 2px solid var(--surface);
    }
  `]
})
export class LayoutComponent implements OnInit {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  sidebarCollapsed = false;
  currentUser: Usuario | null = null;
  pageTitle = 'Dashboard';
  hayCaja = false;

  constructor(
    private authService: AuthService,
    private cajaService: CajaService,
    public carritoService: CarritoService,
    public planService: PlanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.cajaService.verificarCajaActiva().subscribe();
    this.cajaService.caja$.subscribe(c => { this.hayCaja = c !== null; });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const segments = e.urlAfterRedirects.split('/').filter(Boolean);
      this.pageTitle = segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : 'Dashboard';
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
