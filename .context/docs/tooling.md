# Ferramentas e Configurações - ERP Pet Shop

## 🛠️ Stack de Desenvolvimento

### Linguagens

| Linguagem | Versão | Uso |
|-----------|--------|-----|
| TypeScript | 5.x | Frontend + Backend (parcial) |
| JavaScript | ES2022 | Backend (controllers) |
| SQL | PostgreSQL 15 | Queries e migrations |

### Runtime

| Ferramenta | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ LTS | Runtime JavaScript |
| npm | 9+ | Gerenciador de pacotes |

---

## 📦 Dependências Principais

### Backend

```json
{
  "dependencies": {
    "express": "^4.x",       // Framework web
    "prisma": "^5.x",        // ORM
    "@prisma/client": "^5.x", // Cliente Prisma
    "jsonwebtoken": "^9.x",  // Autenticação JWT
    "bcryptjs": "^2.x",      // Hash de senhas
    "cors": "^2.x",          // CORS middleware
    "dotenv": "^16.x"        // Variáveis de ambiente
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "react": "^18.x",           // UI Library
    "react-dom": "^18.x",       // React DOM
    "react-router-dom": "^6.x", // Roteamento
    "axios": "^1.x",            // Cliente HTTP
    "date-fns": "^2.x",         // Manipulação de datas
    "lucide-react": "^0.x"      // Ícones
  },
  "devDependencies": {
    "vite": "^5.x",             // Build tool
    "typescript": "^5.x",       // TypeScript
    "tailwindcss": "^3.x",      // CSS framework
    "autoprefixer": "^10.x",    // PostCSS
    "postcss": "^8.x"           // CSS processor
  }
}
```

---

## 🗄️ Banco de Dados

### PostgreSQL

- **Versão:** 15+
- **Porta padrão:** 5432
- **Gerenciamento:** Prisma ORM

### Prisma CLI

```bash
# Gerar cliente
npx prisma generate

# Criar migração
npx prisma migrate dev --name descricao

# Aplicar migrações (produção)
npx prisma migrate deploy

# Abrir Studio
npx prisma studio

# Reset completo (CUIDADO!)
npx prisma migrate reset

# Formatar schema
npx prisma format
```

### Schema Location

```
backend/prisma/schema.prisma
```

---

## 🐳 Docker

### Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração dos serviços |
| `.env` | Variáveis de ambiente |

### Serviços

```yaml
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ${DB_NAME}
```

### Comandos

```bash
# Subir containers
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f postgres

# Parar
docker-compose down

# Remover volumes (CUIDADO!)
docker-compose down -v
```

---

## 📝 IDE e Extensões

### VS Code (Recomendado)

**Extensões Essenciais:**

| Extensão | ID | Uso |
|----------|----|----|
| ESLint | `dbaeumer.vscode-eslint` | Linting JavaScript |
| Prettier | `esbenp.prettier-vscode` | Formatação |
| Prisma | `Prisma.prisma` | Syntax highlighting |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete CSS |
| TypeScript | Built-in | Suporte TypeScript |
| GitLens | `eamodio.gitlens` | Git avançado |

### Configurações Recomendadas

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 🔧 Scripts de Desenvolvimento

### Backend (`backend/package.json`)

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

### Frontend (`erp-petshop/package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  }
}
```

### Scripts Auxiliares (Raiz)

| Script | Descrição |
|--------|-----------|
| `restart_dev.bat` | Reinicia ambiente de desenvolvimento |
| `dev.js` | Script de inicialização customizado |

---

## 🌐 Portas e URLs

### Desenvolvimento

| Serviço | URL | Porta |
|---------|-----|-------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:3001 | 3001 |
| PostgreSQL | localhost | 5432 |
| Prisma Studio | http://localhost:5555 | 5555 |
| Hardware Service | http://localhost:3002 | 3002 |

---

## 📁 Estrutura de Configuração

```
ERP Pet Shop/
├── .env                    # Variáveis de ambiente (não commitar!)
├── .env.example            # Template de variáveis
├── .gitignore              # Arquivos ignorados pelo Git
├── docker-compose.yml      # Configuração Docker
├── .vscode/
│   └── settings.json       # Configurações VS Code
│
├── backend/
│   ├── package.json        # Dependências backend
│   └── prisma/
│       └── schema.prisma   # Schema do banco
│
└── erp-petshop/
    ├── package.json        # Dependências frontend
    ├── vite.config.ts      # Configuração Vite
    ├── tailwind.config.js  # Configuração Tailwind
    ├── tsconfig.json       # Configuração TypeScript
    └── postcss.config.js   # Configuração PostCSS
```

---

## 🔍 Debugging

### Backend

```javascript
// Logs simples
console.log('Debug:', variavel);

// Logs estruturados
console.log(JSON.stringify(objeto, null, 2));
```

### Frontend

- **React DevTools:** Extensão do navegador
- **Console (F12):** Logs e erros
- **Network Tab:** Requisições HTTP
- **Components Tab:** Árvore de componentes

### Prisma

```bash
# Ver queries geradas
DEBUG="prisma:query" npm run dev
```

---

## 📊 Monitoramento (Planejado)

| Ferramenta | Uso |
|------------|-----|
| PM2 | Process manager em produção |
| Winston | Logging estruturado |
| Prometheus | Métricas |
| Grafana | Visualização |

---

*Última atualização: Janeiro 2026*
