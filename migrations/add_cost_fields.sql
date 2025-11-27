-- Adicionar campos de custo em products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS last_cost NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS average_cost NUMERIC DEFAULT 0;
-- Inicializar average_cost com cost_price atual
UPDATE products
SET average_cost = cost_price,
    last_cost = cost_price
WHERE average_cost IS NULL
    OR average_cost = 0;
-- Verificar
SELECT id,
    name,
    cost_price,
    last_cost,
    average_cost,
    profit_margin
FROM products
LIMIT 5;