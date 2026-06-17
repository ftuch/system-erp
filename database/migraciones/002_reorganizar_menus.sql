-- =====================================================
-- Migración 002: Reorganizar menú - Sucursales, Usuarios
-- y Roles pasan a ser hijos de Configuración (id=37)
-- =====================================================

-- Sucursales → hijo de Configuración, orden 1
UPDATE tc_menus SET padre_id = 37, orden = 1 WHERE id = 31;

-- Usuarios → hijo de Configuración, orden 2
UPDATE tc_menus SET padre_id = 37, orden = 2 WHERE id = 38;

-- Roles → hijo de Configuración, orden 3
UPDATE tc_menus SET padre_id = 37, orden = 3 WHERE id = 39;

-- Flujo de Pedidos → hijo de Configuración, orden 4
UPDATE tc_menus SET padre_id = 37, orden = 4 WHERE id = 50;

-- Reordenar items raíz
UPDATE tc_menus SET orden = 1 WHERE id = 1;   -- Dashboard
UPDATE tc_menus SET orden = 2 WHERE id = 52;  -- Ventas
UPDATE tc_menus SET orden = 3 WHERE id = 46;  -- Caja
UPDATE tc_menus SET orden = 4 WHERE id = 49;  -- Pedidos
UPDATE tc_menus SET orden = 5 WHERE id = 42;  -- Clientes
UPDATE tc_menus SET orden = 6 WHERE id = 43;  -- Proveedores
UPDATE tc_menus SET orden = 7 WHERE id = 6;   -- Inventario
UPDATE tc_menus SET orden = 8 WHERE id = 37;  -- Configuración
