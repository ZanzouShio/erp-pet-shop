# Documentação - ERP Pet Shop

## 📚 Índice

Bem-vindo à documentação do projeto **ERP Pet Shop**. Este diretório contém toda a documentação técnica e de negócio do sistema.

---

## 📖 Documentos Disponíveis

### Visão Geral

| Documento | Descrição |
|-----------|-----------|
| [Project Overview](./project-overview.md) | Visão geral do projeto, funcionalidades e stack |
| [Architecture](./architecture.md) | Arquitetura do sistema, camadas e padrões |
| [Data Flow](./data-flow.md) | Fluxo de dados e integrações |

### Desenvolvimento

| Documento | Descrição |
|-----------|-----------|
| [Development Workflow](./development-workflow.md) | Setup, comandos e convenções de desenvolvimento |
| [Tooling](./tooling.md) | Ferramentas, dependências e configurações |
| [Testing Strategy](./testing-strategy.md) | Estratégia e exemplos de testes |

### Referência

| Documento | Descrição |
|-----------|-----------|
| [Glossary](./glossary.md) | Termos de negócio e técnicos |
| [Security](./security.md) | Autenticação, autorização e proteção de dados |

### Análise Semântica

| Documento | Descrição |
|-----------|-----------|
| [Codebase Map](./codebase-map.json) | Mapa semântico do código (gerado automaticamente) |

---

## 🏗️ Estrutura do Projeto

```
ERP Pet Shop/
├── backend/                 # API Node.js/Express
├── erp-petshop/             # Frontend React/Vite
├── hardware-service/        # Integração com periféricos
├── docs/                    # Documentação adicional
├── .context/                # Documentação AI Context
│   ├── docs/                # ← Você está aqui
│   └── agents/              # Playbooks de agentes AI
└── prd-erp-petshop.md       # Documento de Requisitos do Produto
```

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Git

### Comandos Rápidos

```bash
# Clonar e configurar
git clone https://github.com/ZanzouShio/erp-pet-shop.git
cd erp-pet-shop
cp .env.example .env

# Subir banco de dados
docker-compose up -d

# Instalar e rodar backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Instalar e rodar frontend (outro terminal)
cd erp-petshop && npm install && npm run dev
```

Acesse:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Prisma Studio: `npx prisma studio` (porta 5555)

---

## 📞 Suporte

- **PRD Completo:** [prd-erp-petshop.md](../../prd-erp-petshop.md)
- **GitHub:** https://github.com/ZanzouShio/erp-pet-shop
- **Issues:** Utilize o GitHub Issues para reportar bugs

---

## 🔄 Manutenção da Documentação

Esta documentação é mantida no diretório `.context/` do projeto e foi gerada com auxílio do AI Context MCP.

Para atualizar a documentação:
1. Edite os arquivos `.md` diretamente
2. Execute análise semântica para atualizar o `codebase-map.json`
3. Commite as alterações

---

*Última atualização: Janeiro 2026*
