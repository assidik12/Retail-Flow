-- ===================================================================
-- 7. Data Awal / Seed Data Toko Batik Nusantara (RetailFlow)
-- ===================================================================

-- Sample User (Password default: 'password123' ter-hash dengan BCrypt)
INSERT IGNORE INTO `user` (`username`, `password`, `email`, `role`, `phone_number`, `address`, `pos_code`) VALUES
('admin', '$2a$12$69/r3O8v7wPZ62X0uIskQe6eHwG9cKjJ.n0P4vM6F81b3vFq1vM2S', 'admin@toko.com', 'admin', '08111111111', 'Kantor Pusat Batik Nusantara', '10110'),
('budi.owner', '$2a$12$LM4sWNgqg0emjcg3zaHrTOPz0F7Gv44.7MZyiOBsFX2p.wUi9WMpy', 'budi.owner@retailflow.id', 'owner', '081234567890', 'Galeri Batik Nusantara Jakarta', '10110'),
('rani.kasir', '$2a$12$oLkLG6DQSXCLMw.R1QtXN.OAUsbEyu28xo.26fo/CxU0VmJZstUBq', 'rani.kasir@retailflow.id', 'cashier', '081298765432', 'Outlet Batik Nusantara Mall', '10220');

-- Katalog Produk Batik Nusantara
INSERT INTO `product` (`id`, `name`, `price`, `stock`) VALUES
(1, 'Kemeja Parang Sagara', 385000.0, 35),
(2, 'Outer Kawung Senja', 465000.0, 24),
(3, 'Blus Sekar Jagad', 329000.0, 40),
(4, 'Kain Lereng Pesisir', 550000.0, 15),
(5, 'Kemeja Batik Mega Mendung', 420000.0, 28),
(6, 'Tunik Batik Truntum Klasik', 365000.0, 18),
(7, 'Kain Batik Tulis Sidomukti', 650000.0, 8),
(8, 'Selendang Batik Cuwiri Sutra', 275000.0, 22)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `price` = VALUES(`price`),
    `stock` = VALUES(`stock`);

