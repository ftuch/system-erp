import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, ApiResponse, Rol, Menu } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  constructor(private api: ApiService) {}

  getAll(params?: any): Observable<ApiResponse<Usuario[]>> {
    return this.api.get<Usuario[]>('/usuarios', params);
  }

  getById(id: number): Observable<ApiResponse<Usuario>> {
    return this.api.get<Usuario>(`/usuarios/${id}`);
  }

  create(data: Partial<Usuario>): Observable<ApiResponse<any>> {
    return this.api.post('/usuarios', data);
  }

  update(id: number, data: Partial<Usuario>): Observable<ApiResponse<any>> {
    return this.api.put(`/usuarios/${id}`, data);
  }

  updatePassword(id: number, password: string): Observable<ApiResponse<any>> {
    return this.api.put(`/usuarios/${id}/password`, { password });
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.api.delete(`/usuarios/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class RolService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<Rol[]>> {
    return this.api.get<Rol[]>('/roles');
  }

  getSimple(): Observable<ApiResponse<Rol[]>> {
    return this.api.get<Rol[]>('/roles/simple');
  }

  getById(id: number): Observable<ApiResponse<Rol>> {
    return this.api.get<Rol>(`/roles/${id}`);
  }

  create(data: any): Observable<ApiResponse<any>> {
    return this.api.post('/roles', data);
  }

  update(id: number, data: any): Observable<ApiResponse<any>> {
    return this.api.put(`/roles/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.api.delete(`/roles/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<Menu[]>> {
    return this.api.get<Menu[]>('/menus');
  }
}
