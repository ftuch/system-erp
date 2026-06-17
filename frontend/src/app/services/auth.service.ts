import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, Usuario, Menu } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private router = inject(Router);
  private tokenKey = 'erp_token';
  private userKey = 'erp_user';
  private menusKey = 'erp_menus';
  
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private menusSubject = new BehaviorSubject<Menu[]>([]);
  public menus$ = this.menusSubject.asObservable();

  private jwtHelper = new JwtHelperService();

  private httpBypass: HttpClient;

  constructor(private http: HttpClient, private httpBackend: HttpBackend) {
    this.httpBypass = new HttpClient(httpBackend);
    this.loadStoredData();
  }

  private loadStoredData(): void {
    const token = localStorage.getItem(this.tokenKey);
    const user = localStorage.getItem(this.userKey);
    const menus = localStorage.getItem(this.menusKey);

    if (token && !this.jwtHelper.isTokenExpired(token)) {
      if (user) this.currentUserSubject.next(JSON.parse(user));
      if (menus) this.menusSubject.next(JSON.parse(menus));
      this.refreshMenus();
    } else {
      this.logout();
    }
  }

  refreshMenus(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return;
    this.httpBypass.get<ApiResponse<any>>(`${this.baseUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: res => {
        if (res.success && res.data) {
          const { menus, ...userData } = res.data;
          if (userData) {
            localStorage.setItem(this.userKey, JSON.stringify(userData));
            this.currentUserSubject.next(userData);
          }
          if (menus) {
            localStorage.setItem(this.menusKey, JSON.stringify(menus));
            this.menusSubject.next(menus);
          }
        }
      }
    });
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        })
      );
  }

  private setSession(data: LoginResponse): void {
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    localStorage.setItem(this.menusKey, JSON.stringify(data.menus));
    
    this.currentUserSubject.next(data.user);
    this.menusSubject.next(data.menus);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.menusKey);
    this.currentUserSubject.next(null);
    this.menusSubject.next([]);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getMenus(): Menu[] {
    return this.menusSubject.value;
  }

  hasPermission(menuCode: string, action: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean {
    const menus = this.getMenus();
    const menu = menus.find(m => m.codigo === menuCode);
    
    if (!menu) return false;

    switch (action) {
      case 'ver': return menu.puede_ver === 1;
      case 'crear': return menu.puede_crear === 1;
      case 'editar': return menu.puede_editar === 1;
      case 'eliminar': return menu.puede_eliminar === 1;
      default: return false;
    }
  }

  changePassword(passwordData: { password_actual: string; password_nuevo: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/change-password`, passwordData);
  }

  getProfile(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.baseUrl}/auth/profile`);
  }
}
