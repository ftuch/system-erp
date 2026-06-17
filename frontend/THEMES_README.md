# 🎨 Sistema de Themes Profesional ERP

## Descripción

Sistema de skins/themes implementado con CSS Custom Properties y ThemeService para Angular.

## Los 3 Themes Disponibles

| Theme | ID | Descripción | Uso Recomendado |
|-------|-----|-------------|-----------------|
| **Corporativo** | `corporate` | Azul profesional y moderno | Empresas, corporaciones |
| **Elegante Oscuro** | `elegant` | Oscuro con acentos púrpura | Entornos sofisticados, noches |
| **Minimalista Claro** | `minimal` | Blanco limpio y moderno | Startups, diseño limpio |

## Uso en Componentes

### 1. Variables CSS (SIEMPRE usar estas)

```scss
.mi-componente {
  // Colores
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
  
  // Espaciado
  padding: var(--space-md);
  margin: var(--space-lg);
  
  // Bordes
  border-radius: var(--radius-md);
  
  // Sombras
  box-shadow: var(--shadow-sm);
}
```

### 2. Mixins (Para componentes complejos)

```scss
@import 'styles/mixins';

.mi-card {
  @include card();
}

.mi-boton {
  @include btn-primary();
}

.mi-tabla {
  @include table();
}
```

### 3. Cambiar Theme Programáticamente

```typescript
import { ThemeService } from './services/theme.service';

constructor(private themeService: ThemeService) {}

// Cambiar tema
themeService.setTheme('elegant');

// Obtener tema actual
const currentTheme = themeService.getCurrentTheme();
```

## Variables Disponibles

### Colores
- `--primary`, `--primary-light`, `--primary-dark`
- `--secondary`, `--accent`
- `--background`, `--surface`
- `--text`, `--text-secondary`, `--text-disabled`
- `--border`, `--divider`
- `--success`, `--warning`, `--error`, `--info`

### Espaciado
- `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px)
- `--space-lg` (24px), `--space-xl` (32px), `--space-2xl` (48px)

### Bordes
- `--radius-sm` (4px), `--radius-md` (8px)
- `--radius-lg` (12px), `--radius-xl` (16px)

### Sombras
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

### Layout
- `--sidebar-width` (260px), `--header-height` (64px)
- `--max-content-width` (1400px)

## Clases CSS Globales

### Layout
- `.container` - Contenedor centrado max-width
- `.content-wrapper` - Wrapper para contenido principal
- `.grid`, `.grid-2`, `.grid-3`, `.grid-4` - Sistema de grid
- `.flex`, `.flex-between` - Flexbox utilidades

### Componentes
- `.card` - Tarjeta estándar
- `.btn`, `.btn-primary`, `.btn-secondary` - Botones
- `.badge` - Insignias de estado
- `.alert` - Mensajes de alerta

### Espaciado
- `.mt-1` a `.mt-5` - Margin top
- `.mb-1` a `.mb-5` - Margin bottom
- `.p-1` a `.p-5` - Padding

### Texto
- `.text-center`, `.text-right`, `.text-left`
- `.text-sm`, `.text-md`, `.text-lg`, `.text-xl`
- `.font-medium`, `.font-semibold`, `.font-bold`

## Reglas IMPORTANTES

1. **NUNCA usar colores hardcodeados** - Siempre usar `var(--nombre)`
2. **NUNCA usar px fijos para espaciado** - Usar `var(--space-*)`
3. **SIEMPRE usar los mixins** para componentes comunes
4. **El tema se guarda automáticamente** en localStorage

## Ejemplo Completo

```typescript
// componente.ts
@Component({
  template: `
    <div class="page-header">
      <h2>Mi Módulo</h2>
      <div class="page-actions">
        <button class="btn btn-secondary">Cancelar</button>
        <button class="btn">Guardar</button>
      </div>
    </div>
    
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">
          <h3>Datos</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" placeholder="Ingrese nombre">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--space-lg);
    }
  `]
})
```

## Selector de Tema UI

El componente `app-theme-selector` está disponible en todas las páginas. Aparece como un botón flotante en la esquina inferior derecha.

Para agregarlo a una nueva página:
```html
<app-theme-selector></app-theme-selector>
```

## Persistencia

El tema seleccionado se guarda automáticamente en `localStorage` con la clave `erp_theme` y se aplica al recargar la página.

---

**NO MODIFICAR** los archivos en `src/styles/` sin consultar al equipo de diseño.

**Los 3 themes están definidos en:** `src/app/services/theme.service.ts`
