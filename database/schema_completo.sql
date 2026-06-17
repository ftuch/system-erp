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
-- Dumping data for table `tc_categorias`
--

LOCK TABLES `tc_categorias` WRITE;
/*!40000 ALTER TABLE `tc_categorias` DISABLE KEYS */;
INSERT INTO `tc_categorias` VALUES (1,'Tienda');
/*!40000 ALTER TABLE `tc_categorias` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tc_menus`
--

LOCK TABLES `tc_menus` WRITE;
/*!40000 ALTER TABLE `tc_menus` DISABLE KEYS */;
INSERT INTO `tc_menus` VALUES (1,'Dashboard','dashboard','/dashboard',1,NULL,1,'dashboard'),(6,'Inventario','inventory_2','/inventario',3,NULL,1,'inventario'),(7,'Kardex','kardex','/inventario/kardex',2,6,0,'kardex'),(8,'Bodegas','warehouse','/inventario/bodegas',3,6,0,'bodegas'),(31,'Sucursales','store','/sucursales',1,37,1,'sucursales'),(37,'Configuraci├│n','settings','/configuracion',9,NULL,1,'configuracion'),(38,'Usuarios','people','/usuarios',2,37,1,'usuarios'),(39,'Roles','manage_accounts','/roles',3,37,1,'roles'),(42,'Clientes','people','/clientes',6,NULL,1,'clientes'),(43,'Proveedores','local_shipping','/proveedores',7,NULL,1,'proveedores'),(46,'Caja','account_balance_wallet','/caja',5,NULL,1,'cajas'),(49,'Pedidos','shopping_bag','/pedidos',4,NULL,1,'pedidos'),(50,'Flujo de Pedidos','account_tree','/pedidos/config',10,37,1,'pedidos_config'),(51,'Productos','category','/productos',1,6,1,'productos'),(52,'Ventas','point_of_sale','/ventas',2,NULL,1,'ventas');
/*!40000 ALTER TABLE `tc_menus` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tc_pedidos_config`
--

LOCK TABLES `tc_pedidos_config` WRITE;
/*!40000 ALTER TABLE `tc_pedidos_config` DISABLE KEYS */;
INSERT INTO `tc_pedidos_config` VALUES (1,1,1,1,'despacho',NULL,NULL,1);
/*!40000 ALTER TABLE `tc_pedidos_config` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tc_series_documentos`
--

LOCK TABLES `tc_series_documentos` WRITE;
/*!40000 ALTER TABLE `tc_series_documentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tc_series_documentos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tc_sucursales`
--

LOCK TABLES `tc_sucursales` WRITE;
/*!40000 ALTER TABLE `tc_sucursales` DISABLE KEYS */;
INSERT INTO `tc_sucursales` VALUES (1,'Central','Central','50505050',1,'2026-05-27 17:30:48'),(2,'San cristobal','San Cristobal Zona 2','504545845',1,'2026-05-29 22:33:12'),(3,'Casa Matriz','Direcci├│n Principal','00000000',1,'2026-06-16 20:30:48');
/*!40000 ALTER TABLE `tc_sucursales` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `ts_permisos`
--

LOCK TABLES `ts_permisos` WRITE;
/*!40000 ALTER TABLE `ts_permisos` DISABLE KEYS */;
INSERT INTO `ts_permisos` VALUES (81,2,1,0,0,0,0),(82,2,6,1,0,0,0),(86,2,7,0,0,0,0),(90,2,8,0,0,0,0),(97,2,37,0,0,0,0),(98,2,38,0,0,0,0),(99,2,39,0,0,0,0),(100,2,31,0,0,0,0),(114,2,51,1,1,1,0),(115,2,50,1,1,1,0),(116,3,51,1,1,1,0),(117,3,50,1,1,1,0),(118,4,51,1,1,1,0),(119,4,50,1,1,1,0),(135,2,6,1,1,1,0),(136,3,6,1,1,1,0),(137,4,6,1,1,1,0),(152,1,1,1,1,1,1),(153,1,31,1,1,1,1),(154,1,51,1,1,1,1),(155,1,6,1,1,1,1),(156,1,7,1,1,1,1),(157,1,38,1,1,1,1),(158,1,8,1,1,1,1),(159,1,39,1,1,1,1),(160,1,49,1,1,1,1),(161,1,46,1,1,1,1),(162,1,42,1,1,1,1),(163,1,43,1,1,1,1),(164,1,37,1,1,1,1),(165,1,50,1,1,1,1),(166,1,52,1,1,1,0),(167,2,52,1,1,1,0),(168,3,52,1,1,1,0),(169,4,52,1,1,1,0);
/*!40000 ALTER TABLE `ts_permisos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `ts_roles`
--

LOCK TABLES `ts_roles` WRITE;
/*!40000 ALTER TABLE `ts_roles` DISABLE KEYS */;
INSERT INTO `ts_roles` VALUES (1,'Administrador'),(2,'CAJERO'),(3,'Bodega'),(4,'RUTERO');
/*!40000 ALTER TABLE `ts_roles` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_arqueos_caja`
--

LOCK TABLES `tt_arqueos_caja` WRITE;
/*!40000 ALTER TABLE `tt_arqueos_caja` DISABLE KEYS */;
/*!40000 ALTER TABLE `tt_arqueos_caja` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_bodegas`
--

LOCK TABLES `tt_bodegas` WRITE;
/*!40000 ALTER TABLE `tt_bodegas` DISABLE KEYS */;
INSERT INTO `tt_bodegas` VALUES (1,1,'Bodega Principal'),(2,2,'Bodega Principal'),(3,3,'Bodega Principal');
/*!40000 ALTER TABLE `tt_bodegas` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_cajas`
--

LOCK TABLES `tt_cajas` WRITE;
/*!40000 ALTER TABLE `tt_cajas` DISABLE KEYS */;
INSERT INTO `tt_cajas` VALUES (1,1,1,'Caja','cerrada',NULL,NULL,'2026-05-30 00:23:14',NULL),(2,1,1,'Caja Principal','cerrada',100.00,NULL,'2026-05-30 02:44:28',NULL),(3,1,1,'Caja Principal','cerrada',100.00,NULL,'2026-05-30 02:46:24',NULL),(4,1,1,'Caja Principal','cerrada',10.00,NULL,'2026-05-30 02:48:32',NULL),(5,1,1,'Caja Principal','cerrada',100.00,NULL,'2026-05-30 02:51:58',NULL),(6,1,1,'Caja Principal','cerrada',10.00,NULL,'2026-05-30 02:54:36',NULL),(7,1,1,'Caja Principal','cerrada',200.00,NULL,'2026-05-30 02:59:30',NULL),(8,1,1,'Caja Principal','cerrada',100.00,NULL,'2026-05-30 03:02:00',NULL),(9,1,1,'Caja Principal','cerrada',200.00,NULL,'2026-05-30 03:08:34',NULL),(10,1,1,'Caja Principal','cerrada',200.00,NULL,'2026-05-30 03:11:01',NULL),(11,1,1,'Caja Principal','cerrada',200.00,NULL,'2026-05-30 03:13:34',NULL),(12,1,1,'Caja Principal','cerrada',200.00,NULL,'2026-05-30 03:15:14',NULL),(13,1,1,'Caja Principal','cerrada',400.00,400.00,'2026-05-30 03:26:44','2026-06-17 00:10:07'),(14,1,1,'Felix','cerrada',200.00,400.00,'2026-06-17 00:10:19','2026-06-17 00:17:20'),(15,1,1,'Caja 1','cerrada',130.00,130.00,'2026-06-17 00:17:48','2026-06-17 00:18:15'),(16,1,1,'Caja 1','abierta',200.00,NULL,'2026-06-17 00:18:23',NULL);
/*!40000 ALTER TABLE `tt_cajas` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_compra_detalle`
--

LOCK TABLES `tt_compra_detalle` WRITE;
/*!40000 ALTER TABLE `tt_compra_detalle` DISABLE KEYS */;
INSERT INTO `tt_compra_detalle` VALUES (1,1,1,10,25.00,250.00);
/*!40000 ALTER TABLE `tt_compra_detalle` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_compras`
--

LOCK TABLES `tt_compras` WRITE;
/*!40000 ALTER TABLE `tt_compras` DISABLE KEYS */;
INSERT INTO `tt_compras` VALUES (1,1,1,1,250.00,'pendiente',NULL,'2026-05-28 22:00:20');
/*!40000 ALTER TABLE `tt_compras` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_consultas`
--

LOCK TABLES `tt_consultas` WRITE;
/*!40000 ALTER TABLE `tt_consultas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tt_consultas` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_documentos_fiscales`
--

LOCK TABLES `tt_documentos_fiscales` WRITE;
/*!40000 ALTER TABLE `tt_documentos_fiscales` DISABLE KEYS */;
/*!40000 ALTER TABLE `tt_documentos_fiscales` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_existencias`
--

LOCK TABLES `tt_existencias` WRITE;
/*!40000 ALTER TABLE `tt_existencias` DISABLE KEYS */;
INSERT INTO `tt_existencias` VALUES (2,2,1,128,0,0),(3,1,1,12,0,0);
/*!40000 ALTER TABLE `tt_existencias` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_movimientos_caja`
--

LOCK TABLES `tt_movimientos_caja` WRITE;
/*!40000 ALTER TABLE `tt_movimientos_caja` DISABLE KEYS */;
INSERT INTO `tt_movimientos_caja` VALUES (1,16,1,'ingreso','venta',4.00,'Venta #1','2026-06-17 02:42:04'),(2,16,1,'ingreso','venta',8.00,'Venta #2','2026-06-17 02:44:43'),(3,16,1,'ingreso','venta',2.00,'Venta #3','2026-06-17 03:02:57');
/*!40000 ALTER TABLE `tt_movimientos_caja` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_movimientos_inventario`
--

LOCK TABLES `tt_movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `tt_movimientos_inventario` DISABLE KEYS */;
INSERT INTO `tt_movimientos_inventario` VALUES (1,2,1,'entrada',13,'Recepcion de pedido (retroactivo)',1,'pedido',1,'2026-06-17 01:06:30'),(2,1,1,'entrada',13,'Recepcion de pedido (retroactivo)',1,'pedido',1,'2026-06-17 01:06:30'),(3,2,1,'entrada',5,'Recepcion de pedido (retroactivo)',2,'pedido',1,'2026-06-17 01:06:30'),(4,1,1,'entrada',1,'Recepcion de pedido (retroactivo)',2,'pedido',1,'2026-06-17 01:06:30'),(5,2,1,'entrada',100,'Recepci├│n de pedido',3,'pedido',1,'2026-06-17 01:10:18'),(6,2,1,'entrada',10,'Recepci├│n de pedido',5,'pedido',1,'2026-06-17 01:18:47'),(7,2,1,'entrada',5,'Bonificaci├│n de pedido',5,'pedido',1,'2026-06-17 01:18:47'),(8,2,1,'salida',1,'Venta',1,'venta',1,'2026-06-17 02:42:04'),(9,1,1,'salida',1,'Venta',1,'venta',1,'2026-06-17 02:42:04'),(10,2,1,'salida',3,'Venta',2,'venta',1,'2026-06-17 02:44:43'),(11,1,1,'salida',1,'Venta',2,'venta',1,'2026-06-17 02:44:43'),(12,2,1,'salida',1,'Venta',3,'venta',1,'2026-06-17 03:02:57');
/*!40000 ALTER TABLE `tt_movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_pagos`
--

LOCK TABLES `tt_pagos` WRITE;
/*!40000 ALTER TABLE `tt_pagos` DISABLE KEYS */;
INSERT INTO `tt_pagos` VALUES (1,1,5.00,'efectivo','','2026-06-17 02:42:04'),(2,2,10.00,'efectivo','','2026-06-17 02:44:43'),(3,3,2.00,'efectivo','','2026-06-17 03:02:57');
/*!40000 ALTER TABLE `tt_pagos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_pedido_detalle`
--

LOCK TABLES `tt_pedido_detalle` WRITE;
/*!40000 ALTER TABLE `tt_pedido_detalle` DISABLE KEYS */;
INSERT INTO `tt_pedido_detalle` VALUES (1,1,2,NULL,13,NULL,0.00,1.00,13.00),(2,1,1,NULL,13,NULL,0.00,1.00,13.00),(3,2,2,NULL,5,NULL,0.00,1.00,5.00),(4,2,1,NULL,1,NULL,0.00,1.00,1.00),(5,3,2,NULL,100,NULL,0.00,1.00,100.00),(6,4,1,NULL,11,NULL,0.00,1.00,11.00),(7,5,2,NULL,10,10.00,5.00,2.00,20.00);
/*!40000 ALTER TABLE `tt_pedido_detalle` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_pedidos`
--

LOCK TABLES `tt_pedidos` WRITE;
/*!40000 ALTER TABLE `tt_pedidos` DISABLE KEYS */;
INSERT INTO `tt_pedidos` VALUES (1,'PED-00001',1,1,1,1,'recibido',NULL,NULL,'Ok',26.00,'2026-06-17 00:54:25','2026-06-17 00:54:41','2026-06-17 00:54:53'),(2,'PED-00002',1,1,1,1,'recibido',NULL,NULL,'ok',6.00,'2026-06-17 01:00:57','2026-06-17 01:01:17','2026-06-17 01:01:20'),(3,'PED-00003',1,1,1,1,'recibido',NULL,NULL,NULL,100.00,'2026-06-17 01:09:58','2026-06-17 01:10:13','2026-06-17 01:10:18'),(4,'PED-00004',1,1,1,NULL,'rechazado',NULL,NULL,'test',11.00,'2026-06-17 01:17:57','2026-06-17 01:18:10',NULL),(5,'PED-00005',1,1,1,1,'recibido',NULL,'se recibio 5 de bonificacion','ok',20.00,'2026-06-17 01:18:24','2026-06-17 01:18:31','2026-06-17 01:18:47');
/*!40000 ALTER TABLE `tt_pedidos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_personas`
--

LOCK TABLES `tt_personas` WRITE;
/*!40000 ALTER TABLE `tt_personas` DISABLE KEYS */;
INSERT INTO `tt_personas` VALUES (1,'Felix tuch','81757816','50532200','4202 8th Ave','cliente','felixgtmusic@gmail.com','2026-06-16 23:50:58');
/*!40000 ALTER TABLE `tt_personas` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_productos`
--

LOCK TABLES `tt_productos` WRITE;
/*!40000 ALTER TABLE `tt_productos` DISABLE KEYS */;
INSERT INTO `tt_productos` VALUES (1,'Nachos','producto',1,'45','1',2.00,1.00,0,1),(2,'jalape├▒os','producto',1,'454545','unidad',2.00,1.00,0,1);
/*!40000 ALTER TABLE `tt_productos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_proveedores`
--

LOCK TABLES `tt_proveedores` WRITE;
/*!40000 ALTER TABLE `tt_proveedores` DISABLE KEYS */;
INSERT INTO `tt_proveedores` VALUES (1,'Diana','81787878','50505050','diana@gmail.com','cuidad','ciudad',1,'2026-05-28 15:56:48'),(2,'Tipicos Crismi','50505050','50538585','felix_15tuchy@hotmail.com','4202 8th Ave','juan lopez',1,'2026-06-16 23:59:05');
/*!40000 ALTER TABLE `tt_proveedores` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_recetas`
--

LOCK TABLES `tt_recetas` WRITE;
/*!40000 ALTER TABLE `tt_recetas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tt_recetas` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_usuario_roles`
--

LOCK TABLES `tt_usuario_roles` WRITE;
/*!40000 ALTER TABLE `tt_usuario_roles` DISABLE KEYS */;
INSERT INTO `tt_usuario_roles` VALUES (1,1,1),(5,2,1),(13,3,2);
/*!40000 ALTER TABLE `tt_usuario_roles` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_usuarios`
--

LOCK TABLES `tt_usuarios` WRITE;
/*!40000 ALTER TABLE `tt_usuarios` DISABLE KEYS */;
INSERT INTO `tt_usuarios` VALUES (1,'Administrador','admin','$2a$10$chOek5ohLfTRUgUoRX7nf.HzlZMhj0Mf/tyV5MFPBkZKkn7lw1P.W',1,1,0,1,'2026-05-27 17:31:12'),(2,'Juan P├®rez','jperez','$2a$10$pF88NDUiZVBikQJzjgJg0.gopU3UF/BvpuBFShRwxewWyZO1pGDmm',1,1,0,1,'2026-05-28 03:15:45'),(3,'Felix Tuch','ftuch','$2a$10$zCvF.HM81V4/Nd6feOpelu2bvFQOZRXdUsxrlzV6WmZQZRYrw3YSq',2,2,0,1,'2026-05-29 21:24:40'),(4,'Juan lopez','jlopez','$2a$10$Os6pehoV6hz9GP3aVAyBcOaVTfriVFaHtdhS3.EV3XGfVXy814LiC',1,1,0,1,'2026-06-16 21:13:53');
/*!40000 ALTER TABLE `tt_usuarios` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tt_venta_detalle`
--

LOCK TABLES `tt_venta_detalle` WRITE;
/*!40000 ALTER TABLE `tt_venta_detalle` DISABLE KEYS */;
INSERT INTO `tt_venta_detalle` VALUES (1,1,2,1,2.00,2.00),(2,1,1,1,2.00,2.00),(3,2,2,3,2.00,6.00),(4,2,1,1,2.00,2.00),(5,3,2,1,2.00,2.00);
/*!40000 ALTER TABLE `tt_venta_detalle` ENABLE KEYS */;
UNLOCK TABLES;

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

--
-- Dumping data for table `tt_ventas`
--

LOCK TABLES `tt_ventas` WRITE;
/*!40000 ALTER TABLE `tt_ventas` DISABLE KEYS */;
INSERT INTO `tt_ventas` VALUES (1,NULL,1,1,'tienda',4.00,'pagado','2026-06-17 02:42:04','1',16),(2,NULL,1,1,'tienda',8.00,'pagado','2026-06-17 02:44:43','2',16),(3,NULL,1,1,'tienda',2.00,'pagado','2026-06-17 03:02:57','3',16);
/*!40000 ALTER TABLE `tt_ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-16 21:22:15
