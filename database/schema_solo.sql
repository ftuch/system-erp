-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: system_erp
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tc_categorias`
--

DROP TABLE IF EXISTS `tc_categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tc_categorias` (
  `categorias_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`categorias_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tc_menus`
--

DROP TABLE IF EXISTS `tc_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tc_menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `icono` varchar(50) DEFAULT NULL,
  `ruta` varchar(150) DEFAULT NULL,
  `orden` int DEFAULT NULL,
  `padre_id` int DEFAULT NULL,
  `estado` tinyint DEFAULT '1',
  `codigo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `padre_id` (`padre_id`),
  CONSTRAINT `tc_menus_ibfk_1` FOREIGN KEY (`padre_id`) REFERENCES `tc_menus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tc_pedidos_config`
--

DROP TABLE IF EXISTS `tc_pedidos_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tc_pedidos_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requiere_revision` tinyint DEFAULT '1',
  `requiere_despacho` tinyint DEFAULT '1',
  `descuenta_inventario` tinyint DEFAULT '0',
  `descuenta_en` enum('aprobacion','despacho') DEFAULT 'despacho',
  `rol_revisor_id` int DEFAULT NULL,
  `rol_despachador_id` int DEFAULT NULL,
  `permite_despacho_parcial` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tc_series_documentos`
--

DROP TABLE IF EXISTS `tc_series_documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tc_series_documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `tipo_documento` enum('FACT','FCAM','FPEQ','NCRE','NDEB') NOT NULL,
  `serie` varchar(20) NOT NULL,
  `correlativo_actual` bigint DEFAULT '0',
  `sucursal_id` int DEFAULT NULL,
  `estado` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sucursal_id` (`sucursal_id`),
  CONSTRAINT `tc_series_documentos_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tc_sucursales`
--

DROP TABLE IF EXISTS `tc_sucursales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tc_sucursales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ts_permisos`
--

DROP TABLE IF EXISTS `ts_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ts_permisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rol_id` int DEFAULT NULL,
  `menu_id` int DEFAULT NULL,
  `puede_ver` tinyint DEFAULT '1',
  `puede_crear` tinyint DEFAULT '0',
  `puede_editar` tinyint DEFAULT '0',
  `puede_eliminar` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `rol_id` (`rol_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `ts_permisos_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `ts_roles` (`id`),
  CONSTRAINT `ts_permisos_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `tc_menus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ts_roles`
--

DROP TABLE IF EXISTS `ts_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ts_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_arqueos_caja`
--

DROP TABLE IF EXISTS `tt_arqueos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_arqueos_caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caja_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `monto_sistema` decimal(10,2) DEFAULT NULL,
  `monto_fisico` decimal(10,2) DEFAULT NULL,
  `diferencia` decimal(10,2) DEFAULT NULL,
  `observaciones` text,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `caja_id` (`caja_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tt_arqueos_caja_ibfk_1` FOREIGN KEY (`caja_id`) REFERENCES `tt_cajas` (`id`),
  CONSTRAINT `tt_arqueos_caja_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_bodegas`
--

DROP TABLE IF EXISTS `tt_bodegas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_bodegas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sucursal_id` int DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sucursal_id` (`sucursal_id`),
  CONSTRAINT `tt_bodegas_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_cajas`
--

DROP TABLE IF EXISTS `tt_cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_cajas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sucursal_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `estado` enum('abierta','cerrada') DEFAULT 'abierta',
  `monto_inicial` decimal(10,2) DEFAULT NULL,
  `monto_cierre` decimal(10,2) DEFAULT NULL,
  `fecha_apertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sucursal_id` (`sucursal_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tt_cajas_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`),
  CONSTRAINT `tt_cajas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_compra_detalle`
--

DROP TABLE IF EXISTS `tt_compra_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_compra_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `costo` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `tt_compra_detalle_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `tt_compras` (`id`),
  CONSTRAINT `tt_compra_detalle_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `tt_productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_compras`
--

DROP TABLE IF EXISTS `tt_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_compras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proveedor_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `sucursal_id` int NOT NULL,
  `total` decimal(10,2) DEFAULT '0.00',
  `estado` enum('pendiente','recibida','anulada') DEFAULT 'pendiente',
  `observaciones` text,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `proveedor_id` (`proveedor_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `sucursal_id` (`sucursal_id`),
  CONSTRAINT `tt_compras_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `tt_proveedores` (`id`),
  CONSTRAINT `tt_compras_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`),
  CONSTRAINT `tt_compras_ibfk_3` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_consultas`
--

DROP TABLE IF EXISTS `tt_consultas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_consultas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `persona_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL,
  `diagnostico` text,
  `tratamiento` text,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `persona_id` (`persona_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `sucursal_id` (`sucursal_id`),
  CONSTRAINT `tt_consultas_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `tt_personas` (`id`),
  CONSTRAINT `tt_consultas_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `tt_usuarios` (`id`),
  CONSTRAINT `tt_consultas_ibfk_3` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_documentos_fiscales`
--

DROP TABLE IF EXISTS `tt_documentos_fiscales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_documentos_fiscales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `serie_id` int NOT NULL,
  `tipo_documento` enum('FACT','FCAM','FPEQ','NCRE','NDEB') NOT NULL,
  `serie` varchar(20) DEFAULT NULL,
  `numero` bigint DEFAULT NULL,
  `uuid_fel` varchar(255) DEFAULT NULL,
  `numero_autorizacion` varchar(255) DEFAULT NULL,
  `xml_generado` longtext,
  `xml_respuesta` longtext,
  `pdf_path` varchar(255) DEFAULT NULL,
  `estado` enum('pendiente','certificado','anulado','error') DEFAULT 'pendiente',
  `fecha_certificacion` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `serie_id` (`serie_id`),
  CONSTRAINT `tt_documentos_fiscales_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `tt_ventas` (`id`),
  CONSTRAINT `tt_documentos_fiscales_ibfk_2` FOREIGN KEY (`serie_id`) REFERENCES `tc_series_documentos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_existencias`
--

DROP TABLE IF EXISTS `tt_existencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_existencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int DEFAULT NULL,
  `bodega_id` int DEFAULT NULL,
  `stock_actual` int DEFAULT '0',
  `stock_minimo` int DEFAULT '0',
  `stock_maximo` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `producto_id` (`producto_id`,`bodega_id`),
  KEY `bodega_id` (`bodega_id`),
  CONSTRAINT `tt_existencias_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `tt_productos` (`id`),
  CONSTRAINT `tt_existencias_ibfk_2` FOREIGN KEY (`bodega_id`) REFERENCES `tt_bodegas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_movimientos_caja`
--

DROP TABLE IF EXISTS `tt_movimientos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_movimientos_caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caja_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `categoria` enum('venta','retiro','gasto','deposito','ajuste') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `caja_id` (`caja_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tt_movimientos_caja_ibfk_1` FOREIGN KEY (`caja_id`) REFERENCES `tt_cajas` (`id`),
  CONSTRAINT `tt_movimientos_caja_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_movimientos_inventario`
--

DROP TABLE IF EXISTS `tt_movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_movimientos_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int DEFAULT NULL,
  `bodega_id` int DEFAULT NULL,
  `tipo` enum('entrada','salida','ajuste','traslado') DEFAULT NULL,
  `cantidad` int DEFAULT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `producto_id` (`producto_id`),
  KEY `bodega_id` (`bodega_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tt_movimientos_inventario_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `tt_productos` (`id`),
  CONSTRAINT `tt_movimientos_inventario_ibfk_2` FOREIGN KEY (`bodega_id`) REFERENCES `tt_bodegas` (`id`),
  CONSTRAINT `tt_movimientos_inventario_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_pagos`
--

DROP TABLE IF EXISTS `tt_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `metodo` enum('efectivo','tarjeta','transferencia') DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  CONSTRAINT `tt_pagos_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `tt_ventas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_pedido_detalle`
--

DROP TABLE IF EXISTS `tt_pedido_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_pedido_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `cantidad` int NOT NULL,
  `cantidad_recibida` decimal(10,2) DEFAULT NULL,
  `bonificacion` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_unitario` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `tt_pedido_detalle_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `tt_pedidos` (`id`),
  CONSTRAINT `tt_pedido_detalle_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `tt_productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_pedidos`
--

DROP TABLE IF EXISTS `tt_pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) DEFAULT NULL,
  `sucursal_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `revisor_id` int DEFAULT NULL,
  `despachador_id` int DEFAULT NULL,
  `estado` enum('pendiente','aprobado','rechazado','recibido','recibido_parcial','cancelado') DEFAULT 'pendiente',
  `observaciones` text,
  `observaciones_recepcion` text,
  `comentario_revision` varchar(255) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT '0.00',
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` timestamp NULL DEFAULT NULL,
  `fecha_despacho` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sucursal_id` (`sucursal_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `revisor_id` (`revisor_id`),
  KEY `despachador_id` (`despachador_id`),
  CONSTRAINT `tt_pedidos_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`),
  CONSTRAINT `tt_pedidos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`),
  CONSTRAINT `tt_pedidos_ibfk_3` FOREIGN KEY (`revisor_id`) REFERENCES `tt_usuarios` (`id`),
  CONSTRAINT `tt_pedidos_ibfk_4` FOREIGN KEY (`despachador_id`) REFERENCES `tt_usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_personas`
--

DROP TABLE IF EXISTS `tt_personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_personas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) DEFAULT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `tipo` enum('cliente','paciente','ambos') DEFAULT 'cliente',
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_productos`
--

DROP TABLE IF EXISTS `tt_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) DEFAULT NULL,
  `tipo` enum('producto','medicamento','servicio') DEFAULT NULL,
  `categoria_id` int DEFAULT NULL,
  `codigo_barras` varchar(100) DEFAULT NULL,
  `unidad` varchar(20) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  `requiere_receta` tinyint DEFAULT '0',
  `estado` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `tt_productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `tc_categorias` (`categorias_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_proveedores`
--

DROP TABLE IF EXISTS `tt_proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `nit` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `contacto` varchar(150) DEFAULT NULL,
  `estado` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_recetas`
--

DROP TABLE IF EXISTS `tt_recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_recetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consulta_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `dosis` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `tt_recetas_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `tt_consultas` (`id`),
  CONSTRAINT `tt_recetas_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `tt_productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_usuario_roles`
--

DROP TABLE IF EXISTS `tt_usuario_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_usuario_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `rol_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `tt_usuario_roles_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`),
  CONSTRAINT `tt_usuario_roles_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `ts_roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_usuarios`
--

DROP TABLE IF EXISTS `tt_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol_id` int DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL,
  `puede_ajustar_inventario` tinyint DEFAULT '0',
  `estado` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `rol_id` (`rol_id`),
  KEY `sucursal_id` (`sucursal_id`),
  CONSTRAINT `tt_usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `ts_roles` (`id`),
  CONSTRAINT `tt_usuarios_ibfk_2` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_venta_detalle`
--

DROP TABLE IF EXISTS `tt_venta_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_venta_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `cantidad` int DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `tt_venta_detalle_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `tt_ventas` (`id`),
  CONSTRAINT `tt_venta_detalle_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `tt_productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tt_ventas`
--

DROP TABLE IF EXISTS `tt_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `persona_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL,
  `tipo` enum('tienda','farmacia','clinica') DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `estado` enum('pendiente','pagado','anulado') DEFAULT 'pendiente',
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `correlativo` varchar(50) DEFAULT NULL,
  `caja_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `persona_id` (`persona_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `sucursal_id` (`sucursal_id`),
  KEY `caja_id` (`caja_id`),
  CONSTRAINT `tt_ventas_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `tt_personas` (`id`),
  CONSTRAINT `tt_ventas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `tt_usuarios` (`id`),
  CONSTRAINT `tt_ventas_ibfk_3` FOREIGN KEY (`sucursal_id`) REFERENCES `tc_sucursales` (`id`),
  CONSTRAINT `tt_ventas_ibfk_4` FOREIGN KEY (`caja_id`) REFERENCES `tt_cajas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-16 21:22:35
