-- AniHan Database Schema for MySQL/MariaDB
-- Database: anihan
--
-- IMPORT: In phpMyAdmin, select database "anihan" (or create it), then Import > Choose this file > Go.
-- Or from command line: mysql -u root -p anihan < backend/database/anihan.sql
--
-- For vendor "Source Waste Submissions" to work: ensure users (vendor role) and waste_categories
-- have rows; the app inserts into source_waste_submissions via API POST /api/v1/waste/source-submissions.
--
-- Tables created (in order for foreign keys):
--   1. users
--   2. products
--   3. waste_categories
--   4. waste_types
--   5. waste_submissions
--   6. source_waste_submissions
--   7. inventory_items
--   8. orders
--   9. deliveries
--

CREATE DATABASE IF NOT EXISTS anihan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE anihan;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('vendor', 'admin', 'user') NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    address TEXT DEFAULT '',
    profile_photo VARCHAR(500) DEFAULT '',
    is_active TINYINT(1) DEFAULT 1,
    vendor_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
    business_name VARCHAR(255) DEFAULT '',
    business_type VARCHAR(255) DEFAULT '',
    business_license VARCHAR(500) DEFAULT '',
    years_in_business VARCHAR(50) DEFAULT '',
    approval_notes TEXT DEFAULT '',
    approved_by VARCHAR(255) DEFAULT '',
    approved_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category ENUM('compost', 'fertilizer', 'preserved_food', 'processed_food', 'other') NOT NULL,
    image_url VARCHAR(500) DEFAULT '',
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    unit ENUM('kg', 'bags', 'bottles', 'pieces', 'jars', 'boxes') NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Waste Categories table
CREATE TABLE IF NOT EXISTS waste_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR(50) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Waste Types table
CREATE TABLE IF NOT EXISTS waste_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    category ENUM('fruit', 'vegetable', 'grain', 'other') NOT NULL,
    damage_level ENUM('slight', 'moderate', 'severe') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Waste Submissions table
CREATE TABLE IF NOT EXISTS waste_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    waste_type_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity >= 1),
    unit ENUM('kg', 'pieces', 'baskets', 'bags', 'boxes', 'liters') NOT NULL,
    description TEXT DEFAULT '',
    status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME DEFAULT NULL,
    title VARCHAR(255) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    `condition` VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (waste_type_id) REFERENCES waste_types(id) ON DELETE CASCADE,
    INDEX idx_waste_submissions_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source Waste Submissions table (vendor-submitted waste; used at /vendor/source-submissions)
-- Ensure users and waste_categories exist first (foreign keys).
CREATE TABLE IF NOT EXISTS source_waste_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity >= 1),
    unit ENUM('kg', 'pieces', 'baskets', 'bags', 'boxes', 'liters') NOT NULL,
    `condition` ENUM('fresh', 'slightly_damaged', 'overripe', 'bruised', 'expired', 'other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    pickup_date DATETIME NOT NULL,
    estimated_value DECIMAL(10, 2) DEFAULT 0,
    image_url VARCHAR(500) DEFAULT '',
    status ENUM('pending', 'approved', 'rejected', 'collected', 'processed') DEFAULT 'pending',
    admin_notes TEXT DEFAULT '',
    rejection_reason TEXT DEFAULT '',
    actual_value DECIMAL(10, 2) DEFAULT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES waste_categories(id) ON DELETE CASCADE,
    INDEX idx_source_waste_submissions_vendor_id (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: verify table and see data (run in MySQL/phpMyAdmin):
-- SELECT * FROM source_waste_submissions ORDER BY id DESC LIMIT 10;

-- Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('compost', 'fertilizer', 'preserved_food', 'processed_food', 'other') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit ENUM('kg', 'bags', 'bottles', 'pieces', 'jars', 'boxes') NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL CHECK (price_per_unit >= 0),
    total_value DECIMAL(10, 2) NOT NULL CHECK (total_value >= 0),
    source_waste_submission_id INT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT '',
    is_available TINYINT(1) DEFAULT 1,
    quantity_history JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (source_waste_submission_id) REFERENCES source_waste_submissions(id) ON DELETE SET NULL,
    INDEX idx_inventory_items_vendor_id (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'gcash') NOT NULL,
    payment_reference VARCHAR(255) DEFAULT '',
    delivery_status ENUM('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT DEFAULT '',
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME DEFAULT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_orders_user_id (user_id),
    INDEX idx_orders_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    delivery_person VARCHAR(255) DEFAULT '',
    delivery_vehicle VARCHAR(255) DEFAULT '',
    pickup_time DATETIME DEFAULT NULL,
    delivery_time DATETIME DEFAULT NULL,
    status ENUM('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'pending',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
