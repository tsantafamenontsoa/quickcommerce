-- ============================================
-- QuickCommerce - Séance 1 : Base de données monolithique
-- ============================================
-- TOUT dans une seule base de données (SPOF #4 et #5)

CREATE DATABASE IF NOT EXISTS quickcommerce;
USE quickcommerce;

-- ============================================
-- TABLE : users (Utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE : products (Catalogue produits)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE : cart (Panier)
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE : orders (Commandes)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE : order_items (Détails commande)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE : payments (Paiements)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('card', 'paypal', 'bank_transfer') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Utilisateurs
INSERT INTO users (email, password, first_name, last_name) VALUES
('alice@example.com', 'hashed_password_1', 'Alice', 'Dupont'),
('bob@example.com', 'hashed_password_2', 'Bob', 'Martin'),
('charlie@example.com', 'hashed_password_3', 'Charlie', 'Bernard');

-- Produits
INSERT INTO products (name, description, price, stock_quantity, category, image_url) VALUES
('Laptop Dell XPS 13', 'Ultrabook professionnel 13 pouces', 1299.99, 15, 'Informatique', 'https://via.placeholder.com/300'),
('iPhone 15 Pro', 'Smartphone Apple dernière génération', 1199.99, 25, 'Smartphones', 'https://via.placeholder.com/300'),
('Sony WH-1000XM5', 'Casque à réduction de bruit active', 399.99, 40, 'Audio', 'https://via.placeholder.com/300'),
('Samsung Galaxy Tab S9', 'Tablette Android 11 pouces', 699.99, 20, 'Tablettes', 'https://via.placeholder.com/300'),
('Logitech MX Master 3S', 'Souris sans fil ergonomique', 99.99, 100, 'Accessoires', 'https://via.placeholder.com/300'),
('MacBook Pro 14"', 'Ordinateur portable Apple M3', 2299.99, 10, 'Informatique', 'https://via.placeholder.com/300'),
('AirPods Pro 2', 'Écouteurs sans fil Apple', 279.99, 50, 'Audio', 'https://via.placeholder.com/300'),
('Kindle Paperwhite', 'Liseuse électronique Amazon', 139.99, 30, 'Livres', 'https://via.placeholder.com/300'),
('Nintendo Switch OLED', 'Console de jeu portable', 349.99, 18, 'Jeux', 'https://via.placeholder.com/300'),
('Dyson V15 Detect', 'Aspirateur sans fil', 699.99, 12, 'Électroménager', 'https://via.placeholder.com/300');

-- Paniers (exemples)
INSERT INTO cart (user_id, product_id, quantity) VALUES
(1, 1, 1),  -- Alice: Laptop
(1, 5, 2),  -- Alice: 2 souris
(2, 2, 1),  -- Bob: iPhone
(2, 7, 1);  -- Bob: AirPods

-- Commandes (exemples)
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
(1, 1499.97, 'delivered', '123 Rue de la Paix, 75001 Paris'),
(2, 1479.98, 'shipped', '456 Avenue des Champs, 69001 Lyon'),
(3, 699.99, 'pending', '789 Boulevard Victor Hugo, 31000 Toulouse');

-- Détails commandes
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 1299.99),
(1, 5, 2, 99.99),
(2, 2, 1, 1199.99),
(2, 7, 1, 279.99),
(3, 4, 1, 699.99);

-- Paiements
INSERT INTO payments (order_id, amount, payment_method, status, transaction_id) VALUES
(1, 1499.97, 'card', 'completed', 'TXN_001_2024_12_15'),
(2, 1479.98, 'paypal', 'completed', 'PAYPAL_002_2024_12_16'),
(3, 699.99, 'card', 'pending', NULL);

-- ============================================
-- INDEX POUR PERFORMANCES
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
