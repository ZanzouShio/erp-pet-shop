# 🐾 ERP Pet Shop

Sistema completo de gestão para Pet Shop com PDV, controle de estoque, financeiro e emissão fiscal.

## 🚀 Tecnologias

### Frontend (PDV Web)
- React 18 + TypeScript + Vite
- CSS Puro (sem frameworks)
- Hot Module Replacement

### Backend (Em desenvolvimento)
- Node.js + TypeScript
- PostgreSQL 16
- Prisma ORM
- Express

## 📦 Pré-requisitos

- Node.js 24.11.1 ou superior
- Docker Desktop
- Git

## 🐳 Configuração do Banco de Dados (Docker)

### 1. Iniciar PostgreSQL + pgAdmin

```bash
# Na raiz do projeto
docker-compose up -d
```

Isso irá iniciar:
- **PostgreSQL 16** na porta `5432`
- **pgAdmin 4** em `http://localhost:5050`

### 2. Verificar se os containers estão rodando

```bash
docker ps
```

Você deve ver:
- `erp-petshop-db` (PostgreSQL)
- `erp-petshop-pgadmin` (pgAdmin)

### 3. Acessar pgAdmin

1. Abra `http://localhost:5050` no navegador
2. Login:
   - **Email:** `admin@petshop.com`
   - **Senha:** `admin123`

3. Conectar ao banco:
   - Clique em "Add New Server"
   - **Name:** ERP Pet Shop
   - Aba "Connection":
     - **Host:** `postgres` (nome do container)
     - **Port:** `5432`
     - **Database:** `erp_petshop`
     - **Username:** `erp_admin`
     - **Password:** `erp_pass_2024`
   - Salvar

### 4. Parar os containers

```bash
docker-compose down
```

Para parar E remover os volumes (⚠️ apaga dados):
```bash
docker-compose down -v
```

## 💻 Frontend (PDV)

### Instalar dependências

```bash
cd erp-petshop
npm install
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Acessar: `http://localhost:5173`

### Build para produção

```bash
npm run build
npm run preview
```

## 🔧 Backend (Em breve)

```bash
cd backend
npm install
npm run dev
```

## 📊 Estrutura do Projeto

```
ERP Pet Shop/
├── docker-compose.yml          # Configuração Docker
├── database-schema-erp.sql     # Schema completo do banco
├── prd-erp-petshop.md          # Documentação do produto
├── .env.example                # Exemplo de variáveis de ambiente
├── erp-petshop/                # Frontend React (PDV)
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── data/               # Mock data
│   │   ├── types/              # TypeScript types
│   │   └── App.tsx             # App principal
│   └── package.json
└── backend/                    # Backend Node.js (em breve)
    ├── src/
    ├── prisma/
    └── package.json
```

## 🎯 Funcionalidades Atuais

### ✅ PDV Web (Concluído)
- Busca de produtos
- Filtros por categoria
- Carrinho de compras
- Múltiplas formas de pagamento
- Cálculo automático de troco
- Atalhos de teclado (F2, F4, ESC)

### 🚧 Em Desenvolvimento
- Backend API REST
- Autenticação JWT
- Integração com banco de dados
- CRUD de produtos, clientes, vendas

### 📋 Roadmap
- Sistema de estoque em tempo real
- Módulo financeiro
- Emissão fiscal (NFC-e/NF-e)
- Integração PIX
- Programa de fidelidade
- Relatórios gerenciais

## 🔐 Credenciais Padrão

### PostgreSQL
- **Host:** localhost:5432
- **Database:** erp_petshop
- **User:** erp_admin
- **Password:** erp_pass_2024

### pgAdmin
- **URL:** http://localhost:5050
- **Email:** admin@petshop.com
- **Password:** admin123

⚠️ **IMPORTANTE:** Altere as senhas em produção!

## 📝 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!

## 📄 Licença

Proprietary - Todos os direitos reservados

---

**Desenvolvido com ❤️ para Pet Shops**
