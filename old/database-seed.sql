-- ============================================
-- SEED DATA - ERP PET SHOP
-- ============================================
-- Este arquivo popula o banco com dados de teste
-- Execute após o schema principal estar criado
-- ============================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE vendas_itens, vendas, produtos, categorias, usuarios CASCADE;

-- ============================================
-- 1. CATEGORIAS
-- ============================================
INSERT INTO categorias (id, nome, descricao, ativo) VALUES
(1, 'Rações', 'Alimentos para cães e gatos', true),
(2, 'Acessórios', 'Coleiras, guias, camas e outros', true),
(3, 'Higiene', 'Produtos de limpeza e higiene', true),
(4, 'Petiscos', 'Snacks e treats para pets', true),
(5, 'Brinquedos', 'Brinquedos diversos para pets', true);

-- ============================================
-- 2. PRODUTOS (Os mesmos 10 do mock)
-- ============================================
INSERT INTO produtos (
  id, nome, descricao, codigo_barras, preco_venda, 
  preco_custo, estoque_atual, estoque_minimo, unidade, 
  categoria_id, ativo
) VALUES
-- Rações
(1, 'Ração Golden Adult 15kg', 'Ração premium para cães adultos', '7891234567890', 189.90, 140.00, 25, 5, 1, true),
(2, 'Ração Royal Canin Puppy 3kg', 'Ração para filhotes', '7891234567891', 95.50, 70.00, 18, 5, 1, true),
(3, 'Ração Premier Gatos 10kg', 'Ração premium para gatos adultos', '7891234567892', 156.00, 115.00, 12, 5, 1, true),

-- Acessórios
(4, 'Coleira Ajustável Média', 'Coleira ajustável para cães médios', '7891234567893', 25.90, 15.00, 45, 10, 2, true),
(5, 'Guia Retrátil 5m', 'Guia retrátil resistente até 5 metros', '7891234567894', 42.00, 28.00, 30, 8, 2, true),
(9, 'Cama Pet Confort G', 'Cama ortopédica tamanho grande', '7891234567898', 89.90, 55.00, 8, 5, 2, true),

-- Higiene
(6, 'Shampoo Pet Clean 500ml', 'Shampoo neutro para cães e gatos', '7891234567895', 18.50, 10.00, 65, 15, 3, true),
(10, 'Areia Higiênica 4kg', 'Areia sanitária para gatos', '7891234567899', 22.00, 14.00, 40, 10, 3, true),

-- Petiscos
(7, 'Petisco Pedigree Dentastix', 'Petisco dental para cães', '7891234567896', 15.90, 9.00, 100, 20, 4, true),

-- Brinquedos
(8, 'Brinquedo Bola com Guizo', 'Bola interativa com som', '7891234567897', 12.50, 6.00, 55, 15, 5, true);

-- ============================================
-- 3. USUÁRIOS (Operadores de PDV)
-- ============================================
-- Senha padrão: "admin123" (hash bcrypt)
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, ativo) VALUES
(1, 'Administrador', 'admin@petshop.com', '$2a$10$YourHashedPasswordHere', 'admin', true),
(2, 'Operador PDV', 'pdv@petshop.com', '$2a$10$YourHashedPasswordHere', 'operador', true),
(3, 'Maria Silva', 'maria@petshop.com', '$2a$10$YourHashedPasswordHere', 'operador', true);

-- ============================================
-- 4. CLIENTES (Alguns exemplos)
-- ============================================
INSERT INTO clientes (id, nome, cpf, telefone, email, data_cadastro) VALUES
(1, 'João Santos', '12345678901', '11987654321', 'joao@email.com', '2024-01-15'),
(2, 'Ana Costa', '98765432109', '11912345678', 'ana@email.com', '2024-02-20'),
(3, 'Carlos Oliveira', '45678912345', '11956781234', 'carlos@email.com', '2024-03-10'),
(4, 'Patricia Lima', '78912345678', '11934567890', 'patricia@email.com', '2024-04-05');

-- ============================================
-- 5. PETS (Pets dos clientes)
-- ============================================
INSERT INTO pets (cliente_id, nome, especie, raca, data_nascimento) VALUES
(1, 'Thor', 'Cachorro', 'Golden Retriever', '2020-05-10'),
(1, 'Mia', 'Gato', 'Persa', '2021-08-15'),
(2, 'Rex', 'Cachorro', 'Pastor Alemão', '2019-12-20'),
(3, 'Luna', 'Cachorro', 'Poodle', '2022-03-25'),
(4, 'Simba', 'Gato', 'SRD', '2021-11-30');

-- ============================================
-- 6. VENDAS DE EXEMPLO (Últimos 7 dias)
-- ============================================

-- Venda 1: 2024-11-20 - Cliente João
INSERT INTO vendas (id, cliente_id, usuario_id, data_venda, valor_total, desconto, forma_pagamento, status)
VALUES (1, 1, 2, '2024-11-20 10:30:00', 205.40, 0.00, 'dinheiro', 'finalizada');

INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal, desconto)
VALUES 
(1, 1, 1, 189.90, 189.90, 0.00),  -- Ração Golden
(1, 7, 1, 15.90, 15.90, 0.50);     -- Petisco (com desconto)

-- Venda 2: 2024-11-21 - Cliente Ana
INSERT INTO vendas (id, cliente_id, usuario_id, data_venda, valor_total, desconto, forma_pagamento, status)
VALUES (2, 2, 3, '2024-11-21 14:15:00', 178.00, 5.00, 'credito', 'finalizada');

INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal, desconto)
VALUES 
(2, 3, 1, 156.00, 156.00, 0.00),  -- Ração Premier Gatos
(2, 10, 1, 22.00, 22.00, 0.00);   -- Areia Higiênica

-- Venda 3: 2024-11-22 - Sem cliente (venda rápida)
INSERT INTO vendas (id, usuario_id, data_venda, valor_total, desconto, forma_pagamento, status)
VALUES (3, 2, '2024-11-22 16:45:00', 80.40, 2.00, 'debito', 'finalizada');

INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal, desconto)
VALUES 
(3, 4, 2, 25.90, 51.80, 0.00),   -- 2x Coleira
(3, 6, 1, 18.50, 18.50, 0.00),   -- Shampoo
(3, 8, 1, 12.50, 12.50, 2.40);   -- Brinquedo (desconto)

-- Venda 4: 2024-11-23 - Cliente Carlos
INSERT INTO vendas (id, cliente_id, usuario_id, data_venda, valor_total, desconto, forma_pagamento, status)
VALUES (4, 3, 2, '2024-11-23 11:20:00', 231.90, 10.00, 'pix', 'finalizada');

INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal, desconto)
VALUES 
(4, 1, 1, 189.90, 189.90, 5.00),  -- Ração Golden (desconto)
(4, 5, 1, 42.00, 42.00, 0.00),    -- Guia Retrátil
(4, 7, 1, 15.90, 15.90, 5.90);    -- Petisco

-- Venda 5: Hoje - Cliente Patricia
INSERT INTO vendas (id, cliente_id, usuario_id, data_venda, valor_total, desconto, forma_pagamento, status)
VALUES (5, 4, 3, NOW(), 108.40, 0.00, 'dinheiro', 'finalizada');

INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal, desconto)
VALUES 
(5, 2, 1, 95.50, 95.50, 0.00),   -- Ração Royal Canin
(5, 8, 1, 12.50, 12.50, 0.00);   -- Brinquedo

-- ============================================
-- 7. ATUALIZAR SEQUÊNCIAS (Para PostgreSQL)
-- ============================================
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));
SELECT setval('produtos_id_seq', (SELECT MAX(id) FROM produtos));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('vendas_id_seq', (SELECT MAX(id) FROM vendas));

-- ============================================
-- VERIFICAÇÕES
-- ============================================
SELECT 'Categorias cadastradas:', COUNT(*) FROM categorias;
SELECT 'Produtos cadastrados:', COUNT(*) FROM produtos;
SELECT 'Usuários cadastrados:', COUNT(*) FROM usuarios;
SELECT 'Clientes cadastrados:', COUNT(*) FROM clientes;
SELECT 'Pets cadastrados:', COUNT(*) FROM pets;
SELECT 'Vendas realizadas:', COUNT(*) FROM vendas;
SELECT 'Itens vendidos:', COUNT(*) FROM vendas_itens;

-- ============================================
-- RESUMO FINANCEIRO
-- ============================================
SELECT 
  'Total de vendas (últimos 7 dias):' as descricao,
  TO_CHAR(SUM(valor_total), 'R$ 999,999.99') as valor
FROM vendas 
WHERE data_venda >= NOW() - INTERVAL '7 days';

SELECT 
  'Valor em estoque:' as descricao,
  TO_CHAR(SUM(preco_venda * estoque_atual), 'R$ 999,999.99') as valor
FROM produtos 
WHERE ativo = true;

-- ============================================
-- FIM DO SEED
-- ============================================
