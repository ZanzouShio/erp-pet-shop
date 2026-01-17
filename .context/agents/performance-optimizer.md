---
name: Performance Optimizer
description: Identify and fix performance bottlenecks in ERP Pet Shop
status: filled
generated: 2026-01-17
---

# Performance Optimizer Agent Playbook

## 🎯 Mission

O Performance Optimizer é responsável por identificar gargalos de performance, otimizar tempo de resposta da API, carregamento do frontend e comunicação com o Hardware Service.

---

## 📊 Métricas Atuais

### Targets

| Métrica | Target | Status |
|---------|--------|--------|
| API Response (p95) | < 200ms | ✅ |
| Page Load | < 2s | ✅ |
| Hardware Service | < 100ms | ✅ |
| Time to Interactive | < 3s | ⚠️ Verificar |

### Como Medir

```bash
# Backend - tempo de resposta
# Adicionar middleware de logging

# Frontend - DevTools
# Performance tab → Lighthouse

# Hardware Service
# Medir roundtrip de WebSocket
```

---

## 🔍 Áreas de Otimização

### 1. Backend (API)

#### Queries N+1

**Problema:**
```javascript
// ❌ N+1 queries
const sales = await prisma.sale.findMany();
for (const sale of sales) {
  sale.items = await prisma.saleItem.findMany({ where: { sale_id: sale.id } });
}
```

**Solução:**
```javascript
// ✅ Include relacionamentos
const sales = await prisma.sale.findMany({
  include: {
    items: {
      include: {
        product: true
      }
    },
    customer: true
  }
});
```

#### Índices do Banco

```sql
-- Índices recomendados
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
```

#### Paginação

```javascript
// ✅ Sempre paginar listas grandes
const products = await prisma.product.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { name: 'asc' }
});
```

---

### 2. Frontend (React)

#### Lazy Loading

```typescript
// ✅ Carregar páginas sob demanda
const POS = lazy(() => import('./pages/POS'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

// No Router
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/pos" element={<POS />} />
  </Routes>
</Suspense>
```

#### Memoização

```typescript
// ✅ Evitar re-renders desnecessários
const ProductCard = memo(({ product, onSelect }) => {
  return (
    <div onClick={() => onSelect(product)}>
      {product.name} - R$ {product.price}
    </div>
  );
});

// ✅ useMemo para cálculos pesados
const totalCart = useMemo(() => {
  return cartItems.reduce((sum, item) => sum + item.total, 0);
}, [cartItems]);

// ✅ useCallback para funções passadas como props
const handleAddToCart = useCallback((product) => {
  setCart(prev => [...prev, product]);
}, []);
```

#### Debounce em Buscas

```typescript
// ✅ Debounce para evitar requisições excessivas
const debouncedSearch = useMemo(
  () => debounce((query) => searchProducts(query), 300),
  []
);

const handleSearchChange = (e) => {
  setQuery(e.target.value);
  debouncedSearch(e.target.value);
};
```

---

### 3. Hardware Service

#### Conexão WebSocket

```typescript
// ✅ Reconexão automática
const useHardware = () => {
  const wsRef = useRef<WebSocket | null>(null);
  
  const connect = useCallback(() => {
    wsRef.current = new WebSocket('ws://localhost:3002');
    
    wsRef.current.onclose = () => {
      // Reconectar após 3 segundos
      setTimeout(connect, 3000);
    };
  }, []);
  
  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);
};
```

#### Timeout em Comandos

```typescript
// ✅ Timeout para evitar travamento
const sendCommand = (action: string, data?: any) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, 5000);
    
    ws.send(JSON.stringify({ action, data }));
    
    ws.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(JSON.parse(event.data));
    };
  });
};
```

---

## 🛠️ Ferramentas de Profiling

### Backend

```javascript
// Middleware de timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 200) {
      console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
  });
  next();
});
```

### Frontend

```typescript
// React DevTools Profiler
// Chrome DevTools → Performance tab

// Medir tempo de componente
console.time('ProductList render');
// ... render
console.timeEnd('ProductList render');
```

### Prisma

```bash
# Ver queries geradas
DEBUG="prisma:query" npm run dev
```

---

## 📋 Checklist de Otimização

### Antes de Otimizar

- [ ] Medir performance atual
- [ ] Identificar gargalo real (não assumir)
- [ ] Definir meta de melhoria

### Durante

- [ ] Fazer uma mudança por vez
- [ ] Medir após cada mudança
- [ ] Manter código legível

### Depois

- [ ] Documentar melhorias
- [ ] Adicionar métricas de monitoramento
- [ ] Criar alerta para regressões

---

## 🚨 Red Flags de Performance

| Sintoma | Possível Causa | Solução |
|---------|----------------|---------|
| API lenta em listagens | N+1 queries | Include/Join |
| API lenta em buscas | Falta de índice | Adicionar índice |
| Frontend lento inicial | Bundle grande | Code splitting |
| Re-renders excessivos | Props instáveis | Memoização |
| WebSocket lento | Rede/Firewall | Verificar conexão |
| Impressão demorada | Buffer cheio | Limpar buffer |

---

## 📈 Otimizações Prioritárias

### Alta Prioridade

| Área | Ação | Impacto |
|------|------|---------|
| PDV - Busca de produto | Índice em barcode/sku | Alto |
| Listagem de vendas | Include items/customer | Alto |
| Dashboard | Cache de totais | Médio |

### Média Prioridade

| Área | Ação | Impacto |
|------|------|---------|
| Relatórios | Paginação | Médio |
| Estoque | Índice em produto | Médio |
| Login | JWT validation cache | Baixo |

---

## 📖 Documentação de Referência

- [Architecture](../docs/architecture.md)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Prisma Performance](https://www.prisma.io/docs/concepts/components/prisma-client/query-optimization)

---

## 🤝 Colaboração

| Quando | Colaborar com |
|--------|---------------|
| Otimização de queries | Database Specialist |
| Refatoração | Refactoring Specialist |
| Frontend | Frontend Specialist |
| Arquitetura | Architect Specialist |

---

*Última atualização: Janeiro 2026*
