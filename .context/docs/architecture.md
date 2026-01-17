# Arquitetura do Sistema - ERP Pet Shop

## 🏛️ Visão Geral da Arquitetura

O ERP Pet Shop segue uma arquitetura **Cliente-Servidor** com um **Hardware Service** para integração com periféricos. O sistema é dividido em três grandes componentes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SISTEMA WEB                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Frontend    │    │   Backend    │    │      PostgreSQL          │  │
│  │  React/Vite  │◄──►│  Node.js/    │◄──►│   (Banco Principal)      │  │
│  │              │    │  Express     │    │                          │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│         │                                                               │
│         │ WebSocket                                                     │
│         ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    HARDWARE SERVICE                               │  │
│  │                   ws://localhost:3002                             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│  │  │Impressora│  │ Balança │  │ Gaveta  │  │ Scanner │             │  │
│  │  │ ESC/POS │  │ Serial  │  │ Serial  │  │USB HID  │             │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Nota:** O sistema requer conexão com a internet. O Hardware Service roda 
> localmente apenas para comunicação com periféricos físicos.

---

## 📐 Padrões Arquiteturais

### **MVC (Model-View-Controller)**
O backend segue o padrão MVC com clara separação de responsabilidades:

| Camada | Responsabilidade | Localização |
|--------|------------------|-------------|
| **Model** | Modelos de dados e esquema | `backend/prisma/schema.prisma` |
| **View** | Respostas JSON da API | Retornos dos controllers |
| **Controller** | Lógica de negócio | `backend/src/controllers/` |

### **Component-Based Architecture (Frontend)**
O frontend utiliza arquitetura baseada em componentes React:

```
src/
├── components/     # Componentes reutilizáveis (UI)
├── pages/          # Componentes de página (rotas)
├── layouts/        # Layouts de aplicação
├── contexts/       # Estado global (Context API)
├── hooks/          # Lógica reutilizável (Custom Hooks)
└── services/       # Comunicação com API
```

---

## 🔌 Camadas do Sistema

### 1. **Camada de Apresentação (Frontend)**
- **React 18+** com **TypeScript**
- **Vite** como bundler
- **TailwindCSS** para estilização
- **React Router** para navegação
- **Context API** para estado global (autenticação)

#### Componentes Principais:
- `AuthContext` - Gerenciamento de autenticação
- `AdminLayout` - Layout padrão do sistema administrativo
- `useToast` - Notificações do sistema
- `useCashRegister` - Operações de caixa

### 2. **Camada de API (Backend)**
- **Node.js** com **Express**
- **JWT** para autenticação
- **Middleware** para validação e autorização

#### Estrutura de Rotas:
```
/api/
├── /auth           # Autenticação (login, logout)
├── /products       # CRUD de produtos
├── /customers      # CRUD de clientes
├── /sales          # Vendas e transações
├── /suppliers      # Fornecedores
├── /cash           # Operações de caixa
├── /inventory      # Movimentações de estoque
├── /reports        # Relatórios gerenciais
└── /settings       # Configurações do sistema
```

### 3. **Camada de Dados**
- **PostgreSQL** - Banco principal (online)
- **SQLite** - Banco local (offline/PDV)
- **Prisma ORM** - Abstração de banco de dados

#### Principais Entidades:
- `users` - Usuários do sistema
- `products` - Produtos
- `categories` - Categorias de produtos
- `customers` - Clientes
- `suppliers` - Fornecedores
- `sales` - Vendas
- `sale_items` - Itens de venda
- `cash_registers` - Caixas
- `cash_movements` - Movimentações de caixa
- `accounts_payable` - Contas a pagar
- `accounts_receivable` - Contas a receber

### 4. **Camada de Serviços (Hardware)**
- Integração com **balança** (Prix Fit 3)
- Integração com **impressora térmica** (ESC/POS)
- Comunicação **Serial/USB**

---

## 🔄 Fluxo de Dados

### Venda Online
```
[PDV/Frontend] 
    → POST /api/sales 
    → [Controller] valida dados
    → [Prisma] persiste no PostgreSQL
    → [Response] retorna venda criada
    → [Frontend] atualiza UI
```

### Venda Offline
```
[Electron PDV]
    → Salva no SQLite local
    → Adiciona à fila de sincronização
    
[Quando online]
    → Processa fila
    → POST /api/sync
    → Atualiza PostgreSQL central
    → Marca como sincronizado
```

---

## 🔒 Segurança

### Autenticação
```
[Login] → [JWT Token] → [authMiddleware] → [Rota Protegida]
```

### Níveis de Acesso
| Perfil | Permissões |
|--------|------------|
| Admin | Acesso total |
| Gerente | Relatórios, cadastros, vendas |
| Caixa | PDV e operações de venda |
| Estoquista | Estoque, produtos |
| Financeiro | Contas, conciliação |

---

## 🐳 Infraestrutura

### Docker Compose
```yaml
services:
  backend:     # API Node.js
  postgres:    # Banco de dados
  redis:       # Cache (planejado)
```

### Portas Padrão
| Serviço | Porta |
|---------|-------|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3001 |
| PostgreSQL | 5432 |
| Hardware Service | 3002 |

---

## 📈 Escalabilidade

### Atual (Fase 1)
- Single server
- 1-10 usuários simultâneos
- ~200 vendas/dia

### Futuro (Fase 2+)
- Múltiplas lojas
- Load balancing
- Cache distribuído (Redis)
- Microserviços (se necessário)

---

*Última atualização: Janeiro 2026*
