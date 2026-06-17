import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredPermission = route.data['permission'] as string;
    if (requiredPermission) {
      const action = route.data['action'] as 'ver' | 'crear' | 'editar' | 'eliminar' || 'ver';
      if (!this.authService.hasPermission(requiredPermission, action)) {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
