-- Criar tabela de categorias de despesas
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6B7280',
    -- Cor padrão (cinza)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Criar tabela de contas a pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, paid, partial, overdue, cancelled
    supplier_id UUID REFERENCES suppliers(id),
    category_id UUID REFERENCES expense_categories(id),
    payment_date DATE,
    total_paid NUMERIC(15, 2) DEFAULT 0,
    recurrence VARCHAR(20),
    -- monthly, weekly, etc.
    installments JSONB,
    -- Detalhes de parcelamento
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Adicionar coluna em financial_transactions para vincular ao pagamento
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS account_payable_id UUID REFERENCES accounts_payable(id);
-- Inserir algumas categorias padrão
INSERT INTO expense_categories (name, description, color)
VALUES (
        'Água',
        'Despesas com fornecimento de água',
        '#3B82F6'
    ),
    -- Azul
    (
        'Luz',
        'Despesas com energia elétrica',
        '#F59E0B'
    ),
    -- Amarelo
    (
        'Internet/Telefone',
        'Despesas com comunicação',
        '#8B5CF6'
    ),
    -- Roxo
    (
        'Aluguel',
        'Despesas com aluguel do imóvel',
        '#EF4444'
    ),
    -- Vermelho
    (
        'Fornecedores',
        'Pagamento de fornecedores de produtos',
        '#10B981'
    ),
    -- Verde
    (
        'Salários',
        'Pagamento de funcionários',
        '#EC4899'
    ),
    -- Rosa
    ('Impostos', 'Pagamento de tributos', '#6366F1'),
    -- Indigo
    ('Outros', 'Despesas diversas', '#9CA3AF') -- Cinza
    ON CONFLICT DO NOTHING;