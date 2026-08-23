-- ==========================================================
-- DATABASE SCHEMA: RUMAH JAJANAN LASHIRA
-- Sistem Manajemen Usaha Makanan, Resep, HPP, Produksi & Keuangan
-- Kompatibel dengan MySQL 5.7+ / MySQL 8.x / MariaDB (phpMyAdmin Hostinger)
-- ==========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('superadmin','admin') NOT NULL DEFAULT 'admin',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('ingredient','product') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `units`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `symbol` varchar(20) NOT NULL,
  `base_unit` varchar(20) NOT NULL,
  `conversion_value` decimal(12,4) NOT NULL DEFAULT 1.0000,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `suppliers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `ingredients`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ingredients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  `name` varchar(150) NOT NULL,
  `category_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `purchase_quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `price_per_unit` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `stock` decimal(15,2) NOT NULL DEFAULT 0.00,
  `minimum_stock` decimal(15,2) NOT NULL DEFAULT 0.00,
  `supplier_id` int(11) DEFAULT NULL,
  `buy_date` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ingredients_category` (`category_id`),
  KEY `idx_ingredients_unit` (`unit_id`),
  KEY `idx_ingredients_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `products`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  `name` varchar(150) NOT NULL,
  `category_id` int(11) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `selling_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `hpp` decimal(15,2) NOT NULL DEFAULT 0.00,
  `margin_percentage` decimal(8,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `minimum_stock` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `recipes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recipes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL UNIQUE,
  `production_quantity` int(11) NOT NULL DEFAULT 1,
  `packaging_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `labor_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `utility_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `other_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipes_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `recipe_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recipe_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipe_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `calculated_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_recipe_items_recipe` (`recipe_id`),
  KEY `idx_recipe_items_ingredient` (`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `productions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `production_number` varchar(50) NOT NULL UNIQUE,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `ingredient_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `packaging_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `labor_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `utility_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `other_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `hpp_per_unit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `production_date` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_productions_product` (`product_id`),
  KEY `idx_productions_date` (`production_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `production_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `production_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `production_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity_used` decimal(12,2) NOT NULL,
  `cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_prod_items_production` (`production_id`),
  KEY `idx_prod_items_ingredient` (`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sales`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL UNIQUE,
  `sale_date` datetime NOT NULL,
  `customer_name` varchar(150) NOT NULL DEFAULT 'Pelanggan Umum',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_hpp` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_profit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('Cash','Transfer','QRIS','E-wallet','Lainnya') NOT NULL DEFAULT 'Cash',
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sales_invoice` (`invoice_number`),
  KEY `idx_sales_date` (`sale_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sale_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL,
  `hpp` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `profit` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_items_sale` (`sale_id`),
  KEY `idx_sale_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `expenses`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_number` varchar(50) NOT NULL UNIQUE,
  `date` date NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'Cash',
  `receipt` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_date` (`date`),
  KEY `idx_expenses_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_movements`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_type` enum('ingredient','product') NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `movement_type` enum('in','out','adjustment','production','sale') NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `previous_stock` decimal(12,2) NOT NULL,
  `current_stock` decimal(12,2) NOT NULL,
  `reference_type` enum('production','sale','purchase','manual') NOT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stock_mov_item` (`item_type`, `item_id`),
  KEY `idx_stock_mov_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `audit_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `activity` varchar(150) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT '127.0.0.1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SEED DATA & DEFAULT VALUES
-- --------------------------------------------------------

-- Default Users (Password hashed with bcrypt)
-- superadmin: lashira2026!
-- admin: admin123
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`, `status`, `must_change_password`) VALUES
(1, 'Hj. Siti Lashira (Owner)', 'superadmin', 'owner@rumahjajananlashira.com', '$2a$10$7Z2i7d/zGgV1WkJLwKvZ5eHw4v16e0Z/J8mZ5Gq1b2c3d4e5f6g7h', 'superadmin', 'active', 0),
(2, 'Budi Santoso (Admin Kasir & Produksi)', 'admin', 'admin@rumahjajananlashira.com', '$2a$10$8A1b2C3d4E5f6G7h8I9j0kL1m2N3o4P5q6R7s8T9u0V1w2X3y4Z5a', 'admin', 'active', 1);

-- Default Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('business_name', 'Rumah Jajanan Lashira'),
('tagline', 'Sensasi Jajanan Nusantara Gurih, Renyah & Pedas Juara'),
('address', 'Jl. Cisaranten Kulon No. 42, Arcamanik, Kota Bandung, Jawa Barat 40293'),
('whatsapp', '0821-2345-6789'),
('email', 'kontak@rumahjajananlashira.com'),
('receipt_footer', 'Terima kasih atas pesanan Anda di Rumah Jajanan Lashira!\nCamilan dibuat segar dan higienis setiap hari.'),
('currency', 'Rp'),
('enable_negative_stock', 'false'),
('auto_update_product_hpp', 'true');

-- Default Units
INSERT INTO `units` (`id`, `name`, `symbol`, `base_unit`, `conversion_value`) VALUES
(1, 'Gram', 'g', 'g', 1.0000),
(2, 'Kilogram', 'kg', 'g', 1000.0000),
(3, 'Mililiter', 'ml', 'ml', 1.0000),
(4, 'Liter', 'l', 'ml', 1000.0000),
(5, 'Pieces / Buah', 'pcs', 'pcs', 1.0000),
(6, 'Bungkus / Pouch', 'bks', 'pcs', 1.0000),
(7, 'Butir', 'btr', 'pcs', 1.0000),
(8, 'Sendok Makan', 'sdm', 'g', 15.0000),
(9, 'Sachet', 'sct', 'pcs', 1.0000);

-- Default Categories
INSERT INTO `categories` (`id`, `name`, `type`) VALUES
(1, 'Bahan Mentah / Olahan', 'ingredient'),
(2, 'Bumbu & Rempah', 'ingredient'),
(3, 'Minyak & Lemak', 'ingredient'),
(4, 'Kemasan & Plastik', 'ingredient'),
(5, 'Keripik & Basreng', 'product'),
(6, 'Cemilan Pedas', 'product'),
(7, 'Gorengan & Frozen', 'product'),
(8, 'Makaroni & Seblak', 'product');

-- Default Suppliers
INSERT INTO `suppliers` (`id`, `name`, `phone`, `address`, `notes`) VALUES
(1, 'Toko Sumber Pangan Mandiri', '081234567890', 'Pasar Induk Gedebage Blok A No. 12, Bandung', 'Supplier tepung, minyak, dan bumbu dasar'),
(2, 'Pabrik Kerupuk & Basreng Asli', '085712345678', 'Jl. Raya Soreang No. 88, Kab. Bandung', 'Supplier basreng mentah & kerupuk seblak super'),
(3, 'Kemasan Nusantara Grafika', '087890123456', 'Jl. Kopo Jaya No. 45, Bandung', 'Supplier standing pouch klip, plastik zipper, & stiker logo');

COMMIT;
