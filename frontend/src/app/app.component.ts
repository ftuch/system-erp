import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Inicializar tema guardado
    this.themeService.getCurrentTheme();
  }
}
