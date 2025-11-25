-- ============================================
-- SEED DATA SIMPLIFICADO - ERP PET SHOP
-- Adaptado para as tabelas já existentes
-- ============================================

-- Limpar dados (se existirem)
DO $$ 
BEGIN
  -- Deletar em ordem de dependências
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_items') THEN
    TRUNCATE TABLE sales_items CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    TRUNCATE TABLE sales CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    TRUNCATE TABLE products CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    TRUNCATE TABLE product_categories CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    TRUNCATE TABLE users CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    TRUNCATE TABLE customers CASCADE;
  END IF;
END $$;

-- ============================================
-- CATEGORIAS
-- ============================================
INSERT INTO product_categories (name, description, active) VALUES
('Rações', 'Alimentos para cães e gatos', true),
('Acessórios', 'Coleiras, guias, camas e outros', true),
('Higiene', 'Produtos de limpeza e higiene', true),
('Petiscos', 'Snacks e treats para pets', true),
('Brinquedos', 'Brinquedos diversos para pets', true);

-- ============================================
-- PRODUTOS
-- ============================================
INSERT INTO products (
  name, description, barcode, sale_price, cost_price,
  current_stock, minimum_stock, unit, category_id, active
) VALUES
-- Rações
('Ração Golden Adult 15kg', 'Ração premium para cães adultos', '7891234567890', 189.90, 140.00, 25, 5, 'UN', 1, true),
('Ração Royal Canin Puppy 3kg', 'Ração para filhotes', '7891234567891', 95.50, 70.00, 18, 5, 'UN', 1, true),
('Ração Premier Gatos 10kg', 'Ração premium para gatos adultos', '7891234567892', 156.00, 115.00, 12, 5, 'UN', 1, true),

-- Acessórios
('Coleira Ajustável Média', 'Coleira ajustável para cães médios', '7891234567893', 25.90, 15.00, 45, 10, 'UN', 2, true),
('Guia Retrátil 5m', 'Guia retrátil resistente até 5 metros', '7891234567894', 42.00, 28.00, 30, 8, 'UN', 2, true),
('Cama Pet Confort G', 'Cama ortopédica tamanho grande', '7891234567898', 89.90, 55.00, 8, 5, 'UN', 2, true),

-- Higiene
('Shampoo Pet Clean 500ml', 'Shampoo neutro para cães e gatos', '7891234567895', 18.50, 10.00, 65, 15, 'UN', 3, true),
('Areia Higiênica 4kg', 'Areia sanitária para gatos', '7891234567899', 22.00, 14.00, 40, 10, 'UN', 3, true),

-- Petiscos
('Petisco Pedigree Dentastix', 'Petisco dental para cães', '7891234567896', 15.90, 9.00, 100, 20, 'UN', 4, true),

-- Brinquedos
('Brinquedo Bola com Guizo', 'Bola interativa com som', '7891234567897', 12.50, 6.00, 55, 15, 'UN', 5, true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
\echo '======================================'
\echo 'SEED EXECUTADO COM SUCESSO!'
\echo '======================================'
SELECT 'Categorias:', COUNT(*) FROM product_categories;
SELECT 'Produtos:', COUNT(*) FROM products;
\echo '======================================'
