---
name: Architect Specialist
description: Design overall system architecture and patterns for ERP Pet Shop
status: filled
generated: 2026-01-17
---

# Architect Specialist Agent Playbook

## 🎯 Mission

O Architect Specialist é responsável por garantir que as decisões arquiteturais do ERP Pet Shop sejam consistentes, escaláveis e alinhadas com os requisitos de negócio. Este agente é acionado quando há necessidade de:

- Definir ou revisar padrões arquiteturais
- Avaliar novas tecnologias ou integrações
- Planejar refatorações estruturais
- Resolver conflitos de design entre módulos
- Documentar decisões arquiteturais (ADRs)

---

## 📐 Arquitetura Atual

### Visão Geral

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ERP PET SHOP                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐  │
│  │   FRONTEND      │      │    BACKEND      │      │   DATABASE      │  │
│  │   React/Vite    │◄────►│  Express/Node   │◄────►│   PostgreSQL    │  │
│  │   TypeScript    │      │   JavaScript    │      │   Prisma ORM    │  │
│  │   TailwindCSS   │      │   Port: 3001    │      │   Port: 5432    │  │
│  │   Port: 5173    │      │                 │      │                 │  │
│  └────────┬────────┘      └─────────────────┘      └─────────────────┘  │
│           │                                                              │
│           │ WebSocket                                                    │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     HARDWARE SERVICE                                 ││
│  │                     Node.js Standalone                               ││
│  │                     ws://localhost:3002                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            ││
│  │  │Impressora│  │ Balança  │  │  Gaveta  │  │ Scanner  │            ││
│  │  │ ESC/POS  │  │  Serial  │  │  Serial  │  │ USB HID  │            ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | React, Vite, TypeScript | 18+, 5+, 5+ |
| **Estilização** | TailwindCSS | 3+ |
| **Backend** | Node.js, Express | 18+, 4+ |
| **Banco de Dados** | PostgreSQL | 15+ |
| **ORM** | Prisma | 5+ |
| **Hardware** | node-thermal-printer, serialport | 4+, 12+ |
| **Comunicação** | REST API, WebSocket | - |

---

## 📁 Estrutura de Diretórios

```
ERP Pet Shop/
├── backend/                    # API REST
│   ├── src/
│   │   ├── controllers/        # Lógica de negócio (MVC)
│   │   ├── routes/             # Definição de rotas
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── services/           # Serviços auxiliares
│   │   ├── utils/              # Helpers
│   │   ├── server.js           # Entry point
│   │   └── app.js              # Express config
│   └── prisma/
│       ├── schema.prisma       # Schema do banco
│       └── migrations/         # Histórico de migrações
│
├── erp-petshop/                # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/              # Páginas/rotas
│   │   ├── contexts/           # React Context (Auth, etc.)
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API clients
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Helpers
│   │   ├── layouts/            # Layout components
│   │   └── main.tsx            # Entry point
│   └── public/                 # Assets estáticos
│
├── hardware-service/           # Módulo Desktop
│   └── src/
│       ├── index.js            # WebSocket server
│       └── devices/            # Drivers de periféricos
│           ├── printer.js      # ESC/POS
│           ├── scale.js        # Balança Toledo
│           ├── drawer.js       # Gaveta
│           └── scanner.js      # Leitor
│
├── .context/                   # Documentação AI Context
│   ├── docs/                   # Documentação técnica
│   └── agents/                 # Playbooks de agentes
│
└── docker-compose.yml          # Infraestrutura local
```

---

## 🏗️ Padrões Arquiteturais

### Backend (MVC Simplificado)

```
Request → Router → Controller → Prisma ORM → Database
                       ↓
                   Response
```

**Convenções:**
- Um controller por entidade (products, customers, sales, etc.)
- Validação no middleware ou no início do controller
- Transações Prisma para operações compostas
- Responses padronizadas: `{ success, data, error, message }`

### Frontend (Component-Based)

```
App.tsx
    └── Layout
           └── Page
                  └── Components
                         └── Hooks (lógica de estado)
                                └── Services (API calls)
```

**Convenções:**
- Páginas em `/pages` com nome PascalCase
- Componentes reutilizáveis em `/components`
- Lógica de estado complexa em custom hooks
- Context para estados globais (auth, theme)
- Tipos TypeScript em `/types/index.ts`

### Hardware Service (Event-Driven)

```
WebSocket Connection
    ├── onMessage → Command Handler
    │                    ├── printReceipt
    │                    ├── openDrawer
    │                    └── readWeight
    └── Device Events → Broadcast to clients
              ├── barcode
              └── weight
```

---

## 🔧 Decisões Arquiteturais (ADRs)

### ADR-001: Abandono do Modo Offline Electron

**Status:** Aceito  
**Data:** 2026-01-17

**Contexto:**  
O modo offline com Electron + SQLite adicionava complexidade significativa (sincronização, conflitos, duplicidade de código).

**Decisão:**  
Abandonar o PDV Electron em favor de um PDV web + Hardware Service standalone.

**Consequências:**
- ✅ Simplificação da arquitetura
- ✅ Código único para frontend
- ✅ Manutenção facilitada
- ⚠️ Sistema requer conexão com internet
- ⚠️ Hardware Service deve estar rodando para periféricos

---

### ADR-002: Hardware Service via WebSocket

**Status:** Aceito  
**Data:** 2026-01-17

**Contexto:**  
Navegadores não podem acessar hardware diretamente (portas seriais, USB).

**Decisão:**  
Criar um serviço Node.js que roda localmente e expõe periféricos via WebSocket.

**Consequências:**
- ✅ Frontend web pode acessar periféricos
- ✅ Instalação única por máquina PDV
- ✅ Protocolo simples e stateless
- ⚠️ Requer instalação do Hardware Service em cada PDV

---

### ADR-003: Prisma como ORM

**Status:** Aceito  
**Data:** 2025-11

**Contexto:**  
Necessidade de ORM type-safe com migrations versionadas.

**Decisão:**  
Usar Prisma para interação com PostgreSQL.

**Consequências:**
- ✅ Schema como código
- ✅ Migrations automáticas
- ✅ Type-safe queries
- ⚠️ Algumas queries complexas requerem raw SQL

---

## 📋 Responsabilidades

### O que o Architect faz:
- ✅ Define estrutura de diretórios e padrões de código
- ✅ Avalia impacto de novas features na arquitetura
- ✅ Documenta decisões técnicas (ADRs)
- ✅ Revisa integrações com sistemas externos
- ✅ Planeja refatorações e migrações
- ✅ Define interfaces entre módulos

### O que o Architect NÃO faz:
- ❌ Implementar features (ver: feature-developer)
- ❌ Corrigir bugs (ver: bug-fixer)
- ❌ Revisar código em detalhes (ver: code-reviewer)
- ❌ Escrever testes (ver: test-writer)

---

## 🔍 Checklist de Avaliação Arquitetural

Ao avaliar uma nova feature ou mudança:

### 1. Impacto
- [ ] Afeta mais de um módulo?
- [ ] Requer mudanças no schema do banco?
- [ ] Adiciona nova dependência externa?
- [ ] Altera fluxos de dados existentes?

### 2. Escalabilidade
- [ ] Suporta crescimento de usuários/dados?
- [ ] Performance será afetada?
- [ ] Há gargalos potenciais?

### 3. Manutenibilidade
- [ ] Código será fácil de entender?
- [ ] Segue os padrões existentes?
- [ ] Documentação será necessária?

### 4. Segurança
- [ ] Dados sensíveis estão protegidos?
- [ ] Autenticação/autorização corretas?
- [ ] Validação de inputs adequada?

---

## 🔗 Integrações Planejadas

### APIs Externas

| Sistema | Status | Complexidade | Notas |
|---------|--------|--------------|-------|
| SEFAZ (NF-e/NFC-e) | Planejado | Alta | Certificado digital, XML, retorno |
| PIX (QR Code) | Planejado | Média | Webhook para confirmação |
| Stone | Manual | Baixa | Registro manual de transações |

### Recomendações de Integração

**SEFAZ:**
- Criar módulo isolado `/backend/src/services/fiscal/`
- Usar biblioteca nfe-io ou similar
- Implementar fila para retransmissão
- Armazenar XMLs para auditoria

**PIX:**
- Webhook endpoint para confirmação
- QR Code dinâmico por transação
- Timeout configurável
- Fallback para registro manual

---

## 📊 Métricas de Qualidade

### Performance
| Métrica | Target | Atual |
|---------|--------|-------|
| Tempo resposta API (p95) | < 200ms | ✅ OK |
| Carregamento de página | < 2s | ✅ OK |
| Hardware Service | < 100ms | ✅ OK |

### Código
| Métrica | Target |
|---------|--------|
| Cobertura de testes | > 70% |
| Complexidade ciclomática | < 10 |
| Duplicação de código | < 5% |

---

## 📖 Documentação de Referência

- [Arquitetura Detalhada](../docs/architecture.md)
- [Fluxo de Dados](../docs/data-flow.md)
- [Segurança](../docs/security.md)
- [Tooling](../docs/tooling.md)
- [PRD](../../prd-erp-petshop.md)

---

## 🤝 Colaboração com Outros Agentes

| Quando | Colaborar com |
|--------|---------------|
| Implementar decisão | Feature Developer |
| Revisar código | Code Reviewer |
| Mudanças no schema | Database Specialist |
| Performance issues | Backend Specialist |
| Segurança | Security Specialist |

---

## ✅ Handoff Notes

Após completar uma análise arquitetural:

1. **Documentar** a decisão em formato ADR
2. **Comunicar** impactos para os desenvolvedores
3. **Atualizar** documentação em `.context/docs/`
4. **Criar issues** para trabalho de implementação
5. **Registrar** riscos identificados

---

*Última atualização: Janeiro 2026*
