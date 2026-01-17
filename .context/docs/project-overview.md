# Project Overview - ERP Pet Shop

## 📋 Resumo Executivo

O **ERP Pet Shop** é um sistema de gestão empresarial completo desenvolvido para Pet Shops e Casas de Rações. O sistema oferece controle total sobre operações financeiras, estoque, vendas e emissão de documentos fiscais, com integração de periféricos via módulo desktop complementar (Hardware Service).

### Propósito
Unificar a gestão financeira, controle de estoque (incluindo produtos perecíveis e a granel), emissão de notas fiscais e operação de PDV em uma única solução centralizada, com capacidade de integração com periféricos como impressoras térmicas, balanças e gavetas de dinheiro.

### Público-Alvo
- Proprietário da empresa
- Operadores de caixa/PDV
- Gerentes de loja
- Equipe de estoque
- Equipe financeira

---

## 🏗️ Estrutura do Projeto

```
ERP Pet Shop/
├── backend/                 # API REST + Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores de rotas
│   │   ├── middleware/      # Autenticação, validação
│   │   ├── routes/          # Definição de rotas
│   │   └── generated/       # Código gerado pelo Prisma
│   └── prisma/              # Schema e migrações
│
├── erp-petshop/             # Frontend React (Sistema Web)
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── contexts/        # Context API (Auth, etc.)
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Serviços de API
│   │   └── layouts/         # Layouts de página
│   └── public/
│
├── hardware-service/        # Módulo Desktop para periféricos
│   └── src/
│       ├── index.js         # WebSocket server (porta 3002)
│       └── devices/         # Drivers de periféricos
│           ├── printer.js   # Impressora térmica (ESC/POS)
│           ├── scale.js     # Balança Toledo (serial)
│           ├── drawer.js    # Gaveta de dinheiro
│           └── scanner.js   # Leitor código de barras
│
└── docs/                    # Documentação do projeto
```

---

## 🎯 Funcionalidades Principais

### 1. **Gestão Financeira**
- Contas a Pagar e Receber
- Fluxo de Caixa
- Conciliação Bancária
- Relatórios Financeiros (DRE, Balancete)

### 2. **Gestão de Estoque**
- Cadastro de Produtos (SKU, EAN, NCM)
- Produtos a Granel (venda por peso)
- Controle de Validade (FIFO)
- Múltiplos Locais de Estoque
- Importação de XML de NF-e

### 3. **PDV (Ponto de Venda)**
- Interface web responsiva
- Integração com Hardware Service via WebSocket
- Impressão de cupons não fiscais
- Múltiplas formas de pagamento
- Emissão de NFC-e (planejado)

### 4. **Documentos Fiscais**
- NF-e (Modelo 55) - planejado
- NFC-e (Modelo 65) - planejado
- NFS-e (Serviços) - planejado

### 5. **Vendas e Orçamentos**
- Criação de orçamentos
- Conversão em venda
- Histórico completo
- Programa de Fidelidade/Cashback

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend Web** | React 18+, Vite, TypeScript, TailwindCSS |
| **Backend** | Node.js, Express, JavaScript |
| **Banco de Dados** | PostgreSQL 15+ |
| **ORM** | Prisma |
| **Hardware Service** | Node.js, WebSocket, node-thermal-printer |
| **Containerização** | Docker, docker-compose |

---

## 🔌 Hardware Service

O **Hardware Service** é um módulo desktop que roda localmente (ws://localhost:3002) e permite que a aplicação web se comunique com periféricos físicos.

### Periféricos Suportados

| Periférico | Protocolo | Status |
|------------|-----------|--------|
| Impressora Térmica | ESC/POS (Epson, Brother, Elgin) | ✅ Implementado |
| Balança Digital | Serial Toledo | ✅ Implementado |
| Gaveta de Dinheiro | Serial/ESC/POS | ✅ Implementado |
| Leitor de Código de Barras | USB HID | ✅ Implementado |

### Comunicação WebSocket

```javascript
// Frontend conecta ao Hardware Service
const ws = new WebSocket('ws://localhost:3002');

// Enviar comando
ws.send(JSON.stringify({ action: 'printReceipt', data: {...} }));

// Receber eventos
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'barcode') console.log('Código lido:', msg.data);
};
```

---

## 📊 Escala e Performance

| Métrica | Valor |
|---------|-------|
| Usuários simultâneos | 1-10 |
| PDVs simultâneos | até 10 |
| Produtos cadastrados | 500+ |
| Volume de vendas | ~200/dia |
| Tempo de resposta API | < 200ms (p95) |
| Carregamento de telas | < 2 segundos |
| Comando Hardware Service | < 100ms |

---

## 🔐 Segurança

- **Autenticação:** JWT com expiração de 24h
- **Perfis de Acesso:** Admin, Gerente, Caixa, Estoquista, Financeiro
- **Criptografia:** HTTPS obrigatório, dados sensíveis criptografados
- **Auditoria:** Log detalhado de todas as ações críticas
- **Backup:** Automático diário às 3h
- **Conformidade:** LGPD

---

## 🔗 Integrações

| Sistema | Status |
|---------|--------|
| PIX (QR Code) | Planejado |
| Stone (maquininhas) | Manual |
| Impressora térmica (via Hardware Service) | ✅ Implementado |
| Balança digital (via Hardware Service) | ✅ Implementado |
| SEFAZ (NF-e/NFC-e) | Planejado |

---

## 📁 Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração de containers |
| `.env.example` | Template de variáveis de ambiente |
| `backend/prisma/schema.prisma` | Schema do banco de dados |
| `hardware-service/.env` | Configuração dos periféricos |
| `restart_dev.bat` | Script de reinicialização |

---

## ⚠️ Requisitos de Operação

- **Conexão com Internet:** Obrigatória para operação do sistema
- **Hardware Service:** Deve estar rodando para usar periféricos
- **Navegador:** Chrome 100+, Firefox 100+, Edge 100+
- **Resolução mínima:** 1366x768

---

*Última atualização: Janeiro 2026*
