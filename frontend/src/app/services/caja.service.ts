import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface CajaActiva {
  id: number;
  nombre: string;
  sucursal_id: number;
  sucursal_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  monto_inicial: number;
  estado: string;
  fecha_apertura: string;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private cajaSubject = new BehaviorSubject<CajaActiva | null>(null);
  caja$ = this.cajaSubject.asObservable();

  constructor(private api: ApiService) {}

  get cajaActiva(): CajaActiva | null {
    return this.cajaSubject.value;
  }

  get hayCajaAbierta(): boolean {
    return this.cajaSubject.value !== null;
  }

  verificarCajaActiva(): Observable<any> {
    return this.api.get<CajaActiva>('/cajas/activa').pipe(
      tap(r => {
        this.cajaSubject.next(r.data || null);
      })
    );
  }

  setCaja(caja: CajaActiva | null): void {
    this.cajaSubject.next(caja);
  }
}
