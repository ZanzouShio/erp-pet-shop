-- 2. Estrutura da tabela sale_payments
SELECT column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sale_payments'
ORDER BY ordinal_position;