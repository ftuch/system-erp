import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { APP_VERSION, BUILD_DATE } from '../../../environments/version';

@Component({
  selector: 'app-login',
  template: `
<div class="login-root">

  <!-- Panel izquierdo: branding -->
  <div class="login-brand">
    <div class="brand-content">
      <div class="brand-icon">
        <span class="material-icons">point_of_sale</span>
      </div>
      <h1 class="brand-title">Punto de Venta</h1>
      <p class="brand-sub">Sistema integral de gestión comercial</p>

      <div class="brand-features">
        <div class="feat-item">
          <span class="material-icons">inventory_2</span>
          <span>Control de inventario en tiempo real</span>
        </div>
        <div class="feat-item">
          <span class="material-icons">receipt_long</span>
          <span>Ventas y pedidos integrados</span>
        </div>
        <div class="feat-item">
          <span class="material-icons">bar_chart</span>
          <span>Dashboard con métricas del día</span>
        </div>
        <div class="feat-item">
          <span class="material-icons">manage_accounts</span>
          <span>Gestión de usuarios y roles</span>
        </div>
      </div>
    </div>
    <div class="brand-footer">
      <span>© 2026 Sistema ERP · Todos los derechos reservados</span>
    </div>
  </div>

  <!-- Panel derecho: formulario -->
  <div class="login-form-panel">
    <div class="login-card">

      <!-- Header -->
      <div class="lc-header">
        <div class="lc-logo">
          <span class="material-icons">storefront</span>
        </div>
        <h2 class="lc-title">Bienvenido</h2>
        <p class="lc-sub">Ingresa tus credenciales para continuar</p>
      </div>

      <!-- Error banner -->
      <div class="error-banner" *ngIf="errorMsg">
        <span class="material-icons">error_outline</span>
        <span>{{ errorMsg }}</span>
        <button class="eb-close" (click)="errorMsg = ''">
          <span class="material-icons">close</span>
        </button>
      </div>

      <!-- Formulario -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" autocomplete="off">

        <div class="field-group">
          <label class="field-label">Usuario</label>
          <div class="field-wrap" [class.focused]="userFocused" [class.has-error]="submitted && f['usuario'].errors">
            <span class="field-icon material-icons">person_outline</span>
            <input
              type="text"
              class="field-input"
              formControlName="usuario"
              placeholder="Nombre de usuario"
              autocomplete="username"
              (focus)="userFocused = true"
              (blur)="userFocused = false" />
          </div>
          <span class="field-error" *ngIf="submitted && f['usuario'].errors?.['required']">
            El usuario es requerido
          </span>
        </div>

        <div class="field-group">
          <label class="field-label">Contraseña</label>
          <div class="field-wrap" [class.focused]="passFocused" [class.has-error]="submitted && f['password'].errors">
            <span class="field-icon material-icons">lock_outline</span>
            <input
              [type]="showPass ? 'text' : 'password'"
              class="field-input"
              formControlName="password"
              placeholder="Contraseña"
              autocomplete="current-password"
              (focus)="passFocused = true"
              (blur)="passFocused = false" />
            <button type="button" class="pass-toggle" (click)="showPass = !showPass" tabindex="-1">
              <span class="material-icons">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <span class="field-error" *ngIf="submitted && f['password'].errors?.['required']">
            La contraseña es requerida
          </span>
        </div>

        <button type="submit" class="btn-login" [disabled]="loading">
          <span class="material-icons spin" *ngIf="loading">refresh</span>
          <span class="material-icons" *ngIf="!loading">login</span>
          {{ loading ? 'Verificando...' : 'Iniciar Sesión' }}
        </button>

      </form>

      <div class="lc-footer">
        <span class="material-icons">shield</span>
        Conexión segura
      </div>
      <div class="lc-version">v{{ version }} · {{ buildDate }}</div>
    </div>
  </div>

</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .login-root {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Panel izquierdo ── */
    .login-brand {
      flex: 1;
      background: linear-gradient(145deg, #2e4f7c 0%, #4a6fa5 50%, #6c8ebf 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px 48px 32px;
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .login-brand::before {
      content: '';
      position: absolute;
      top: -80px; right: -80px;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }
    .login-brand::after {
      content: '';
      position: absolute;
      bottom: -60px; left: -60px;
      width: 250px; height: 250px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .brand-content { position: relative; z-index: 1; }
    .brand-icon {
      width: 72px; height: 72px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .brand-icon .material-icons { font-size: 36px; color: #fff; }
    .brand-title { font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px; }
    .brand-sub { font-size: 15px; opacity: .75; margin: 0 0 40px; }

    .brand-features { display: flex; flex-direction: column; gap: 16px; }
    .feat-item {
      display: flex; align-items: center; gap: 12px;
      font-size: 14px; opacity: .85;
    }
    .feat-item .material-icons {
      font-size: 18px;
      background: rgba(255,255,255,0.15);
      padding: 6px; border-radius: 8px;
      flex-shrink: 0;
    }

    .brand-footer {
      position: relative; z-index: 1;
      font-size: 12px; opacity: .5;
    }

    /* ── Panel derecho ── */
    .login-form-panel {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background);
      padding: 32px;
    }

    .login-card {
      width: 100%;
      max-width: 380px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xl);
      padding: 40px 36px;
    }

    /* Header card */
    .lc-header { text-align: center; margin-bottom: 28px; }
    .lc-logo {
      width: 56px; height: 56px;
      background: color-mix(in srgb, var(--primary) 12%, transparent);
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
    }
    .lc-logo .material-icons { font-size: 28px; color: var(--primary); }
    .lc-title { font-size: 22px; font-weight: 800; color: var(--text); margin: 0 0 6px; }
    .lc-sub { font-size: 13px; color: var(--text-secondary); margin: 0; }

    /* Error banner */
    .error-banner {
      display: flex; align-items: center; gap: 10px;
      background: var(--error-light);
      border: 1px solid color-mix(in srgb, var(--error) 25%, transparent);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 13px; color: var(--error);
    }
    .error-banner .material-icons { font-size: 18px; flex-shrink: 0; }
    .eb-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: var(--error); display: flex; align-items: center; padding: 0;
    }
    .eb-close .material-icons { font-size: 16px; }

    /* Campos */
    .field-group { margin-bottom: 20px; }
    .field-label {
      display: block; font-size: 13px; font-weight: 600;
      color: var(--text-secondary); margin-bottom: 6px;
    }
    .field-wrap {
      display: flex; align-items: center;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      overflow: hidden;
    }
    .field-wrap.focused {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
    }
    .field-wrap.has-error { border-color: var(--error); }
    .field-icon {
      padding: 0 12px; font-size: 18px;
      color: var(--text-disabled);
      flex-shrink: 0;
    }
    .field-wrap.focused .field-icon { color: var(--primary); }
    .field-input {
      flex: 1; border: none; outline: none;
      padding: 12px 8px 12px 0;
      font-size: 14px; color: var(--text);
      background: transparent;
    }
    .field-input::placeholder { color: var(--text-disabled); }
    .pass-toggle {
      background: none; border: none; cursor: pointer;
      padding: 0 12px; color: var(--text-disabled);
      display: flex; align-items: center;
    }
    .pass-toggle:hover { color: var(--primary); }
    .pass-toggle .material-icons { font-size: 18px; }
    .field-error { font-size: 12px; color: var(--error); margin-top: 4px; display: block; }

    /* Botón login */
    .btn-login {
      width: 100%; padding: 14px;
      background: var(--primary); color: #fff;
      border: none; border-radius: var(--radius-md);
      font-size: 15px; font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all var(--transition-fast);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent);
      margin-top: 8px;
    }
    .btn-login:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 35%, transparent);
    }
    .btn-login:disabled { opacity: .6; cursor: not-allowed; transform: none; }
    .btn-login .material-icons { font-size: 18px; }

    /* Footer card */
    .lc-footer {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; margin-top: 24px;
      font-size: 12px; color: var(--text-disabled);
    }
    .lc-footer .material-icons { font-size: 14px; color: var(--success); }
    .lc-version { text-align: center; margin-top: 8px; font-size: 11px; color: var(--text-disabled); opacity: .6; }

    /* Animación spinner */
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive: en pantallas pequeñas ocultar el branding */
    @media (max-width: 768px) {
      .login-brand { display: none; }
      .login-form-panel { width: 100%; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  showPass = false;
  errorMsg = '';
  userFocused = false;
  passFocused = false;
  version = APP_VERSION;
  buildDate = BUILD_DATE;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMsg = '';
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMsg = error.error?.error || 'Usuario o contraseña incorrectos';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
