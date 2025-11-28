-- Verificar colunas da tabela sales
SELECT column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'sales';
-- Verificar vendas recentes (últimas 10)
SELECT id,
  created_at,
  total_amount,
  status
FROM sales
ORDER BY created_at DESC
LIMIT 10;
-- Testar a query do dashboard (adaptada)
SELECT COUNT(*) as count,
  COALESCE(SUM(total_amount), 0) as total -- Tentando com total_amount
FROM sales
WHERE status = 'completed';