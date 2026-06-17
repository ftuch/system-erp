import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Producto, Categoria, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  constructor(private api: ApiService) {}

  getAll(params?: any): Observable<ApiResponse<Producto[]>> {
    return this.api.get<Producto[]>('/productos', params);
  }

  getById(id: number): Observable<ApiResponse<Producto>> {
    return this.api.get<Producto>(`/productos/${id}`);
  }

  create(data: Partial<Producto>): Observable<ApiResponse<any>> {
    return this.api.post('/productos', data);
  }

  update(id: number, data: Partial<Producto>): Observable<ApiResponse<any>> {
    return this.api.put(`/productos/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.api.delete(`/productos/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<Categoria[]>> {
    return this.api.get<Categoria[]>('/categorias');
  }

  getById(id: number): Observable<ApiResponse<Categoria>> {
    return this.api.get<Categoria>(`/categorias/${id}`);
  }

  create(data: Partial<Categoria>): Observable<ApiResponse<any>> {
    return this.api.post('/categorias', data);
  }

  update(id: number, data: Partial<Categoria>): Observable<ApiResponse<any>> {
    return this.api.put(`/categorias/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.api.delete(`/categorias/${id}`);
  }
}
