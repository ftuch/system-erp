import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'warm-white',
    name: 'Blanco Cálido',
    description: 'Minimalista, suave para uso prolongado',
    preview: 'linear-gradient(135deg, #f5f4f0, #4a6fa5)',
    colors: {
      primary: '#4a6fa5',
      primaryLight: '#7b9cc8',
      primaryDark: '#2e4f7c',
      secondary: '#8a9bb0',
      accent: '#6c8ebf',
      background: '#f5f4f0',
      surface: '#fafaf8',
      text: '#2c2c2c',
      textSecondary: '#6b7280',
      border: '#e2e0d8',
      success: '#5a9a6f',
      warning: '#c48c3a',
      error: '#b85c5c',
      info: '#4a7fa8'
    }
  },
  {
    id: 'clean-white',
    name: 'Blanco Puro',
    description: 'Limpio, alto contraste, muy nítido',
    preview: 'linear-gradient(135deg, #ffffff, #1976d2)',
    colors: {
      primary: '#1976d2',
      primaryLight: '#42a5f5',
      primaryDark: '#1565c0',
      secondary: '#757575',
      accent: '#0288d1',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#616161',
      border: '#e0e0e0',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    }
  },
  {
    id: 'sage',
    name: 'Verde Salvia',
    description: 'Tonos verdes suaves, relajante',
    preview: 'linear-gradient(135deg, #f0f4f0, #4a7c59)',
    colors: {
      primary: '#4a7c59',
      primaryLight: '#72a882',
      primaryDark: '#2d5c3a',
      secondary: '#8fa898',
      accent: '#6b9e7e',
      background: '#f2f5f2',
      surface: '#f8faf8',
      text: '#2a2e2a',
      textSecondary: '#637063',
      border: '#dce5dc',
      success: '#5a9a6f',
      warning: '#c48c3a',
      error: '#b85c5c',
      info: '#4a7fa8'
    }
  },
  {
    id: 'slate',
    name: 'Pizarra Oscuro',
    description: 'Oscuro suave, ideal para la noche',
    preview: 'linear-gradient(135deg, #1e2530, #4a6fa5)',
    colors: {
      primary: '#6b9ed4',
      primaryLight: '#93bbdf',
      primaryDark: '#4a7ab0',
      secondary: '#8090a4',
      accent: '#7eb8c9',
      background: '#161b22',
      surface: '#1e2530',
      text: '#e8eaed',
      textSecondary: '#9aa0ab',
      border: '#30363d',
      success: '#56a86e',
      warning: '#d4943c',
      error: '#c96060',
      info: '#58a6d4'
    }
  }
];

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<Theme>(THEMES[0]);
  public currentTheme$ = this.currentTheme.asObservable();

  private readonly STORAGE_KEY = 'erp_theme';

  constructor() {
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme) {
      const theme = THEMES.find(t => t.id === savedTheme);
      if (theme) {
        this.applyTheme(theme);
      }
    }
  }

  getThemes(): Theme[] {
    return THEMES;
  }

  setTheme(themeId: string): void {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      this.applyTheme(theme);
      localStorage.setItem(this.STORAGE_KEY, themeId);
    }
  }

  private applyTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    const root = document.documentElement;

    const varMap: Record<string, string> = {
      primary:        '--primary',
      primaryLight:   '--primary-light',
      primaryDark:    '--primary-dark',
      secondary:      '--secondary',
      accent:         '--accent',
      background:     '--background',
      surface:        '--surface',
      text:           '--text',
      textSecondary:  '--text-secondary',
      border:         '--border',
      success:        '--success',
      warning:        '--warning',
      error:          '--error',
      info:           '--info'
    };

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = varMap[key];
      if (cssVar) root.style.setProperty(cssVar, value);
    });

    document.body.className = `theme-${theme.id}`;
  }

  getCurrentTheme(): Theme {
    return this.currentTheme.value;
  }
}
