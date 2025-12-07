-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "supplier_id" UUID,
    "category_id" UUID,
    "payment_date" DATE,
    "total_paid" DECIMAL(15,2) DEFAULT 0,
    "recurrence" VARCHAR(20),
    "installments" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) DEFAULT 0,
    "tax_rate" DECIMAL(5,2) DEFAULT 0,
    "due_date" DATE NOT NULL,
    "paid_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "customer_id" UUID,
    "sale_id" UUID,
    "installment_number" INTEGER,
    "total_installments" INTEGER,
    "payment_method" VARCHAR(50),
    "payment_config_id" UUID,
    "origin_type" VARCHAR(20) DEFAULT 'sale',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "description" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "bank_code" VARCHAR(10),
    "agency" VARCHAR(20),
    "account_number" VARCHAR(20),
    "account_type" VARCHAR(20),
    "initial_balance" DECIMAL(10,2) DEFAULT 0,
    "current_balance" DECIMAL(10,2) DEFAULT 0,
    "pix_enabled" BOOLEAN DEFAULT false,
    "pix_key" VARCHAR(255),
    "pix_api_credentials" JSONB,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_account_id" UUID NOT NULL,
    "transaction_id" UUID,
    "bank_transaction_date" DATE NOT NULL,
    "bank_description" TEXT,
    "bank_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending',
    "reconciled_by" UUID,
    "reconciled_at" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cash_register_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "terminal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "opened_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(6),
    "opening_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(10,2),
    "expected_balance" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "status" VARCHAR(20) DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "parent_id" UUID,
    "is_analytical" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_name" VARCHAR(255) NOT NULL,
    "trade_name" VARCHAR(255),
    "cnpj" VARCHAR(18) NOT NULL,
    "state_registration" VARCHAR(50),
    "municipal_registration" VARCHAR(50),
    "tax_regime" VARCHAR(50),
    "zip_code" VARCHAR(10),
    "address" VARCHAR(255),
    "number" VARCHAR(20),
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "logo_url" TEXT,
    "nfce_series" VARCHAR(10),
    "nfe_series" VARCHAR(10),
    "nfse_rps_series" VARCHAR(10),
    "loyalty_enabled" BOOLEAN DEFAULT false,
    "loyalty_points_per_real" DECIMAL(5,2) DEFAULT 1,
    "cashback_enabled" BOOLEAN DEFAULT false,
    "cashback_percentage" DECIMAL(5,2) DEFAULT 0,
    "cashback_expire_days" INTEGER DEFAULT 90,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "cpf_cnpj" VARCHAR(18),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "mobile" VARCHAR(20),
    "birth_date" DATE,
    "zip_code" VARCHAR(10),
    "address" VARCHAR(255),
    "number" VARCHAR(20),
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "credit_limit" DECIMAL(10,2) DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'active',
    "loyalty_points" INTEGER DEFAULT 0,
    "wallet_balance" DECIMAL(10,2) DEFAULT 0,
    "total_spent" DECIMAL(10,2) DEFAULT 0,
    "last_purchase_at" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "sale_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_certificates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(10),
    "certificate_file" BYTEA,
    "password_encrypted" VARCHAR(255),
    "issued_by" VARCHAR(255),
    "valid_from" DATE NOT NULL,
    "valid_until" DATE NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20) DEFAULT '#6B7280',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(20) NOT NULL,
    "account_id" UUID,
    "cost_center_id" UUID,
    "bank_account_id" UUID,
    "customer_id" UUID,
    "supplier_id" UUID,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_date" DATE,
    "status" VARCHAR(20) DEFAULT 'pending',
    "payment_method" VARCHAR(50),
    "payment_config_id" UUID,
    "installment_number" INTEGER,
    "total_installments" INTEGER,
    "parent_transaction_id" UUID,
    "interest" DECIMAL(10,2) DEFAULT 0,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "paid_amount" DECIMAL(10,2) DEFAULT 0,
    "is_recurring" BOOLEAN DEFAULT false,
    "recurrence_frequency" VARCHAR(20),
    "document_type" VARCHAR(50),
    "document_number" VARCHAR(100),
    "attachment_path" TEXT,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "notes" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "account_payable_id" UUID,
    "date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "category" VARCHAR(100),

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_series" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(20) NOT NULL,
    "series" VARCHAR(10) NOT NULL,
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "location_id" UUID,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(20) NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "series" VARCHAR(10) NOT NULL,
    "access_key" VARCHAR(44),
    "status" VARCHAR(30) DEFAULT 'pending',
    "issuer_cnpj" VARCHAR(18) NOT NULL,
    "issuer_name" VARCHAR(255) NOT NULL,
    "recipient_type" VARCHAR(20),
    "recipient_id" UUID,
    "recipient_cpf_cnpj" VARCHAR(18),
    "recipient_name" VARCHAR(255),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "icms_total" DECIMAL(10,2) DEFAULT 0,
    "ipi_total" DECIMAL(10,2) DEFAULT 0,
    "authorization_protocol" VARCHAR(50),
    "authorization_date" TIMESTAMP(6),
    "sefaz_response" TEXT,
    "cancelled_at" TIMESTAMP(6),
    "cancellation_protocol" VARCHAR(50),
    "cancellation_reason" TEXT,
    "xml_file" BYTEA,
    "pdf_path" TEXT,
    "sale_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "reference_id" UUID,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" VARCHAR(50) DEFAULT 'Default',
    "payment_type" VARCHAR(50) NOT NULL,
    "installments_min" INTEGER DEFAULT 1,
    "installments_max" INTEGER DEFAULT 1,
    "fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "days_to_liquidate" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "bank_account_id" UUID,
    "days_to_liquidate" INTEGER NOT NULL DEFAULT 1,
    "receivable_mode" VARCHAR(20) DEFAULT 'immediate',
    "flat_fee_percent" DECIMAL(5,2) DEFAULT 0,
    "max_installments" INTEGER DEFAULT 1,
    "installment_fees" JSONB,
    "color" VARCHAR(20) DEFAULT '#3b82f6',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdv_terminals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "location_id" UUID,
    "serial_number" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "is_active" BOOLEAN DEFAULT true,
    "last_sync_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdv_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "species" VARCHAR(50),
    "breed_id" UUID,
    "breed" VARCHAR(100),
    "size" VARCHAR(20),
    "coat_type" VARCHAR(20),
    "behavior_flags" JSONB,
    "gender" VARCHAR(10),
    "birth_date" DATE,
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_species" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "batch_number" VARCHAR(100) NOT NULL,
    "manufacture_date" DATE,
    "expiry_date" DATE,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "location_id" UUID,
    "is_blocked" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "parent_id" UUID,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_stock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "reserved_quantity" DECIMAL(10,3) DEFAULT 0,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID,
    "supplier_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(100),
    "internal_code" VARCHAR(100),
    "ean" VARCHAR(13),
    "sku" VARCHAR(100),
    "cost_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "profit_margin" DECIMAL(5,2),
    "stock_quantity" DECIMAL(10,3) DEFAULT 0,
    "min_stock" DECIMAL(10,3) DEFAULT 0,
    "max_stock" DECIMAL(10,3),
    "unit" VARCHAR(20) DEFAULT 'UN',
    "is_bulk" BOOLEAN DEFAULT false,
    "parent_product_id" UUID,
    "conversion_factor" DECIMAL(10,3),
    "is_perishable" BOOLEAN DEFAULT false,
    "shelf_life_days" INTEGER,
    "track_by_batch" BOOLEAN DEFAULT false,
    "ncm" VARCHAR(8),
    "cest" VARCHAR(7),
    "cfop" VARCHAR(4) DEFAULT '5102',
    "icms_rate" DECIMAL(5,2),
    "ipi_rate" DECIMAL(5,2),
    "pis_rate" DECIMAL(5,2),
    "cofins_rate" DECIMAL(5,2),
    "image_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "last_cost" DECIMAL DEFAULT 0,
    "average_cost" DECIMAL DEFAULT 0,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID,
    "user_id" UUID NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valid_until" DATE NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending',
    "converted_to_sale_id" UUID,
    "converted_at" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sale_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "batch_id" UUID,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "weight" DECIMAL(10,3),
    "barcode_generated" VARCHAR(13),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sale_id" UUID NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "card_brand" VARCHAR(50),
    "card_last_digits" VARCHAR(4),
    "installments" INTEGER DEFAULT 1,
    "authorization_code" VARCHAR(100),
    "pix_qrcode" TEXT,
    "pix_txid" VARCHAR(100),
    "pix_e2eid" VARCHAR(100),
    "pix_status" VARCHAR(20),
    "pix_confirmed_at" TIMESTAMP(6),
    "change_amount" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sale_number" VARCHAR(50) NOT NULL,
    "terminal_id" UUID,
    "cash_register_id" UUID,
    "customer_id" UUID,
    "user_id" UUID NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'completed',
    "cancelled_reason" TEXT,
    "cancelled_by" UUID,
    "cancelled_at" TIMESTAMP(6),
    "invoice_type" VARCHAR(20),
    "invoice_number" VARCHAR(50),
    "invoice_series" VARCHAR(10),
    "invoice_key" VARCHAR(44),
    "invoice_xml_path" TEXT,
    "invoice_pdf_path" TEXT,
    "invoice_issued_at" TIMESTAMP(6),
    "synced" BOOLEAN DEFAULT false,
    "sync_errors" TEXT,
    "loyalty_points_earned" INTEGER DEFAULT 0,
    "loyalty_points_redeemed" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50),
    "address" TEXT,
    "is_default" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "batch_id" UUID,
    "location_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(255),
    "user_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_name" VARCHAR(255) NOT NULL,
    "trade_name" VARCHAR(255),
    "cnpj" VARCHAR(18) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "mobile" VARCHAR(20),
    "website" VARCHAR(255),
    "zip_code" VARCHAR(10),
    "address" VARCHAR(255),
    "number" VARCHAR(20),
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "payment_terms" VARCHAR(100),
    "discount_for_early_payment" DECIMAL(5,2),
    "average_delivery_days" INTEGER,
    "rating" DECIMAL(3,2),
    "status" VARCHAR(20) DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14),
    "phone" VARCHAR(20),
    "role" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_groomer" BOOLEAN DEFAULT false,
    "seniority_level" VARCHAR(20),
    "speed_factor" DECIMAL(3,2) DEFAULT 1.0,
    "commission_rate" DECIMAL(5,2) DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_breeds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "species_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "size" VARCHAR(5),
    "coat_type" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_breeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_matrix" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "breed_size" VARCHAR(5) NOT NULL,
    "coat_type" VARCHAR(20) NOT NULL,
    "base_duration" INTEGER NOT NULL DEFAULT 30,
    "price_adder" DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT "service_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIMESTAMP(6) NOT NULL,
    "end_time" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "total_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "conditions" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "professional_id" UUID,
    "price" DECIMAL(10,2) NOT NULL,
    "commission_rate_snapshot" DECIMAL(5,2),
    "calculated_commission" DECIMAL(10,2) DEFAULT 0,
    "commission_status" VARCHAR(20) DEFAULT 'pending',
    "commission_paid_at" TIMESTAMP(6),
    "commission_transaction_id" UUID,

    CONSTRAINT "appointment_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),

    CONSTRAINT "appointment_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_receivables_customer" ON "accounts_receivable"("customer_id");

-- CreateIndex
CREATE INDEX "idx_receivables_due_date" ON "accounts_receivable"("due_date");

-- CreateIndex
CREATE INDEX "idx_receivables_sale" ON "accounts_receivable"("sale_id");

-- CreateIndex
CREATE INDEX "idx_receivables_status" ON "accounts_receivable"("status");

-- CreateIndex
CREATE INDEX "idx_audit_logs_date" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_code_key" ON "chart_of_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_cnpj_key" ON "company_settings"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_name_key" ON "cost_centers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cpf_cnpj_key" ON "customers"("cpf_cnpj");

-- CreateIndex
CREATE INDEX "idx_customers_cpf_cnpj" ON "customers"("cpf_cnpj");

-- CreateIndex
CREATE INDEX "idx_customers_phone" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "idx_customers_status" ON "customers"("status");

-- CreateIndex
CREATE INDEX "idx_wallet_customer" ON "wallet_transactions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_transactions_account" ON "financial_transactions"("account_id");

-- CreateIndex
CREATE INDEX "idx_transactions_customer" ON "financial_transactions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_transactions_due_date" ON "financial_transactions"("due_date");

-- CreateIndex
CREATE INDEX "idx_transactions_paid_date" ON "financial_transactions"("paid_date");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "financial_transactions"("status");

-- CreateIndex
CREATE INDEX "idx_transactions_supplier" ON "financial_transactions"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_transactions_type" ON "financial_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_series_type_series_key" ON "invoice_series"("type", "series");

-- CreateIndex
CREATE INDEX "idx_invoices_access_key" ON "invoices"("access_key");

-- CreateIndex
CREATE INDEX "idx_invoices_sale" ON "invoices"("sale_id");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_payment_config_type" ON "payment_methods_config"("type");

-- CreateIndex
CREATE INDEX "idx_payment_config_active" ON "payment_methods_config"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pet_species_name_key" ON "pet_species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_product_id_batch_number_key" ON "product_batches"("product_id", "batch_number");

-- CreateIndex
CREATE INDEX "idx_product_stock_location" ON "product_stock"("location_id");

-- CreateIndex
CREATE INDEX "idx_product_stock_product" ON "product_stock"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_stock_product_id_location_id_key" ON "product_stock"("product_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_internal_code_key" ON "products"("internal_code");

-- CreateIndex
CREATE INDEX "idx_products_active" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "idx_products_bulk" ON "products"("is_bulk");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_ean" ON "products"("ean");

-- CreateIndex
CREATE INDEX "idx_products_internal_code" ON "products"("internal_code");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quote_number_key" ON "quotes"("quote_number");

-- CreateIndex
CREATE INDEX "idx_sale_items_product" ON "sale_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_sale_items_sale" ON "sale_items"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sale_number_key" ON "sales"("sale_number");

-- CreateIndex
CREATE INDEX "idx_sales_customer" ON "sales"("customer_id");

-- CreateIndex
CREATE INDEX "idx_sales_date" ON "sales"("created_at");

-- CreateIndex
CREATE INDEX "idx_sales_status" ON "sales"("status");

-- CreateIndex
CREATE INDEX "idx_sales_synced" ON "sales"("synced");

-- CreateIndex
CREATE INDEX "idx_sales_user" ON "sales"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_name_key" ON "stock_locations"("name");

-- CreateIndex
CREATE INDEX "idx_stock_movements_date" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_product" ON "stock_movements"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "service_matrix_service_id_breed_size_coat_type_key" ON "service_matrix"("service_id", "breed_size", "coat_type");

-- CreateIndex
CREATE INDEX "appointments_start_time_idx" ON "appointments"("start_time");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_payment_config_id_fkey" FOREIGN KEY ("payment_config_id") REFERENCES "payment_methods_config"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_reconciled_by_fkey" FOREIGN KEY ("reconciled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pdv_terminals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_payment_config_id_fkey" FOREIGN KEY ("payment_config_id") REFERENCES "payment_methods_config"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_parent_transaction_id_fkey" FOREIGN KEY ("parent_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_series" ADD CONSTRAINT "invoice_series_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_methods_config" ADD CONSTRAINT "payment_methods_config_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pdv_terminals" ADD CONSTRAINT "pdv_terminals_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "pet_breeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_parent_product_id_fkey" FOREIGN KEY ("parent_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_to_sale_id_fkey" FOREIGN KEY ("converted_to_sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pdv_terminals"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_matrix" ADD CONSTRAINT "service_matrix_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_resources" ADD CONSTRAINT "appointment_resources_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_resources" ADD CONSTRAINT "appointment_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
