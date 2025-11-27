-- ============================================
-- SEED DATA - ERP PET SHOP (30 Produtos)
-- UTF-8 Encoding
-- ============================================

-- Limpar dados
TRUNCATE TABLE products, product_categories CASCADE;

-- ===================================
-- CATEGORIAS (com UUIDs gerados)
-- ===================================
INSERT INTO product_categories (id, name, description, is_active) VALUES
(gen_random_uuid(), 'Racoes', 'Alimentos para caes e gatos', true),
(gen_random_uuid(), 'Acessorios', 'Coleiras, guias, camas e outros', true),
(gen_random_uuid(), 'Higiene', 'Produtos de limpeza e higiene', true),
(gen_random_uuid(), 'Petiscos', 'Snacks e treats para pets', true),
(gen_random_uuid(), 'Brinquedos', 'Brinquedos diversos para pets', true),
(gen_random_uuid(), 'Medicamentos', 'Remedios e suplementos', true),
(gen_random_uuid(), 'Roupas', 'Roupas e fantasias para pets', true);

-- ===================================
-- PRODUTOS (30 itens)
-- ===================================
WITH cat_racoes AS (SELECT id FROM product_categories WHERE name = 'Racoes' LIMIT 1),
     cat_acess AS (SELECT id FROM product_categories WHERE name = 'Acessorios' LIMIT 1),
     cat_hig AS (SELECT id FROM product_categories WHERE name = 'Higiene' LIMIT 1),
     cat_petis AS (SELECT id FROM product_categories WHERE name = 'Petiscos' LIMIT 1),
     cat_brinq AS (SELECT id FROM product_categories WHERE name = 'Brinquedos' LIMIT 1),
     cat_med AS (SELECT id FROM product_categories WHERE name = 'Medicamentos' LIMIT 1),
     cat_roupas AS (SELECT id FROM product_categories WHERE name = 'Roupas' LIMIT 1)

INSERT INTO products (
  id, category_id, name, description, ean, cost_price, sale_price,
  stock_quantity, min_stock, unit, is_bulk, is_perishable, is_active
) VALUES
-- Racoes (8 produtos)
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Golden Adult 15kg', 'Racao premium para caes adultos', '7891234567890', 140.00, 189.90, 25, 5, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Royal Canin Puppy 3kg', 'Racao para filhotes', '7891234567891', 70.00, 95.50, 18, 5, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Premier Gatos 10kg', 'Racao premium para gatos adultos', '7891234567892', 115.00, 156.00, 12, 5, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Pedigree Carne 20kg', 'Racao com carne para caes', '7891234567900', 95.00, 135.00, 30, 10, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Whiskas Peixe 10kg', 'Racao sabor peixe para gatos', '7891234567901', 88.00, 125.00, 20, 8, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Max Filhote 15kg', 'Crescimento saudavel', '7891234567902', 78.00, 112.00, 15, 5, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'Racao Special Dog Vegetais 25kg', 'Com vegetais', '7891234567903', 125.00, 175.00, 10, 3, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_racoes), 'RacaoCat Chow Adulto 3kg', 'Nutricao balanceada', '7891234567904', 42.00, 62.00, 35, 10, 'UN', false, false, true),

-- Acessorios (7 produtos)
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Coleira Ajustavel Media', 'Coleira ajustavel para caes medios', '7891234567893', 15.00, 25.90, 45, 10, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Guia Retratil 5m', 'Guia retratil resistente ate 5 metros', '7891234567894', 28.00, 42.00, 30, 8, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Cama Pet Confort G', 'Cama ortopedica tamanho grande', '7891234567898', 55.00, 89.90, 8, 5, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Bebedouro Automatico 2L', 'Fonte de agua com filtro', '7891234567905', 65.00, 98.00, 12, 4, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Comedouro Duplo Inox', 'Comedouro inox antiaderente', '7891234567906', 22.00, 35.00, 40, 10, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Caixa Transporte M', 'Transporte seguro para pets', '7891234567907', 48.00, 75.00, 15, 5, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_acess), 'Peitoral Anti-Puxao P', 'Peitoral confortavel', '7891234567908', 32.00, 52.00, 25, 8, 'UN', false, false, true),

-- Higiene (5 produtos)
(gen_random_uuid(), (SELECT id FROM cat_hig), 'Shampoo Pet Clean 500ml', 'Shampoo neutro para caes e gatos', '7891234567895', 10.00, 18.50, 65, 15, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_hig), 'Areia Higienica 4kg', 'Areia sanitaria para gatos', '7891234567899', 14.00, 22.00, 40, 10, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_hig), 'Condicionador Pelos Longos 500ml', 'Desembaraca e hidrata', '7891234567909', 12.00, 21.00, 35, 10, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_hig), 'Perfume Colonia Fresh 60ml', 'Fragrancia suave', '7891234567910', 8.00, 14.90, 50, 15, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_hig), 'Tapete Higienico 30un', 'Absorvente para pets', '7891234567911', 18.00, 29.90, 55, 12, 'UN', false, false, true),

-- Petiscos (4 produtos)
(gen_random_uuid(), (SELECT id FROM cat_petis), 'Petisco Pedigree Dentastix', 'Petisco dental para caes', '7891234567896', 9.00, 15.90, 100, 20, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_petis), 'Bifinho Carne 500g', 'Petisco natural sabor carne', '7891234567912', 12.00, 19.90, 80, 20, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_petis), 'Osso de Couro 15cm', 'Osso natural para mastigacao', '7891234567913', 6.00, 11.50, 120, 30, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_petis), 'Snack Gatos Atum 40g', 'Petisco cremoso sabor atum', '7891234567914', 3.50, 6.90, 150, 40, 'UN', false, false, true),

-- Brinquedos (3 produtos)
(gen_random_uuid(), (SELECT id FROM cat_brinq), 'Brinquedo Bola com Guizo', 'Bola interativa com som', '7891234567897', 6.00, 12.50, 55, 15, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_brinq), 'Arranhador Torre 60cm', 'Arranhador com plataforma', '7891234567915', 45.00, 78.00, 10, 3, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_brinq), 'Corda Tug Resistente', 'Corda para brincadeiras', '7891234567916', 8.00, 15.00, 42, 12, 'UN', false, false, true),

-- Medicamentos (2 produtos)
(gen_random_uuid(), (SELECT id FROM cat_med), 'Antipulgas Advantage 4ml', 'Protecao contra pulgas', '7891234567917', 35.00, 58.00, 28, 8, 'UN', false, false, true),
(gen_random_uuid(), (SELECT id FROM cat_med), 'Vermifugo Drontal Plus', 'Vermifugo oral', '7891234567918', 22.00, 38.00, 32, 10, 'UN', false, false, true),

-- Roupas (1 produto)
(gen_random_uuid(), (SELECT id FROM cat_roupas), 'Camiseta Pet Listrada P', 'Roupa confortavel', '7891234567919', 18.00, 32.00, 20, 5, 'UN', false, false, true);

-- ===================================
-- VERIFICACAO
-- ===================================
\echo ''
\echo '======================================'
\echo 'SEED EXECUTADO COM SUCESSO!'
\echo '======================================'
SELECT 'Categorias inseridas:' as tipo, COUNT(*)::text as quantidade FROM product_categories;
SELECT 'Produtos inseridos:' as tipo, COUNT(*)::text as quantidade FROM products;
\echo '======================================'
\echo 'Banco de dados pronto para uso!'
\echo '======================================'
\echo ''
