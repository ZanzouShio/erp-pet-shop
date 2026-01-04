# Plano de Migração para Produção - ERP Pet Shop

## 📋 Objetivo

Migrar o ERP Pet Shop do ambiente de desenvolvimento local para produção, com:
- Backend/Frontend hospedados em servidor Proxmox (LXC container)
- Exposição web via Cloudflare Tunnel
- Hardware Service rodando localmente na máquina da loja
- Comunicação segura entre web app e hardware local

---

## 🏗️ Arquitetura de Produção

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE TUNNEL                                    │
│                    erp.seudominio.com.br                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SERVIDOR PROXMOX (SUA CASA)                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                      LXC CONTAINER                                  │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │     │
│  │  │   NGINX      │  │   BACKEND    │  │      POSTGRESQL          │  │     │
│  │  │   Reverse    │──│   Express    │──│      Database            │  │     │
│  │  │   Proxy      │  │   :3001      │  │      :5432               │  │     │
│  │  │   :80/:443   │  └──────────────┘  └──────────────────────────┘  │     │
│  │  └──────────────┘                                                   │     │
│  │         │                                                           │     │
│  │         ▼                                                           │     │
│  │  ┌──────────────┐                                                   │     │
│  │  │   FRONTEND   │   Static files (Vite build)                       │     │
│  │  │   React SPA  │                                                   │     │
│  │  └──────────────┘                                                   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket (wss://)
                                    │ via Cloudflare
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOJA (MÁQUINA LOCAL)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    HARDWARE SERVICE                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │   Agent      │──│  WebSocket   │──│   Hardware               │   │    │
│  │  │   Service    │  │   Client     │  │   (Printer, Drawer, etc) │   │    │
│  │  │   (Windows)  │  │   :3002      │  │   USB/Serial             │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    NAVEGADOR                                         │    │
│  │              https://erp.seudominio.com.br                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Opções de Comunicação Web ↔ Hardware Local

### Opção A: WebSocket Bridge via Backend (RECOMENDADA)

O Hardware Service na loja **conecta-se ao backend** como cliente WebSocket, não o contrário.

```
Browser (loja) ──HTTP──▶ Backend (cloud) ──WS──▶ Hardware Service (loja)
                                          ◀──WS──
```

**Fluxo:**
1. Hardware Service inicia e conecta via WebSocket ao backend (wss://erp.dominio/ws/hardware)
2. Usuario faz login no browser e "pareia" com o terminal
3. Quando precisa imprimir, o frontend envia comando via API REST
4. Backend roteia o comando via WebSocket para o Hardware Service correto
5. Hardware Service executa e responde

**Vantagens:**
- Não precisa abrir portas na loja
- Funciona atrás de NAT/firewall
- Pareamento seguro via token

---

### Opção B: Hardware Service Acessado Localmente

O browser na loja acessa diretamente o Hardware Service local (localhost:3002).

```
Browser (loja) ──HTTP──▶ Backend (cloud)
       │
       └──WS──▶ Hardware Service (localhost:3002)
```

**Problema:** O browser está acessando `https://erp.dominio` (HTTPS), mas tentaria conectar em `ws://localhost:3002` (HTTP). Browsers modernos bloqueiam mixed content.

**Solução:** Self-signed certificate local + exceção no browser. Mais complexo de gerenciar.

---

## ✅ Escolha: Opção A - WebSocket Bridge

Vamos implementar a **Opção A** por ser mais segura e fácil de gerenciar.

---

## 📦 Componentes a Desenvolver

### 1. Backend - WebSocket Hub para Terminais

**Novo módulo:** `backend/src/services/terminalHub.js`

- Mantém conexões WebSocket dos Hardware Services
- Roteia comandos do frontend para o terminal correto
- Gerencia pareamento terminal ↔ usuário

### 2. Hardware Service - Cliente WebSocket

**Modificação:** `hardware-service/src/index.js`

- Conectar ao backend remoto como cliente
- Reconexão automática se cair
- Autenticação via token de terminal

### 3. Frontend - Painel de Configuração de Terminal

**Nova página:** `Settings > Terminais`

- Cadastrar terminais (nome, token)
- Gerar QR Code para pareamento rápido
- Status de conexão em tempo real
- Configurar qual impressora pertence a qual terminal

### 4. Instalador Windows do Hardware Service

**Novo:** Instalador .exe ou .msi

- Instala Hardware Service como Windows Service
- Wizard de configuração inicial (URL do servidor, token)
- Auto-start com Windows

---

## 🔐 Segurança para Produção

### Correções Obrigatórias (do Security Audit)

| Prioridade | Item | Onde |
|------------|------|------|
| P0 | Autenticação global em todas as rotas | `app.js` |
| P0 | JWT Secret forte via env | `.env.production` |
| P0 | Token de terminal obrigatório | Hardware Service |
| P1 | RBAC - Autorização por role | Middleware novo |
| P1 | Rate limiting no login | `app.js` |
| P2 | DTOs para limitar dados expostos | Controllers |
| P2 | Cookies HttpOnly para tokens | Auth flow |

### Novas Medidas para Produção

| Item | Descrição |
|------|-----------|
| HTTPS forçado | Cloudflare já provê |
| Headers de segurança | Helmet.js no Express |
| Backup automático | pg_dump agendado |
| Logs estruturados | Winston + rotação |
| Health checks | Endpoint para monitoramento |

---

## 📁 Estrutura de Arquivos para Produção

```
ERP Pet Shop/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── terminalHub.js          [NOVO] WebSocket hub
│   │   ├── routes/
│   │   │   └── terminal.routes.js      [NOVO] API de terminais
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      [MODIFICAR] Global
│   │   │   └── authorize.middleware.js [NOVO] RBAC
│   │   └── app.js                      [MODIFICAR] Segurança
│   ├── .env.example                    [ATUALIZAR]
│   ├── .env.production                 [NOVO - não commitar]
│   └── Dockerfile                      [NOVO]
│
├── erp-petshop/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Settings/
│   │   │       └── TerminalSettings.tsx [NOVO] Config terminais
│   │   └── services/
│   │       └── hardwareClient.ts        [MODIFICAR] Via backend
│   └── .env.production                  [NOVO]
│
├── hardware-service/
│   ├── src/
│   │   ├── index.js                     [MODIFICAR] Cliente WS
│   │   └── cloudBridge.js               [NOVO] Conexão cloud
│   ├── installer/                        [NOVO]
│   │   ├── installer.nsi                 NSIS script
│   │   └── config-wizard.html            Setup UI
│   └── .env.production.example           [NOVO]
│
├── docker-compose.yml                    [ATUALIZAR] Prod config
├── docs/
│   ├── SECURITY_AUDIT_2024-12-20.md
│   └── PRODUCTION_DEPLOY.md              [NOVO] Guia de deploy
│
└── scripts/
    ├── backup.sh                         [NOVO]
    └── deploy.sh                         [NOVO]
```

---

## 📝 Fases de Implementação

### Fase 1: Segurança Base (1-2 dias)
- [ ] Auth middleware global
- [ ] RBAC middleware
- [ ] JWT secret e cookies seguros
- [ ] Rate limiting
- [ ] Headers de segurança (Helmet)

### Fase 2: WebSocket Bridge (2-3 dias)
- [ ] Backend: Terminal Hub Service
- [ ] Backend: API de gerenciamento de terminais
- [ ] Hardware Service: Cliente WebSocket para cloud
- [ ] Hardware Service: Reconexão automática
- [ ] Hardware Service: Config local persistente

### Fase 3: Frontend de Configuração (1-2 dias)
- [ ] Página de gerenciamento de terminais
- [ ] Status de conexão em tempo real
- [ ] Wizard de primeiro pareamento
- [ ] Integração com fluxo de impressão

### Fase 4: Infraestrutura de Deploy (1-2 dias)
- [ ] Dockerfile para backend
- [ ] docker-compose para produção
- [ ] Script de backup PostgreSQL
- [ ] Configuração Cloudflare Tunnel
- [ ] Documentação de deploy

### Fase 5: Instalador Windows (2-3 dias)
- [ ] Build do Hardware Service para distribuição
- [ ] Instalador NSIS ou Electron-based
- [ ] Wizard de configuração
- [ ] Registro como Windows Service
- [ ] Auto-update mechanism (futuro)

---

## 🔄 Fluxo de Pareamento de Terminal

```mermaid
sequenceDiagram
    participant Admin as Admin (Browser)
    participant Backend as Backend (Cloud)
    participant HW as Hardware Service (Loja)
    
    Admin->>Backend: POST /api/terminals (criar terminal)
    Backend-->>Admin: { id, name, pairingToken }
    
    Note over Admin: Admin copia token ou gera QR
    
    HW->>HW: Instala e abre wizard
    HW->>HW: Admin cola token no wizard
    HW->>Backend: WS Connect + pairingToken
    Backend->>Backend: Valida token, associa terminal
    Backend-->>HW: { success, terminalId }
    Backend-->>Admin: WebSocket: terminal online
    
    Note over Admin,HW: Terminal pareado e conectado!
```

---

## ⚙️ Configurações de Ambiente

### Backend `.env.production`
```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://erp_user:SENHA_FORTE@localhost:5432/erp_petshop

# JWT - GERAR NOVO COM: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=seu-token-de-32-bytes-aqui
JWT_EXPIRES_IN=8h

# CORS
ALLOWED_ORIGINS=https://erp.seudominio.com.br

# Terminal WebSocket
TERMINAL_WS_PATH=/ws/terminal
TERMINAL_SECRET=outro-token-para-terminais
```

### Frontend `.env.production`
```env
VITE_API_URL=https://erp.seudominio.com.br/api
VITE_WS_URL=wss://erp.seudominio.com.br
```

### Hardware Service `.env.production`
```env
# Conexão com o servidor
CLOUD_URL=wss://erp.seudominio.com.br/ws/terminal
TERMINAL_TOKEN=token-gerado-no-pareamento

# Hardware local
PRINTER_ENABLED=true
PRINTER_INTERFACE=//localhost/POS-58 Cabo
DRAWER_ENABLED=false
```

---

## User Review Required

> [!IMPORTANT]
> **Decisões que precisam da sua confirmação:**
>
> 1. **Opção A (WebSocket Bridge)** é aceitável? O Hardware Service conecta ao backend como cliente.
>
> 2. **LXC vs Docker:** Prefere rodar o backend/DB diretamente no LXC ou usar Docker dentro do LXC?
>
> 3. **Instalador Windows:** Precisa ser um instalador .exe formal ou um script PowerShell de setup é suficiente?
>
> 4. **Múltiplas lojas futuras?** Se sim, a arquitetura já suportaria, mas influencia o modelo de dados.

---

## 📊 Estimativa de Esforço

| Fase | Esforço | Dependências |
|------|---------|--------------|
| Fase 1: Segurança | 1-2 dias | Nenhuma |
| Fase 2: WS Bridge | 2-3 dias | Fase 1 |
| Fase 3: Frontend | 1-2 dias | Fase 2 |
| Fase 4: Infra | 1-2 dias | Fase 1 |
| Fase 5: Instalador | 2-3 dias | Fase 2 |

**Total estimado:** 7-12 dias de desenvolvimento

Podemos começar as fases em paralelo (Fase 1 + Fase 4 por exemplo).
