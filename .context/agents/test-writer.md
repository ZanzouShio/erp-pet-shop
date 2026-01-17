---
name: Test Writer
description: Write comprehensive unit and integration tests for ERP Pet Shop
status: filled
generated: 2026-01-17
---

# Test Writer Agent Playbook

## 🎯 Mission

O Test Writer é responsável por garantir a qualidade do código através de testes automatizados. Este agente deve criar testes que validam o comportamento correto do sistema, previnem regressões e documentam o uso esperado das funcionalidades.

---

## 🧪 Estratégia de Testes

### Pirâmide de Testes

```
                 ╱╲
                ╱  ╲
               ╱ E2E╲         (poucos - críticos)
              ╱──────╲
             ╱        ╲
            ╱Integration╲     (médio - fluxos)
           ╱────────────╲
          ╱              ╲
         ╱     Unit       ╲   (muitos - funções)
        ╱──────────────────╲
```

| Tipo | Quantidade | Foco | Ferramentas |
|------|------------|------|-------------|
| **Unit** | Muitos | Funções isoladas, utils, helpers | Jest, Vitest |
| **Integration** | Médio | Fluxos de dados, API endpoints | Supertest, Prisma mock |
| **E2E** | Poucos | Fluxos críticos do usuário | Playwright, Cypress |

---

## 📁 Estrutura de Arquivos de Teste

### Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── sale.controller.js
│   │   └── __tests__/
│   │       └── sale.controller.test.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── __tests__/
│   │       └── validators.test.js
│   └── services/
│       └── __tests__/
└── jest.config.js
```

### Frontend

```
erp-petshop/
├── src/
│   ├── components/
│   │   ├── CustomerSearch.tsx
│   │   └── __tests__/
│   │       └── CustomerSearch.test.tsx
│   ├── hooks/
│   │   ├── useCashRegister.ts
│   │   └── __tests__/
│   │       └── useCashRegister.test.ts
│   └── utils/
│       └── __tests__/
└── vitest.config.ts
```

---

## ✅ Convenções de Nomenclatura

### Arquivos de Teste

```
[nome-do-arquivo].test.ts    # Para unit tests
[nome-do-arquivo].spec.ts    # Para integration tests
[fluxo].e2e.ts               # Para E2E tests
```

### Describe/It

```javascript
describe('SaleController', () => {
  describe('createSale', () => {
    it('should create a sale with valid data', async () => {
      // ...
    });
    
    it('should reject sale with empty cart', async () => {
      // ...
    });
    
    it('should update stock after sale', async () => {
      // ...
    });
  });
});
```

---

## 🔨 Templates de Testes

### Unit Test - Utils

```typescript
// backend/src/utils/__tests__/validators.test.js
const { isValidCPF, formatCPF, formatCNPJ } = require('../validators');

describe('Validators', () => {
  describe('isValidCPF', () => {
    it('should return true for valid CPF', () => {
      expect(isValidCPF('123.456.789-09')).toBe(true);
    });

    it('should return false for invalid CPF', () => {
      expect(isValidCPF('111.111.111-11')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidCPF('')).toBe(false);
    });
  });

  describe('formatCPF', () => {
    it('should format CPF with dots and dash', () => {
      expect(formatCPF('12345678909')).toBe('123.456.789-09');
    });
  });
});
```

### Integration Test - API

```javascript
// backend/src/controllers/__tests__/sale.controller.test.js
const request = require('supertest');
const app = require('../../app');
const { prisma } = require('../../generated/prisma');

describe('POST /api/sales', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login para obter token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'test123' });
    authToken = res.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a sale successfully', async () => {
    const saleData = {
      items: [
        { product_id: 1, quantity: 2, unit_price: 10.00 }
      ],
      payment_method: 'DINHEIRO',
      total: 20.00
    };

    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send(saleData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  it('should fail without authentication', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({ items: [] });

    expect(res.status).toBe(401);
  });
});
```

### Component Test - React

```typescript
// erp-petshop/src/components/__tests__/CustomerSearch.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerSearch } from '../CustomerSearch';
import { vi } from 'vitest';

describe('CustomerSearch', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<CustomerSearch onSelect={mockOnSelect} />);
    expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument();
  });

  it('should call onSelect when customer is selected', async () => {
    render(<CustomerSearch onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText(/buscar cliente/i);
    fireEvent.change(input, { target: { value: 'João' } });
    
    await waitFor(() => {
      const option = screen.getByText(/João Silva/);
      fireEvent.click(option);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Silva' })
    );
  });
});
```

---

## 🎯 Áreas Prioritárias para Testes

### Alta Prioridade (Crítico)

| Área | Arquivo | Razão |
|------|---------|-------|
| **Vendas** | `sale.controller.js` | Core do negócio |
| **Caixa** | `cashRegister.controller.js` | Movimentações financeiras |
| **Estoque** | `inventory.controller.js` | Controle de produtos |
| **Auth** | `auth.controller.js` | Segurança |

### Média Prioridade

| Área | Arquivo | Razão |
|------|---------|-------|
| **Clientes** | `customers.controller.js` | Dados sensíveis |
| **Produtos** | `product.controller.js` | Catálogo |
| **Validators** | `validators.js` | Funções utilitárias |

### Baixa Prioridade

| Área | Arquivo | Razão |
|------|---------|-------|
| **Relatórios** | `reports.controller.js` | Leitura apenas |
| **Configurações** | `settings.controller.js` | Baixo uso |

---

## 🔧 Configuração

### Jest (Backend)

```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/generated/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
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
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

---

## 📋 Checklist de Testes

Ao criar um novo teste:

- [ ] Nome descritivo que explica o comportamento
- [ ] Testa o "caminho feliz" (happy path)
- [ ] Testa casos de erro/edge cases
- [ ] Usa mocks apropriadamente
- [ ] Limpa dados de teste após execução
- [ ] Não depende de ordem de execução
- [ ] Roda rapidamente (< 1s para unit)

---

## 🚫 Anti-padrões a Evitar

| Anti-padrão | Problema | Solução |
|-------------|----------|---------|
| Testes dependentes | Falham aleatoriamente | Cada teste isolado |
| Dados hardcoded | Difícil manutenção | Usar factories |
| Testar implementação | Quebram com refactor | Testar comportamento |
| Ignorar async | Testes falsamente passam | Usar await/done |
| Mock excessivo | Testes não refletem realidade | Mock apenas externos |

---

## 📖 Documentação de Referência

- [Estratégia de Testes](../docs/testing-strategy.md)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

## 🤝 Colaboração

| Quando | Colaborar com |
|--------|---------------|
| Nova feature | Feature Developer |
| Bug fix | Bug Fixer |
| Refactoring | Refactoring Specialist |
| Performance | Performance Optimizer |

---

*Última atualização: Janeiro 2026*
