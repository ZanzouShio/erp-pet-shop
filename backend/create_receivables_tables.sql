-- Tabela de Taxas de Pagamento (MDR)
CREATE TABLE IF NOT EXISTS payment_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) DEFAULT 'Default',
    payment_type VARCHAR(50) NOT NULL,
    -- 'debit', 'credit_1x', 'credit_installment'
    installments_min INTEGER DEFAULT 1,
    installments_max INTEGER DEFAULT 1,
    fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    days_to_liquidate INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Contas a Receber
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    -- Valor Bruto
    net_amount NUMERIC(10, 2) NOT NULL,
    -- Valor Líquido
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    -- Valor da Taxa
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    -- Percentual da Taxa
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending', 'paid', 'overdue', 'cancelled'
    customer_id UUID REFERENCES customers(id),
    sale_id UUID REFERENCES sales(id),
    installment_number INTEGER,
    total_installments INTEGER,
    payment_method VARCHAR(50),
    origin_type VARCHAR(20) DEFAULT 'sale',
    -- 'sale', 'service', 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_receivables_sale ON accounts_receivable(sale_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON accounts_receivable(due_date);