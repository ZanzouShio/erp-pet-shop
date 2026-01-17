# Workflow de Desenvolvimento - ERP Pet Shop

## 🚀 Início Rápido

### Pré-requisitos
- **Node.js** 18+
- **npm** ou **yarn**
- **Docker** e **Docker Compose**
- **Git**

### Setup Inicial

```bash
# 1. Clonar o repositório
git clone https://github.com/ZanzouShio/erp-pet-shop.git
cd erp-pet-shop

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 3. Subir os containers (PostgreSQL)
docker-compose up -d

# 4. Instalar dependências do Backend
cd backend
npm install

# 5. Executar migrações do Prisma
npx prisma migrate dev

# 6. Gerar cliente Prisma
npx prisma generate

# 7. Iniciar o Backend
npm run dev

# 8. Em outro terminal, instalar e iniciar o Frontend
cd ../erp-petshop
npm install
npm run dev
```

---

## 📁 Estrutura de Branches

```
main                    # Produção estável
├── develop             # Desenvolvimento
│   ├── feature/*       # Novas funcionalidades
│   ├── bugfix/*        # Correções de bugs
│   └── hotfix/*        # Correções urgentes em produção
```

### Convenções de Nomenclatura

| Tipo | Formato | Exemplo |
|------|---------|---------|
| Feature | `feature/descricao-curta` | `feature/modulo-nfe` |
| Bugfix | `bugfix/descricao-curta` | `bugfix/calculo-troco` |
| Hotfix | `hotfix/descricao-curta` | `hotfix/login-crash` |

---

## 📝 Convenções de Commit

Seguimos o padrão **Conventional Commits**:

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (não afeta lógica) |
| `refactor` | Refatoração de código |
| `test` | Adição/modificação de testes |
| `chore` | Manutenção (build, configs) |

### Exemplos

```bash
feat(pdv): adicionar suporte a múltiplas formas de pagamento
fix(estoque): corrigir cálculo de custo médio ponderado
docs(readme): atualizar instruções de instalação
refactor(auth): simplificar lógica de validação de token
```

---

## 🔧 Comandos Úteis

### Backend

```bash
# Iniciar em desenvolvimento
npm run dev

# Executar migrações
npx prisma migrate dev --name descricao

# Abrir Prisma Studio (visualizar dados)
npx prisma studio

# Gerar cliente Prisma
npx prisma generate

# Reset do banco (CUIDADO!)
npx prisma migrate reset
```

### Frontend

```bash
# Iniciar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Docker

```bash
# Subir containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Reiniciar tudo
docker-compose down && docker-compose up -d
```

---

## 🏗️ Fluxo de Desenvolvimento

### 1. Criar Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/minha-feature
```

### 2. Desenvolver

- Faça commits pequenos e frequentes
- Siga as convenções de commit
- Teste localmente antes de commitar

### 3. Push e Pull Request

```bash
git push origin feature/minha-feature
```

- Crie um Pull Request para `develop`
- Aguarde revisão de código
- Faça ajustes se necessário

### 4. Merge

- Após aprovação, merge na `develop`
- Delete a branch remota

---

## 🧪 Testes

### Estrutura (Planejada)

```
backend/
├── tests/
│   ├── unit/           # Testes unitários
│   └── integration/    # Testes de integração

erp-petshop/
├── src/
│   └── __tests__/      # Testes de componentes
```

### Executar Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd erp-petshop
npm test
```

---

## 📊 Banco de Dados

### Prisma Schema

Localização: `backend/prisma/schema.prisma`

### Criar Nova Migração

```bash
cd backend
npx prisma migrate dev --name descricao_da_alteracao
```

### Visualizar Dados

```bash
npx prisma studio
```

---

## 🔍 Debugging

### Backend

1. Usar `console.log()` para debug rápido
2. Verificar logs do terminal
3. Usar Prisma Studio para inspecionar dados

### Frontend

1. React DevTools (extensão do navegador)
2. Console do navegador (F12)
3. Network tab para debug de requisições

---

## 📦 Deploy (Planejado)

### Ambiente de Desenvolvimento
- Local com Docker

### Ambiente de Produção
- VPS ou Cloud (a definir)
- Docker Compose ou Kubernetes
- Nginx como reverse proxy
- SSL com Let's Encrypt

---

## 🆘 Problemas Comuns

### Porta em uso

```bash
# Windows - encontrar processo na porta 3001
netstat -ano | findstr :3001

# Matar processo
taskkill /PID <PID> /F
```

### Prisma: Schema drift

```bash
npx prisma migrate reset
# ATENÇÃO: Isso apaga todos os dados!
```

### Node modules corrompidos

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📞 Suporte

- Issues no GitHub
- Documentação neste diretório `.context/`

---

*Última atualização: Janeiro 2026*
