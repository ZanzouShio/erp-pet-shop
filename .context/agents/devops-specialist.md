---
name: DevOps Specialist
description: Infrastructure, CI/CD, and deployment for ERP Pet Shop
status: filled
generated: 2026-01-17
---

# DevOps Specialist Agent Playbook

## 🎯 Mission

O DevOps Specialist é responsável pela infraestrutura, containerização, pipelines de CI/CD e deploy do ERP Pet Shop. Garante que o sistema seja fácil de implantar, monitorar e escalar.

---

## 🏗️ Infraestrutura Atual

### Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AMBIENTE DE PRODUÇÃO (Planejado)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │    Nginx     │    │   Backend    │    │      PostgreSQL          │  │
│  │   (Reverse   │───►│   Node.js    │───►│   (Docker/Cloud)        │  │
│  │    Proxy)    │    │   :3001      │    │                          │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐                                                       │
│  │   Frontend   │                                                       │
│  │   (Static)   │                                                       │
│  │   React/Vite │                                                       │
│  └──────────────┘                                                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   Hardware Service (Instalado localmente em cada PDV)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stack de Infraestrutura

| Componente | Tecnologia | Status |
|------------|------------|--------|
| Containers | Docker | ✅ Implementado |
| Orquestração | docker-compose | ✅ Implementado |
| Banco de Dados | PostgreSQL 15 | ✅ Implementado |
| Reverse Proxy | Nginx | Planejado |
| CI/CD | GitHub Actions | Planejado |
| Monitoramento | PM2 / Winston | Planejado |

---

## 🐳 Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: erp-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: erp-backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  frontend:
    build: ./erp-petshop
    container_name: erp-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Comandos Docker

```bash
# Subir ambiente
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Rebuild após mudanças
docker-compose build --no-cache backend
docker-compose up -d backend

# Parar tudo
docker-compose down

# Limpar volumes (CUIDADO - apaga dados!)
docker-compose down -v
```

---

## 🔄 CI/CD Pipeline (Planejado)

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../erp-petshop && npm ci
          
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../erp-petshop && npm test
          
      - name: Build
        run: |
          cd erp-petshop && npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # SSH para servidor e deploy
          echo "Deploy..."
```

---

## 📦 Scripts de Deploy

### Script de Desenvolvimento

```powershell
# restart_dev.bat (já existe)
# Reinicia ambiente de desenvolvimento
```

### Script de Produção (a criar)

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Iniciando deploy..."

# Pull latest
git pull origin main

# Build
cd erp-petshop
npm ci
npm run build

# Restart backend
cd ../backend
npm ci
npx prisma migrate deploy
pm2 restart erp-backend

echo "✅ Deploy concluído!"
```

---

## 🔧 Variáveis de Ambiente

### Desenvolvimento (.env)

```env
# Banco de Dados
DB_USER=postgres
DB_PASS=postgres
DB_NAME=erp_petshop
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_petshop

# Backend
PORT=3001
JWT_SECRET=development-secret-change-in-production

# Frontend
VITE_API_URL=http://localhost:3001
```

### Produção (Secrets)

| Variável | Onde Configurar |
|----------|-----------------|
| DATABASE_URL | GitHub Secrets / Servidor |
| JWT_SECRET | GitHub Secrets / Servidor |
| CERTIFICATE_PASSWORD | Servidor apenas |

---

## 🖥️ Hardware Service - Instalação

### Instalação Manual (Windows)

```powershell
# 1. Copiar pasta hardware-service para C:\ERP\hardware-service

# 2. Instalar dependências
cd C:\ERP\hardware-service
npm install

# 3. Configurar .env
copy .env.example .env
# Editar conforme necessário

# 4. Rodar como serviço (usando PM2)
npm install -g pm2
pm2 start src/index.js --name "hardware-service"
pm2 save
pm2 startup
```

### Instalador Automático (Planejado)

```
# Criar instalador com Electron Builder ou NSIS
hardware-service-setup.exe
```

---

## 📊 Monitoramento (Planejado)

### PM2 - Process Manager

```bash
# Instalar
npm install -g pm2

# Iniciar backend
pm2 start backend/src/server.js --name erp-backend

# Monitorar
pm2 status
pm2 logs erp-backend
pm2 monit
```

### Health Checks

```javascript
// backend/src/routes/health.routes.js
router.get('/health', async (req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`;
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: dbOk ? 'connected' : 'disconnected'
  });
});
```

---

## 💾 Backup

### Backup PostgreSQL

```bash
# Backup manual
docker exec erp-postgres pg_dump -U postgres erp_petshop > backup.sql

# Restore
docker exec -i erp-postgres psql -U postgres erp_petshop < backup.sql
```

### Backup Automático (Cron)

```bash
# Adicionar ao crontab
0 3 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

---

## ✅ Checklist de Deploy

### Pré-Deploy

- [ ] Testes passando
- [ ] Build sem erros
- [ ] Migrations revisadas
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco feito

### Durante

- [ ] Aplicar migrations
- [ ] Restart serviços
- [ ] Verificar logs

### Pós-Deploy

- [ ] Testar funcionalidades críticas
- [ ] Verificar erros nos logs
- [ ] Confirmar métricas normais

---

## 📖 Documentação de Referência

- [Tooling](../docs/tooling.md)
- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🤝 Colaboração

| Quando | Colaborar com |
|--------|---------------|
| Mudanças de infraestrutura | Architect Specialist |
| Problemas de segurança | Security Auditor |
| Performance | Performance Optimizer |
| Banco de dados | Database Specialist |

---

*Última atualização: Janeiro 2026*
