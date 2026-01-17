# Estratégia de Testes - ERP Pet Shop

## 📋 Visão Geral

Este documento define a estratégia de testes para garantir a qualidade e confiabilidade do sistema ERP Pet Shop.

> ⚠️ **Status Atual:** Testes ainda não implementados. Este documento serve como guia para implementação futura.

---

## 🎯 Objetivos

1. **Prevenir regressões** em funcionalidades existentes
2. **Validar lógica de negócio** crítica (cálculos, estoque, financeiro)
3. **Garantir integrações** funcionando (API, banco de dados)
4. **Documentar comportamento** esperado do sistema

---

## 🏗️ Pirâmide de Testes

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲           5% - Testes de ponta a ponta
                 ╱──────╲
                ╱        ╲
               ╱Integração╲        15% - Testes de integração
              ╱────────────╲
             ╱              ╲
            ╱   Unitários    ╲     80% - Testes unitários
           ╱──────────────────╲
```

---

## 🧪 Tipos de Teste

### 1. Testes Unitários

**Foco:** Funções isoladas, lógica de negócio pura

**Ferramentas sugeridas:**
- Jest (Node.js/React)
- Vitest (alternativa rápida para Vite)

**Exemplos de cobertura:**

| Área | O que testar |
|------|--------------|
| Cálculos | Troco, desconto, margem, custo médio |
| Validações | CPF/CNPJ, email, datas |
| Formatação | Moeda, datas, máscaras |
| Utils | Funções auxiliares |

**Exemplo de teste:**

```typescript
// utils/format.test.ts
import { formatCurrency, formatCPF } from './format';

describe('formatCurrency', () => {
  it('should format number to BRL currency', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});

describe('formatCPF', () => {
  it('should format 11 digits to CPF mask', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });
});
```

### 2. Testes de Integração

**Foco:** Interação entre componentes, API + banco de dados

**Ferramentas sugeridas:**
- Jest + Supertest (API)
- Prisma + banco de teste

**Exemplos de cobertura:**

| Área | O que testar |
|------|--------------|
| API | Endpoints CRUD |
| Autenticação | Login, token, permissões |
| Transações | Venda completa, estoque |

**Exemplo de teste:**

```typescript
// controllers/product.controller.test.ts
import request from 'supertest';
import app from '../server';

describe('Products API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login para obter token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'test123' });
    authToken = res.body.token;
  });

  it('should list all products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Ração Premium 15kg',
        sku: 'RAC-PREM-15',
        price: 189.90,
        cost: 120.00,
        stock: 50
      });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Ração Premium 15kg');
  });
});
```

### 3. Testes E2E (End-to-End)

**Foco:** Fluxos completos do usuário

**Ferramentas sugeridas:**
- Playwright
- Cypress

**Exemplos de cobertura:**

| Fluxo | Passos |
|-------|--------|
| Venda completa | Login → Adicionar produtos → Pagamento → Finalizar |
| Cadastro de produto | Login → Produtos → Novo → Preencher → Salvar |
| Abertura/Fechamento de caixa | Login → PDV → Abrir caixa → Vendas → Fechar caixa |

**Exemplo de teste:**

```typescript
// e2e/sale.spec.ts
import { test, expect } from '@playwright/test';

test('complete sale flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'caixa@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  // Navegar para PDV
  await page.click('text=PDV');
  
  // Adicionar produto
  await page.fill('[data-testid="product-search"]', 'Ração');
  await page.click('[data-testid="product-item"]:first-child');
  
  // Verificar carrinho
  await expect(page.locator('[data-testid="cart-total"]')).toContainText('R$');
  
  // Finalizar venda
  await page.click('[data-testid="btn-checkout"]');
  await page.click('[data-testid="payment-cash"]');
  await page.fill('[data-testid="amount-received"]', '200');
  await page.click('[data-testid="btn-confirm-sale"]');
  
  // Verificar sucesso
  await expect(page.locator('[data-testid="sale-success"]')).toBeVisible();
});
```

---

## 📁 Estrutura de Diretórios

```
backend/
├── src/
│   ├── controllers/
│   ├── utils/
│   └── ...
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   └── controllers/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   └── setup.ts

erp-petshop/
├── src/
│   ├── components/
│   ├── utils/
│   └── ...
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   └── components/
│   └── e2e/
│       └── flows/
```

---

## ⚙️ Configuração

### Jest (Backend)

```javascript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/generated/**'
  ]
};
```

### Vitest (Frontend)

```typescript
// erp-petshop/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts'
  }
});
```

---

## 🎯 Cobertura Mínima

| Área | Meta |
|------|------|
| Cálculos financeiros | 100% |
| Operações de estoque | 90% |
| Validações | 90% |
| API endpoints | 80% |
| Componentes UI | 60% |
| **Global** | **70%** |

---

## 🔄 CI/CD (Planejado)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📝 Boas Práticas

1. **Escreva testes primeiro** (TDD) para lógica crítica
2. **Nomeie descritivamente** - "should calculate discount correctly"
3. **Um assert por teste** quando possível
4. **Dados de teste isolados** - não dependa de dados existentes
5. **Testes independentes** - não dependa de ordem de execução
6. **Mock serviços externos** - APIs, banco de dados em testes unitários

---

## 🚀 Próximos Passos

1. [ ] Configurar Jest no backend
2. [ ] Configurar Vitest no frontend
3. [ ] Criar testes para funções de cálculo (troco, margem)
4. [ ] Criar testes para validações (CPF, CNPJ)
5. [ ] Criar testes de integração para API de vendas
6. [ ] Configurar CI para rodar testes em PRs

---

*Última atualização: Janeiro 2026*
