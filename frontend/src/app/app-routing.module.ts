import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LayoutComponent } from './components/layout/layout.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { RolesComponent } from './pages/roles/roles.component';
import { SucursalesComponent } from './pages/sucursales/sucursales.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { CajaComponent } from './pages/caja/caja.component';
import { PedidosComponent } from './pages/pedidos/pedidos.component';
import { VentasComponent } from './pages/ventas/ventas.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'sucursales', component: SucursalesComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'caja', component: CajaComponent },
      { path: 'pedidos', component: PedidosComponent },
      { path: 'ventas', component: VentasComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
