import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Venta, ApiResponse, Persona, Caja } from '../models';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  constructor(private api: ApiService) {}

  getAll(params?: any): Observable<ApiResponse<Venta[]>> {
    return this.api.get<Venta[]>('/ventas', params);
  }

  getById(id: number): Observable<ApiResponse<Venta>> {
    return this.api.get<Venta>(`/ventas/${id}`);
  }

  create(data: any): Observable<ApiResponse<any>> {
    return this.api.post('/ventas', data);
  }

  anular(id: number, motivo: string): Observable<ApiResponse<any>> {
    return this.api.post(`/ventas/${id}/anular`, { motivo });
  }
}

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  constructor(private api: ApiService) {}

  getAll(params?: any): Observable<ApiResponse<Persona[]>> {
    return this.api.get<Persona[]>('/personas', params);
  }

  getById(id: number): Observable<ApiResponse<Persona>> {
    return this.api.get<Persona>(`/personas/${id}`);
  }

  create(data: Partial<Persona>): Observable<ApiResponse<any>> {
    return this.api.post('/personas', data);
  }

  update(id: number, data: Partial<Persona>): Observable<ApiResponse<any>> {
    return this.api.put(`/personas/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.api.delete(`/personas/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  constructor(private api: ApiService) {}

  getAll(params?: any): Observable<ApiResponse<Caja[]>> {
    return this.api.get<Caja[]>('/cajas', params);
  }

  getById(id: number): Observable<ApiResponse<Caja>> {
    return this.api.get<Caja>(`/cajas/${id}`);
  }

  abrir(data: any): Observable<ApiResponse<any>> {
    return this.api.post('/cajas/abrir', data);
  }

  cerrar(id: number, monto_cierre: number): Observable<ApiResponse<any>> {
    return this.api.post(`/cajas/${id}/cerrar`, { monto_cierre });
  }

  movimiento(data: any): Observable<ApiResponse<any>> {
    return this.api.post('/cajas/movimiento', data);
  }

  arqueo(data: any): Observable<ApiResponse<any>> {
    return this.api.post('/cajas/arqueo', data);
  }
}
