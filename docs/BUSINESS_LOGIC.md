# 🧠 Lógica de Negócio - ERP Pet Shop

**Para consultar estrutura do banco:** Ver [database_architecture.md](file:///c:/Users/iruka/.gemini/antigravity/brain/7ef700dd-1435-475a-b006-93f4b17443f0/database_architecture.md)

---

## 📦 1. Venda Completa (PDV)

### Fluxo Implementado

**Endpoint:** `POST /api/sales`

**Entrada:**
```json
{
  "items": [
    { "product_id": "uuid", "quantity": 2, "unit_price": 50.00 }
  ],
  "payment_method": "debit_card",
  "discount_amount": 5.00
}
```

**Lógica (Transação Atômica):**

```javascript
BEGIN TRANSACTION;

// 1. Calcular totais
subtotal = SUM(item.quantity * item.unit_price);
total = subtotal - discount_amount;

// 2. Criar venda
INSERT INTO sales (sale_number, subtotal, discount, total, status, user_id)
VALUES (auto_increment, subtotal, discount_amount, total, 'completed', user_id);

// 3. Para CADA produto vendido:
FOR EACH item IN items:
  
  // 3.1. Inserir item da venda
  INSERT INTO sale_items (
    sale_id, product_id, quantity, unit_price, 
    disdiscount, total
  );
  
  // 3.2. ABATER ESTOQUE (baixa automática)
  UPDATE products 
  SET stock_quantity = stock_quantity - item.quantity
  WHERE id = item.product_id;
  
  // 3.3. Registrar movimentação de saída
  INSERT INTO stock_movements (
    product_id, type, quantity, 
    reference_type, reference_id, created_at
  ) VALUES (
    item.product_id, 'out', -item.quantity,
    'sale', sale.id, NOW()
  );

// 4. Registrar pagamento
INSERT INTO sale_payments (
  sale_id, payment_method, amount
) VALUES (sale.id, payment_method, total);

COMMIT;
```

**✅ Implementado:** Backend `POST /api/sales` (linhas ~90-177 do `index.js`)

**✅ Frontend:** POS.tsx (PDV completo)

---

## 💰 2. Múltiplos Pagamentos (Futuro)

**Caso de uso:** Cliente paga R$50 em dinheiro + R$50 no cartão.

**Entrada:**
```json
{
  "items": [...],
  "payments": [
    { "method": "cash", "amount": 50.00 },
    { "method": "debit_card", "amount": 50.00 }
  ]
}
```

**Lógica:**
```javascript
// Validar que SUM(payments.amount) === total
if (SUM(payments) !== total) {
  throw new Error('Soma dos pagamentos diverge do total');
}

// Inserir múltiplos registros em sale_payments
FOR EACH payment IN payments:
  INSERT INTO sale_payments (sale_id, payment_method, amount)
  VALUES (sale.id, payment.method, payment.amount);
```

**⚠️ Pendente:** Modificar endpoint `POST /api/sales` para aceitar array de pagamentos.

---

## 📥 3. Entrada de Estoque

### Fluxo Planejado

**Endpoint:** `POST /api/stock-movements` (a criar)

**Entrada:**
```json
{
  "product_id": "uuid",
  "type": "in",
  "quantity": 50,
  "cost_price": 25.50,
  "notes": "Compra fornecedor XYZ - NF 12345"
}
```

**Lógica (Transação Atômica + Cálculo de Custo Médio):**

```javascript
BEGIN TRANSACTION;

// 1. Buscar produto atual
SELECT stock_quantity, average_cost, sale_price, profit_margin
FROM products WHERE id = product_id;

const oldStock = product.stock_quantity || 0;
const oldAvgCost = product.average_cost || 0;

// 2. Calcular NOVO custo médio ponderado
let newAvgCost;
if (oldStock === 0) {
  // Se estoque zerado, custo médio = custo da entrada
  newAvgCost = cost_price;
} else {
  // Fórmula: ((Qtd_Antiga * Custo_Antigo) + (Qtd_Nova * Custo_Novo)) / (Qtd_Total)
  newAvgCost = (
    (oldStock * oldAvgCost) + (quantity * cost_price)
  ) / (oldStock + quantity);
}

// 3. Calcular margem ATUAL com novo custo
const currentMargin = ((sale_price - newAvgCost) / sale_price) * 100;
const targetMargin = product.profit_margin || 50;

// 4. Registrar movimentação
INSERT INTO stock_movements (
  product_id, type, quantity, cost_price,
  reference_type, user_id, notes, created_at
) VALUES (
  product_id, 'in', quantity, cost_price,
  'manual_entry', user_id, notes, NOW()
);

// 5. Atualizar produto
UPDATE products SET
  stock_quantity = stock_quantity + quantity,
  last_cost = cost_price,
  average_cost = newAvgCost,
  updated_at = NOW()
WHERE id = product_id;

// 6. Verificar margem e alertar se necessário
if (currentMargin < targetMargin) {
  // Calcular preço sugerido para manter margem
  const suggestedPrice = newAvgCost / (1 - (targetMargin / 100));
  
  COMMIT;
  
  // Retornar alerta de margem
  return {
    success: true,
    margin_alert: true,
    product_name: product.name,
    current_price: sale_price,
    new_cost: newAvgCost,
    current_margin: currentMargin.toFixed(2),
    target_margin: targetMargin,
    suggested_price: suggestedPrice,
    message: `Margem caiu para ${currentMargin.toFixed(1)}%. Sugerimos R$ ${suggestedPrice.toFixed(2)} para manter ${targetMargin}% de margem.`
  };
}

COMMIT;
return { success: true, margin_alert: false };
```

**⚠️ Pendente:** Implementar endpoint completo.

---

## ❌ 4. Cancelamento de Venda

### Fluxo Planejado

**Endpoint:** `POST /api/sales/:id/cancel` (a criar)

**Entrada:**
```json
{
  "reason": "Motivo obrigatório do cancelamento"
}
```

**Lógica (Estorno de Estoque):**

```javascript
BEGIN TRANSACTION;

// 1. Buscar venda
SELECT * FROM sales WHERE id = sale_id;

if (sale.status === 'cancelled') {
  throw new Error('Venda já está cancelada');
}

// 2. Buscar itens da venda
SELECT product_id, quantity FROM sale_items WHERE sale_id = sale_id;

// 3. Para CADA item, ESTORNAR ESTOQUE
FOR EACH item IN sale_items:
  
  // Devolver quantidade ao estoque
  UPDATE products
  SET stock_quantity = stock_quantity + item.quantity
  WHERE id = item.product_id;
  
  // Registrar movimentação de estorno
  INSERT INTO stock_movements (
    product_id, type, quantity,
    reference_type, reference_id, notes, created_at
  ) VALUES (
    item.product_id, 'in', item.quantity,
    'sale_cancellation', sale_id,
    'Estorno de venda cancelada', NOW()
  );

// 4. Marcar venda como cancelada
UPDATE sales SET
  status = 'cancelled',
  cancelled_reason = reason,
  cancelled_by = user_id,
  cancelled_at = NOW()
WHERE id = sale_id;

// 5. Registrar em audit_logs (se existir)
INSERT INTO audit_logs (
  entity_type, entity_id, action, user_id, details
) VALUES (
  'sale', sale_id, 'cancel', user_id, 
  JSON_BUILD_OBJECT('reason', reason)
);

COMMIT;
```

**⚠️ Pendente:** Implementar endpoint.

---

## 📊 5. Estatísticas e Dashboard

### Endpoint: GET /api/statistics/summary

**Lógica:**

```sql
-- 1. Vendas de hoje
SELECT 
  COUNT(*) as count,
  COALESCE(SUM(total), 0) as total
FROM sales
WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  AND status = 'completed';

-- 2. Produtos com baixo estoque
SELECT COUNT(*) as low_stock_count
FROM products
WHERE stock_quantity <= min_stock AND stock_quantity > 0;

-- 3. Produtos sem estoque
SELECT COUNT(*) as out_of_stock_count
FROM products
WHERE stock_quantity = 0;
```

**⚠️ Pendente:** Criar endpoint.

---

### Endpoint: GET /api/statistics/top-products

**Lógica:**

```sql
SELECT 
  p.name as product_name,
  SUM(si.quantity) as total_sold,
  SUM(si.total) as revenue
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
WHERE s.created_at >= NOW() - INTERVAL '7 days'
  AND s.status = 'completed'
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 5;
```

**⚠️ Pendente:** Criar endpoint.

---

## 📐 Fórmulas Importantes

### Custo Médio Ponderado

```javascript
novo_custo_medio = (
  (estoque_atual * custo_medio_atual) + (entrada_qtd * entrada_custo)
) / (estoque_atual + entrada_qtd)
```

### Margem de Lucro

```javascript
// Margem Percentual
margem = ((preco_venda - custo_medio) / preco_venda) * 100

// Preço Sugerido para manter margem
preco_sugerido = custo_medio / (1 - (margem_desejada / 100))
```

**Exemplo:**
- Custo médio: R$ 15,00
- Margem desejada: 50%
- Preço sugerido: `15 / (1 - 0.5)` = **R$ 30,00**

---

## 🔗 Endpoints Implementados

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| GET | `/api/health` | Health check | ✅ |
| GET | `/api/products` | Listar produtos | ✅ |
| POST | `/api/products` | Criar produto | ✅ |
| PUT | `/api/products/:id` | Atualizar produto | ✅ |
| DELETE | `/api/products/:id` | Deletar produto (soft) | ✅ |
| GET | `/api/categories` | Listar categorias | ✅ |
| POST | `/api/sales` | Criar venda | ✅ |
| GET | `/api/sales` | Listar vendas | ✅ |
| GET | `/api/sales/:id` | Detalhes de venda | ⚠️ Pendente |
| POST | `/api/sales/:id/cancel` | Cancelar venda | ⚠️ Pendente |
| POST | `/api/stock-movements` | Entrada de estoque | ⚠️ Pendente |
| GET | `/api/stock-movements` | Histórico movimentações | ⚠️ Pendente |
| GET | `/api/statistics/summary` | Dashboard: resumo | ⚠️ Pendente |
| GET | `/api/statistics/top-products` | Top produtos vendidos | ⚠️ Pendente |

---

💾 **Este documento será atualizado conforme sistema evolui.**
