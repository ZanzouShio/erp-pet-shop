# 🐾 ERP Pet Shop

Sistema ERP completo para gestão de Pet Shop e Casa de Rações.

## 📊 Status do Projeto

✅ **Fase Atual:** Integração Frontend-Backend (Fase 1 concluída)

- ✅ Frontend PDV React funcionando
- ✅ Backend Express com PostgreSQL
- ✅ 30 produtos cadastrados no banco
- ⚠️ Backend em correção (bugs identificados)

---

## 🚀 Stack Tecnológica

### Frontend PDV
- **React 18.2** + TypeScript
- **Vite 7.2.4** (dev server + HMR)
- **CSS puro** (sem frameworks)
- Interface responsiva e otimizada

### Backend API
- **Node.js 24.11.1**
- **Express 4.18** (API REST)
- **PostgreSQL 16** (Docker)
- **pg** (PostgreSQL client)

### Infraestrutura
- **Docker + Docker Compose**
- **pgAdmin 4** (interface de admin)

---

## 📁 Estrutura do Projeto

```
ERP Pet Shop/
├── erp-petshop/              # Frontend React (PDV)
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── types/            # TypeScript types
│   │   └── data/             # Mock data
│   └── package.json
│
├── backend/                  # Backend Express
│   ├── src/
│   │   ├── index.js          # Servidor principal
│   │   └── db.js             # Conexão PostgreSQL
│   ├── .env                  # Variáveis de ambiente
│   └── package.json
│
├── database-schema-erp.sql   # Schema completo do banco
├── database-seed-final.sql   # Seed com 30 produtos
├── docker-compose.yml        # PostgreSQL + pgAdmin
├── prd-erp-petshop.md        # Documentação de requisitos
└── README.md                 # Este arquivo
```

---

## ⚙️ Como Executar

### 1. Pré-requisitos

- Node.js 18+ instalado
- Docker Desktop instalado e rodando

### 2. Clone o Repositório

```bash
git clone https://github.com/ZanzouShio/erp-pet-shop.git
cd erp-pet-shop
```

### 3. Configurar Variáveis de Ambiente

Copie o `.env.example` e configure:

```bash
cp .env.example backend/.env
```

### 4. Iniciar PostgreSQL (Docker)

```bash
docker-compose up -d
```

**Portas:**
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`
  - Email: `admin@admin.com`
  - Senha: `admin`

### 5. Popular o Banco de Dados

```bash
# Executar seed
Get-Content database-seed-final.sql | docker exec -i erp-petshop-db psql -U erp_admin -d erp_petshop
```

### 6. Iniciar Backend

```bash
cd backend
npm install
npm run dev
```

Rodando em: `http://localhost:3001`

### 7. Iniciar Frontend

```bash
cd erp-petshop
npm install
npm run dev
```

Rodando em: `http://localhost:5173`

---

## 🔌 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/:id` | Detalhes do produto |
| GET | `/api/categories` | Listar categorias |
| POST | `/api/sales` | Registrar venda ⚠️ |
| GET | `/api/sales` | Listar vendas |
| POST | `/api/customers` | Cadastrar cliente |
| GET | `/api/customers` | Buscar clientes |
| GET | `/api/sales/reports/daily` | Relatório diário |

⚠️ = Em correção

---

## 🐛 Bugs Conhecidos

1. **JOIN de produtos** - Produtos aparecendo duplicados (identificado, correção pendente)
2. **Schema de vendas** - Tabela `sale_payments` separada (correção pendente)

---

## 📋 Roadmap

### ✅ Fase 1 - PDV Básico (Concluído)
- Frontend PDV React
- Backend Express simples
- PostgreSQL via Docker
- 30 produtos cadastrados

### 🔄 Fase 2 - Correções e UX (Atual)
- Corrigir bugs do backend
- Toast notifications
- Interface de clientes
- Relatórios visuais

### 📅 Fase 3 - Backend Robusto
- Migrar para Prisma ORM
- Autenticação JWT
- CRUD completo
- Websockets

### 📅 Fase 4 - Módulos Avançados
- Orçamentos
- Histórico de vendas
- Dashboard executivo
- Produtos a granel

### 📅 Fase 5 - Sistema Fiscal
- Integração PIX
- Emissão NFC-e
- Certificado digital

---

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Sugestões e contribuições são bem-vindas!

---

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes

---

## 👤 Autor

**ZanzouShio**  
GitHub: [@ZanzouShio](https://github.com/ZanzouShio)

---

## 📞 Suporte

Para problemas ou dúvidas, abra uma issue no GitHub.

---

**Última atualização:** Novembro 2024
