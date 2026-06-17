import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CarritoItem {
  producto_id: number;
  nombre: string;
  tipo: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  stock_actual: number;
  stock_maximo: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private itemsSubject = new BehaviorSubject<CarritoItem[]>([]);
  private openSubject  = new BehaviorSubject<boolean>(false);

  items$  = this.itemsSubject.asObservable();
  open$   = this.openSubject.asObservable();

  get items(): CarritoItem[]  { return this.itemsSubject.value; }
  get isOpen(): boolean       { return this.openSubject.value; }
  get count(): number         { return this.items.reduce((s, i) => s + i.cantidad, 0); }
  get total(): number         { return this.items.reduce((s, i) => s + i.subtotal, 0); }

  agregar(p: {
    id: number; nombre: string; tipo: string; unidad: string;
    costo: number; stock_total: number; stock_maximo: number;
  }): void {
    const items = [...this.items];
    const idx = items.findIndex(i => i.producto_id === p.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], cantidad: items[idx].cantidad + 1 };
      items[idx].subtotal = items[idx].cantidad * items[idx].precio_unitario;
    } else {
      items.push({
        producto_id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        unidad: p.unidad,
        cantidad: 1,
        precio_unitario: p.costo || 0,
        subtotal: p.costo || 0,
        stock_actual: p.stock_total,
        stock_maximo: p.stock_maximo
      });
    }
    this.itemsSubject.next(items);
    this.openSubject.next(true);
  }

  setCantidad(idx: number, cantidad: number): void {
    if (cantidad < 1) { this.quitar(idx); return; }
    const items = [...this.items];
    items[idx] = { ...items[idx], cantidad, subtotal: cantidad * items[idx].precio_unitario };
    this.itemsSubject.next(items);
  }

  setPrecio(idx: number, precio: number): void {
    const items = [...this.items];
    items[idx] = { ...items[idx], precio_unitario: precio, subtotal: items[idx].cantidad * precio };
    this.itemsSubject.next(items);
  }

  quitar(idx: number): void {
    const items = [...this.items];
    items.splice(idx, 1);
    this.itemsSubject.next(items);
  }

  vaciar(): void { this.itemsSubject.next([]); }

  toggle(): void { this.openSubject.next(!this.openSubject.value); }
  abrir():  void { this.openSubject.next(true); }
  cerrar(): void { this.openSubject.next(false); }
}
