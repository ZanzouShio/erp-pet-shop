-- =====================================================
-- ESQUEMA DO BANCO DE DADOS - ERP PET SHOP
-- PostgreSQL 14+
-- =====================================================

-- =====================================================
-- 1. MÓDULO DE AUTENTICAÇÃO E USUÁRIOS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'stock', 'financial')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'DELETE_ITEM', 'CANCEL_SALE', 'EDIT_PRODUCT', etc
    entity_type VARCHAR(100) NOT NULL, -- 'sale', 'product', 'stock', etc
    entity_id UUID,
    description TEXT,
    reason TEXT, -- justificativa obrigatória para ações críticas
    metadata JSONB, -- dados adicionais
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. MÓDULO DE CLIENTES
-- =====================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    birth_date DATE,
    -- Endereço (todos opcionais)
    zip_code VARCHAR(10),
    address VARCHAR(255),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    -- Controle
    credit_limit DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'defaulter')),
    -- Programa de fidelidade
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    last_purchase_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50), -- 'dog', 'cat', 'bird', etc
    breed VARCHAR(100),
    size VARCHAR(20) CHECK (size IN ('small', 'medium', 'large')),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'redeem', 'expire')),
    points INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- ID da venda ou resgate
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. MÓDULO DE FORNECEDORES
-- =====================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    website VARCHAR(255),
    -- Endereço
    zip_code VARCHAR(10),
    address VARCHAR(255),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    -- Condições comerciais
    payment_terms VARCHAR(100), -- '30/60/90 dias', '10 dias', etc
    discount_for_early_payment DECIMAL(5, 2),
    average_delivery_days INTEGER,
    -- Avaliação
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. MÓDULO DE PRODUTOS E ESTOQUE
-- =====================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    -- Códigos
    internal_code VARCHAR(100) UNIQUE,
    ean VARCHAR(13),
    sku VARCHAR(100),
    -- Precificação
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    profit_margin DECIMAL(5, 2),
    -- Estoque
    stock_quantity DECIMAL(10, 3) DEFAULT 0, -- suporta decimais para produtos a granel
    min_stock DECIMAL(10, 3) DEFAULT 0,
    max_stock DECIMAL(10, 3),
    unit VARCHAR(20) DEFAULT 'UN', -- 'UN', 'KG', 'L', 'CX', etc
    -- Produtos a granel
    is_bulk BOOLEAN DEFAULT false,
    parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- produto "mãe" (pacote fechado)
    conversion_factor DECIMAL(10, 3), -- ex: 1 pacote = 15kg
    -- Perecíveis
    is_perishable BOOLEAN DEFAULT false,
    shelf_life_days INTEGER, -- validade em dias
    -- Lote (opcional)
    track_by_batch BOOLEAN DEFAULT false,
    -- Fiscal
    ncm VARCHAR(8),
    cest VARCHAR(7),
    cfop VARCHAR(4) DEFAULT '5102',
    icms_rate DECIMAL(5, 2),
    ipi_rate DECIMAL(5, 2),
    pis_rate DECIMAL(5, 2),
    cofins_rate DECIMAL(5, 2),
    -- Outros
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) CHECK (type IN ('store', 'warehouse', 'other')),
    address TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(10, 3) DEFAULT 0, -- estoque reservado (orçamentos)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, location_id)
);

CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
    location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
    is_blocked BOOLEAN DEFAULT false, -- bloqueado para recall
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, batch_number)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'OPENING', 'LOSS')),
    quantity DECIMAL(10, 3) NOT NULL,
    cost_price DECIMAL(10, 2),
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', 'opening', etc
    reference_id UUID, -- ID da venda, compra, etc
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. MÓDULO DE VENDAS E PDV
-- =====================================================

CREATE TABLE pdv_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
    serial_number VARCHAR(100),
    ip_address VARCHAR(45),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID NOT NULL REFERENCES pdv_terminals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(10, 2),
    expected_balance DECIMAL(10, 2),
    difference DECIMAL(10, 2), -- sobra/falta
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('withdrawal', 'supply')), -- sangria, suprimento
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL, -- número sequencial de venda
    terminal_id UUID REFERENCES pdv_terminals(id) ON DELETE SET NULL,
    cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    -- Valores
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    cancelled_reason TEXT,
    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP,
    -- Nota fiscal
    invoice_type VARCHAR(20), -- 'nfce', 'nfe', 'nfse', 'none'
    invoice_number VARCHAR(50),
    invoice_series VARCHAR(10),
    invoice_key VARCHAR(44), -- chave de acesso
    invoice_xml_path TEXT,
    invoice_pdf_path TEXT,
    invoice_issued_at TIMESTAMP,
    -- Sincronização (para PDV offline)
    synced BOOLEAN DEFAULT false,
    sync_errors TEXT,
    -- Programa de fidelidade
    loyalty_points_earned INTEGER DEFAULT 0,
    loyalty_points_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    -- Quantidade e valores
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2), -- custo no momento da venda
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    -- Produto a granel
    weight DECIMAL(10, 3), -- peso em kg (se aplicável)
    barcode_generated VARCHAR(13), -- código de barras da etiqueta gerada
    -- Auditoria de exclusões
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deletion_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'debit_card', 'credit_card', 'pix', 'bank_slip', 'store_credit')),
    amount DECIMAL(10, 2) NOT NULL,
    -- Cartão
    card_brand VARCHAR(50),
    card_last_digits VARCHAR(4),
    installments INTEGER DEFAULT 1,
    authorization_code VARCHAR(100), -- NSU da maquininha
    -- PIX
    pix_qrcode TEXT,
    pix_txid VARCHAR(100),
    pix_e2eid VARCHAR(100),
    pix_status VARCHAR(20), -- 'pending', 'confirmed', 'expired', 'cancelled'
    pix_confirmed_at TIMESTAMP,
    -- Outros
    change_amount DECIMAL(10, 2), -- troco (se dinheiro)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. MÓDULO DE ORÇAMENTOS
-- =====================================================

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    -- Valores
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    -- Validade e status
    valid_until DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'converted')),
    converted_to_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    converted_at TIMESTAMP,
    -- Outros
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. MÓDULO FINANCEIRO
-- =====================================================

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- ex: '1.1.01', '3.2.05'
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('revenue', 'expense', 'asset', 'liability')),
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    is_analytical BOOLEAN DEFAULT true, -- true = recebe lançamentos, false = sintética
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NOT NULL, -- 'Itaú', 'Nubank', 'Mercado Pago'
    bank_code VARCHAR(10),
    agency VARCHAR(20),
    account_number VARCHAR(20),
    account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings', 'payment')),
    initial_balance DECIMAL(10, 2) DEFAULT 0,
    current_balance DECIMAL(10, 2) DEFAULT 0,
    -- Integração PIX
    pix_enabled BOOLEAN DEFAULT false,
    pix_key VARCHAR(255),
    pix_api_credentials JSONB, -- credenciais criptografadas
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('revenue', 'expense')),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    -- Valores
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    -- Datas
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    -- Status e pagamento
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(50),
    -- Parcelamento
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id UUID REFERENCES financial_transactions(id) ON DELETE CASCADE,
    -- Juros e descontos
    interest DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    -- Recorrência
    is_recurring BOOLEAN DEFAULT false,
    recurrence_frequency VARCHAR(20), -- 'monthly', 'yearly', etc
    -- Documentos
    document_type VARCHAR(50), -- 'invoice', 'receipt', 'bill', etc
    document_number VARCHAR(100),
    attachment_path TEXT,
    -- Referências
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'transfer', etc
    reference_id UUID,
    -- Outros
    notes TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES financial_transactions(id) ON DELETE CASCADE,
    bank_transaction_date DATE NOT NULL,
    bank_description TEXT,
    bank_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reconciled', 'divergent')),
    reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reconciled_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. MÓDULO FISCAL
-- =====================================================

CREATE TABLE digital_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('A1', 'A3')),
    certificate_file BYTEA, -- arquivo .pfx
    password_encrypted VARCHAR(255),
    issued_by VARCHAR(255),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('nfce', 'nfe', 'nfse')),
    series VARCHAR(10) NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, series)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('nfce', 'nfe', 'nfse', 'sat')),
    number VARCHAR(50) NOT NULL,
    series VARCHAR(10) NOT NULL,
    access_key VARCHAR(44), -- chave de acesso de 44 dígitos
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'cancelled', 'denied', 'contingency')),
    -- Emissor (empresa)
    issuer_cnpj VARCHAR(18) NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    -- Destinatário
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('customer', 'supplier')),
    recipient_id UUID, -- customer_id ou supplier_id
    recipient_cpf_cnpj VARCHAR(18),
    recipient_name VARCHAR(255),
    -- Valores
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    icms_total DECIMAL(10, 2) DEFAULT 0,
    ipi_total DECIMAL(10, 2) DEFAULT 0,
    -- SEFAZ
    authorization_protocol VARCHAR(50),
    authorization_date TIMESTAMP,
    sefaz_response TEXT,
    -- Cancelamento
    cancelled_at TIMESTAMP,
    cancellation_protocol VARCHAR(50),
    cancellation_reason TEXT,
    -- Arquivos
    xml_file BYTEA,
    pdf_path TEXT,
    -- Referências
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    -- Outros
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. MÓDULO DE CONFIGURAÇÕES
-- =====================================================

CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Dados da empresa
    company_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    state_registration VARCHAR(50),
    municipal_registration VARCHAR(50),
    tax_regime VARCHAR(50), -- 'simples_nacional', 'lucro_presumido', etc
    -- Endereço
    zip_code VARCHAR(10),
    address VARCHAR(255),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    -- Contatos
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    -- Logo
    logo_url TEXT,
    -- Fiscal
    nfce_series VARCHAR(10),
    nfe_series VARCHAR(10),
    nfse_rps_series VARCHAR(10),
    -- Programa de fidelidade
    loyalty_enabled BOOLEAN DEFAULT false,
    loyalty_points_per_real DECIMAL(5, 2) DEFAULT 1, -- ex: R$1 = 1 ponto
    -- Outros
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Clientes
CREATE INDEX idx_customers_cpf_cnpj ON customers(cpf_cnpj);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_status ON customers(status);

-- Produtos
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_ean ON products(ean);
CREATE INDEX idx_products_internal_code ON products(internal_code);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_bulk ON products(is_bulk);

-- Estoque
CREATE INDEX idx_product_stock_product ON product_stock(product_id);
CREATE INDEX idx_product_stock_location ON product_stock(location_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- Vendas
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_synced ON sales(synced);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Financeiro
CREATE INDEX idx_transactions_account ON financial_transactions(account_id);
CREATE INDEX idx_transactions_type ON financial_transactions(type);
CREATE INDEX idx_transactions_status ON financial_transactions(status);
CREATE INDEX idx_transactions_due_date ON financial_transactions(due_date);
CREATE INDEX idx_transactions_paid_date ON financial_transactions(paid_date);
CREATE INDEX idx_transactions_customer ON financial_transactions(customer_id);
CREATE INDEX idx_transactions_supplier ON financial_transactions(supplier_id);

-- Fiscal
CREATE INDEX idx_invoices_access_key ON invoices(access_key);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_sale ON invoices(sale_id);

-- Auditoria
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular saldo de conta bancária
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'paid' AND NEW.bank_account_id IS NOT NULL THEN
            UPDATE bank_accounts
            SET current_balance = current_balance + 
                CASE 
                    WHEN NEW.type = 'revenue' THEN NEW.paid_amount
                    WHEN NEW.type = 'expense' THEN -NEW.paid_amount
                END
            WHERE id = NEW.bank_account_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_balance_trigger AFTER INSERT OR UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();

-- Função para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION update_product_stock_on_movement()
RETURNS TRIGGER AS $
BEGIN
    -- Atualizar quantidade na tabela product_stock
    IF NEW.type IN ('IN', 'ADJUSTMENT') THEN
        UPDATE product_stock
        SET quantity = quantity + NEW.quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.product_id 
        AND location_id = NEW.location_id;
    ELSIF NEW.type IN ('OUT', 'LOSS') THEN
        UPDATE product_stock
        SET quantity = quantity - NEW.quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.product_id 
        AND location_id = NEW.location_id;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_trigger AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_movement();

-- =====================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View: Posição atual de estoque consolidada
CREATE VIEW v_current_stock AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.internal_code,
    p.ean,
    pc.name as category_name,
    COALESCE(SUM(ps.quantity), 0) as total_quantity,
    p.min_stock,
    p.unit,
    p.cost_price,
    p.sale_price,
    COALESCE(SUM(ps.quantity), 0) * p.cost_price as stock_value,
    CASE 
        WHEN COALESCE(SUM(ps.quantity), 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(SUM(ps.quantity), 0) <= p.min_stock THEN 'low_stock'
        ELSE 'ok'
    END as stock_status
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_stock ps ON p.id = ps.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.internal_code, p.ean, pc.name, p.min_stock, p.unit, p.cost_price, p.sale_price;

-- View: Produtos próximos ao vencimento
CREATE VIEW v_expiring_products AS
SELECT 
    pb.id as batch_id,
    p.id as product_id,
    p.name as product_name,
    pb.batch_number,
    pb.expiry_date,
    pb.quantity,
    sl.name as location_name,
    DATE_PART('day', pb.expiry_date - CURRENT_DATE) as days_until_expiry,
    CASE 
        WHEN pb.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'critical'
        WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'warning'
        WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '15 days' THEN 'attention'
        ELSE 'ok'
    END as alert_level
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
LEFT JOIN stock_locations sl ON pb.location_id = sl.id
WHERE p.is_perishable = true
AND pb.quantity > 0
AND pb.is_blocked = false
ORDER BY pb.expiry_date ASC;

-- View: Resumo financeiro diário
CREATE VIEW v_daily_financial_summary AS
SELECT 
    DATE(created_at) as date,
    SUM(CASE WHEN type = 'revenue' AND status = 'paid' THEN paid_amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN paid_amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type = 'revenue' AND status = 'paid' THEN paid_amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN paid_amount ELSE 0 END) as net_balance,
    COUNT(CASE WHEN type = 'revenue' THEN 1 END) as revenue_count,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
FROM financial_transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Top produtos mais vendidos
CREATE VIEW v_top_selling_products AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.internal_code,
    pc.name as category_name,
    COUNT(si.id) as times_sold,
    SUM(si.quantity) as total_quantity_sold,
    SUM(si.total) as total_revenue,
    SUM(si.total - (si.cost_price * si.quantity)) as total_profit,
    AVG(si.unit_price) as avg_sale_price
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE s.status = 'completed'
AND si.deleted_at IS NULL
GROUP BY p.id, p.name, p.internal_code, pc.name
ORDER BY total_revenue DESC;

-- View: Contas a pagar em atraso
CREATE VIEW v_overdue_payables AS
SELECT 
    ft.id,
    ft.description,
    ft.amount,
    ft.due_date,
    DATE_PART('day', CURRENT_DATE - ft.due_date) as days_overdue,
    s.company_name as supplier_name,
    ft.amount * (1 + COALESCE(ft.interest, 0)/100) as amount_with_interest,
    ba.name as bank_account_name
FROM financial_transactions ft
LEFT JOIN suppliers s ON ft.supplier_id = s.id
LEFT JOIN bank_accounts ba ON ft.bank_account_id = ba.id
WHERE ft.type = 'expense'
AND ft.status IN ('pending', 'partially_paid')
AND ft.due_date < CURRENT_DATE
ORDER BY ft.due_date ASC;

-- View: Inadimplentes (clientes com contas atrasadas)
CREATE VIEW v_defaulting_customers AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.phone,
    c.mobile,
    COUNT(ft.id) as overdue_invoices,
    SUM(ft.amount - ft.paid_amount) as total_debt,
    MIN(ft.due_date) as oldest_due_date,
    MAX(DATE_PART('day', CURRENT_DATE - ft.due_date)) as max_days_overdue
FROM customers c
JOIN financial_transactions ft ON c.id = ft.customer_id
WHERE ft.type = 'revenue'
AND ft.status IN ('pending', 'partially_paid', 'overdue')
AND ft.due_date < CURRENT_DATE
GROUP BY c.id, c.name, c.phone, c.mobile
ORDER BY total_debt DESC;

-- =====================================================
-- DADOS INICIAIS (SEEDS)
-- =====================================================

-- Inserir configuração padrão da empresa (será atualizada pelo usuário)
INSERT INTO company_settings (
    company_name, 
    cnpj, 
    tax_regime,
    loyalty_enabled,
    loyalty_points_per_real
) VALUES (
    'Minha Empresa - Pet Shop',
    '00.000.000/0001-00',
    'simples_nacional',
    true,
    1.0
);

-- Inserir plano de contas básico
INSERT INTO chart_of_accounts (code, name, type, is_analytical) VALUES
-- RECEITAS
('3.0', 'RECEITAS', 'revenue', false),
('3.1', 'Vendas', 'revenue', false),
('3.1.01', 'Venda de Produtos', 'revenue', true),
('3.1.02', 'Venda de Serviços', 'revenue', true),
('3.2', 'Outras Receitas', 'revenue', false),
('3.2.01', 'Juros Recebidos', 'revenue', true),
('3.2.02', 'Descontos Obtidos', 'revenue', true),

-- DESPESAS
('4.0', 'DESPESAS', 'expense', false),
('4.1', 'Despesas Operacionais', 'expense', false),
('4.1.01', 'Aluguel', 'expense', true),
('4.1.02', 'Energia Elétrica', 'expense', true),
('4.1.03', 'Água', 'expense', true),
('4.1.04', 'Internet e Telefone', 'expense', true),
('4.1.05', 'Material de Limpeza', 'expense', true),
('4.1.06', 'Material de Escritório', 'expense', true),
('4.2', 'Despesas com Pessoal', 'expense', false),
('4.2.01', 'Salários', 'expense', true),
('4.2.02', 'Encargos Sociais', 'expense', true),
('4.2.03', 'Vale Transporte', 'expense', true),
('4.2.04', 'Vale Refeição', 'expense', true),
('4.3', 'Despesas Comerciais', 'expense', false),
('4.3.01', 'Marketing e Publicidade', 'expense', true),
('4.3.02', 'Comissões', 'expense', true),
('4.4', 'Despesas Financeiras', 'expense', false),
('4.4.01', 'Juros Pagos', 'expense', true),
('4.4.02', 'Tarifas Bancárias', 'expense', true),
('4.4.03', 'Taxas de Cartão', 'expense', true),
('4.5', 'Impostos e Tributos', 'expense', false),
('4.5.01', 'Impostos sobre Vendas', 'expense', true),
('4.5.02', 'IPTU', 'expense', true),
('4.6', 'Compras', 'expense', false),
('4.6.01', 'Compra de Mercadorias', 'expense', true);

-- Inserir centro de custos padrão
INSERT INTO cost_centers (name, description) VALUES
('Loja Principal', 'Loja física - matriz'),
('Administrativo', 'Despesas administrativas e gerenciais');

-- Inserir local de estoque padrão
INSERT INTO stock_locations (name, type, is_default) VALUES
('Loja Principal', 'store', true),
('Depósito', 'warehouse', false);

-- Inserir categorias de produtos básicas
INSERT INTO product_categories (name, description) VALUES
('Rações', 'Rações para cães e gatos'),
('Acessórios', 'Coleiras, guias, camas, etc'),
('Higiene', 'Produtos de higiene e limpeza'),
('Medicamentos', 'Medicamentos veterinários'),
('Brinquedos', 'Brinquedos para pets'),
('Petiscos', 'Petiscos e snacks');

-- Inserir usuário admin padrão (senha: admin123)
-- IMPORTANTE: Alterar a senha no primeiro acesso!
INSERT INTO users (name, email, password_hash, role) VALUES
('Administrador', 'admin@petshop.com', '$2b$10$rBV2z0cGVGp8E8b5mYHGaOXKZ0Y7z5WGz3z5z5z5z5z5z5z5z5z5z', 'admin');

-- Inserir configurações do sistema
INSERT INTO system_settings (key, value, description) VALUES
('backup_frequency', '"daily"', 'Frequência de backup automático'),
('backup_time', '"03:00"', 'Horário do backup (formato 24h)'),
('backup_retention_days', '30', 'Dias de retenção de backups'),
('pdv_offline_sync_interval', '300', 'Intervalo de sincronização offline (segundos)'),
('alert_expiry_days', '[15, 7, 3]', 'Dias para alertas de validade (array)'),
('min_stock_alert_enabled', 'true', 'Habilitar alertas de estoque mínimo'),
('loyalty_enabled', 'true', 'Programa de fidelidade habilitado'),
('default_payment_terms', '"30 dias"', 'Prazo de pagamento padrão');

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE users IS 'Usuários do sistema com diferentes perfis de acesso';
COMMENT ON TABLE customers IS 'Cadastro de clientes (campos opcionais para privacidade)';
COMMENT ON TABLE products IS 'Cadastro de produtos com suporte a granel e perecíveis';
COMMENT ON TABLE product_stock IS 'Estoque atual por produto e local';
COMMENT ON TABLE stock_movements IS 'Histórico de todas as movimentações de estoque';
COMMENT ON TABLE sales IS 'Vendas realizadas (PDV online e offline)';
COMMENT ON TABLE sale_items IS 'Itens das vendas com auditoria de exclusões';
COMMENT ON TABLE financial_transactions IS 'Transações financeiras (receitas e despesas)';
COMMENT ON TABLE invoices IS 'Notas fiscais emitidas (NFC-e, NF-e, NFS-e)';
COMMENT ON TABLE audit_logs IS 'Log de auditoria de ações críticas do sistema';

COMMENT ON COLUMN products.is_bulk IS 'Indica se o produto é vendido a granel (peso variável)';
COMMENT ON COLUMN products.parent_product_id IS 'Referência ao produto "mãe" (pacote fechado que foi aberto)';
COMMENT ON COLUMN products.conversion_factor IS 'Fator de conversão (ex: 1 pacote = 15kg)';
COMMENT ON COLUMN sale_items.weight IS 'Peso do produto vendido a granel (em kg)';
COMMENT ON COLUMN sale_items.deletion_reason IS 'Justificativa obrigatória para exclusão de item';
COMMENT ON COLUMN sales.synced IS 'Indica se a venda foi sincronizada (para PDV offline)';
COMMENT ON COLUMN financial_transactions.parent_transaction_id IS 'ID da transação pai (para parcelamentos)';

-- =====================================================
-- FIM DO ESQUEMA
-- =====================================================