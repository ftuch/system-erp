import { Component, OnInit, Input } from '@angular/core';
import { ThemeService, Theme, THEMES } from '../../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  template: `
    <!-- Modo inline (dentro del sidebar) -->
    <div class="ts-inline" *ngIf="inline">
      <button class="ts-trigger" (click)="open = !open">
        <span class="material-icons">palette</span>
        <span class="ts-trigger-label" *ngIf="showLabel">Tema: {{ currentTheme?.name }}</span>
        <span class="material-icons ts-chevron" *ngIf="showLabel">{{ open ? 'expand_less' : 'expand_more' }}</span>
      </button>
      <div class="ts-swatches" *ngIf="open">
        <button
          *ngFor="let t of themes"
          class="ts-swatch"
          [class.active]="currentTheme?.id === t.id"
          [style.background]="t.preview"
          [title]="t.name + ' — ' + t.description"
          (click)="select(t.id)">
          <span class="material-icons ts-check" *ngIf="currentTheme?.id === t.id">check</span>
        </button>
      </div>
    </div>

    <!-- Modo flotante (legacy) -->
    <div class="ts-float" *ngIf="!inline">
      <button class="ts-fab" (click)="open = !open" title="Cambiar tema">
        <span class="material-icons">palette</span>
      </button>
      <div class="ts-dropdown" *ngIf="open">
        <p class="ts-dropdown-title">Seleccionar Tema</p>
        <div class="ts-list">
          <button
            *ngFor="let t of themes"
            class="ts-item"
            [class.active]="currentTheme?.id === t.id"
            (click)="select(t.id)">
            <span class="ts-preview" [style.background]="t.preview"></span>
            <span class="ts-info">
              <span class="ts-name">{{ t.name }}</span>
              <span class="ts-desc">{{ t.description }}</span>
            </span>
            <span class="material-icons ts-check-sm" *ngIf="currentTheme?.id === t.id">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== MODO INLINE (sidebar) ===== */
    .ts-inline { width: 100%; }

    .ts-trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      transition: background var(--transition-fast), color var(--transition-fast);
    }
    .ts-trigger:hover { background: var(--surface-hover); color: var(--text); }
    .ts-trigger .material-icons { font-size: 20px; flex-shrink: 0; }
    .ts-trigger-label { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ts-chevron { font-size: 18px; color: var(--text-disabled); }

    .ts-swatches {
      display: flex;
      gap: 8px;
      padding: 8px 16px 12px 48px;
      flex-wrap: wrap;
    }
    .ts-swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--transition-fast), border-color var(--transition-fast);
      padding: 0;
    }
    .ts-swatch:hover { transform: scale(1.2); }
    .ts-swatch.active { border-color: var(--text); }
    .ts-swatch .ts-check { font-size: 14px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

    /* ===== MODO FLOTANTE ===== */
    .ts-float {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: var(--z-fixed);
    }
    .ts-fab {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .ts-fab:hover { transform: scale(1.1); box-shadow: var(--shadow-xl); }

    .ts-dropdown {
      position: absolute;
      bottom: calc(100% + 10px);
      right: 0;
      width: 280px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      animation: tsIn 0.15s ease;
    }
    .ts-dropdown-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-secondary);
      padding: 12px 16px 6px;
      margin: 0;
    }
    .ts-list { display: flex; flex-direction: column; padding-bottom: 8px; }
    .ts-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background var(--transition-fast);
    }
    .ts-item:hover { background: var(--surface-hover); }
    .ts-item.active { background: var(--surface-active); }
    .ts-preview {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }
    .ts-info { display: flex; flex-direction: column; flex: 1; gap: 2px; overflow: hidden; }
    .ts-name { font-size: 13px; font-weight: 600; color: var(--text); }
    .ts-desc { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ts-check-sm { font-size: 18px; color: var(--primary); flex-shrink: 0; }

    @keyframes tsIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ThemeSelectorComponent implements OnInit {
  @Input() inline = false;
  @Input() showLabel = true;

  themes: Theme[] = THEMES;
  currentTheme: Theme | null = null;
  open = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(t => this.currentTheme = t);
  }

  select(themeId: string): void {
    this.themeService.setTheme(themeId);
    if (!this.inline) this.open = false;
  }
}
