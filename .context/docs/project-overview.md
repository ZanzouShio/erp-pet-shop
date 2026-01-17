# Project Overview - ERP Pet Shop

## 📋 Resumo Executivo

O **ERP Pet Shop** é um sistema de gestão empresarial completo desenvolvido para Pet Shops e Casas de Rações. O sistema oferece controle total sobre operações financeiras, estoque, vendas e emissão de documentos fiscais, com capacidade de funcionamento offline no ponto de venda (PDV).

### Propósito
Unificar a gestão financeira, controle de estoque (incluindo produtos perecíveis e a granel), emissão de notas fiscais e operação de PDV em uma única solução centralizada.

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
├── erp-petshop/             # Frontend React (Gerencial)
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── contexts/        # Context API (Auth, etc.)
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Serviços de API
│   │   └── layouts/         # Layouts de página
│   └── public/
│
├── hardware-service/        # Serviço de integração com periféricos
│   └── src/                 # Comunicação com balança, impressora
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
- Interface touchscreen otimizada
- Modo Offline com SQLite
- Integração com periféricos (balança, impressora, gaveta)
- Múltiplas formas de pagamento
- Emissão de NFC-e

### 4. **Documentos Fiscais**
- NF-e (Modelo 55)
- NFC-e (Modelo 65)
- NFS-e (Serviços)
- CF-e SAT SP (planejado)

### 5. **Vendas e Orçamentos**
- Criação de orçamentos
- Conversão em venda
- Histórico completo
- Programa de Fidelidade

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend Web** | React 18+, Vite, TypeScript, TailwindCSS |
| **Frontend PDV** | Electron, React, SQLite |
| **Backend** | Node.js, Express, TypeScript |
| **Banco de Dados** | PostgreSQL (principal), SQLite (offline) |
| **ORM** | Prisma |
| **Containerização** | Docker, docker-compose |
| **Cache** | Redis (planejado) |

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
| PIX (Itaú, Mercado Pago, Nubank) | Planejado |
| Stone (maquininhas) | Manual |
| Balança Prix Fit 3 | Implementado |
| Impressora Prix (ESC/POS) | Implementado |
| SEFAZ (NF-e/NFC-e) | Planejado |

---

## 📁 Arquivos de Configuração

- `docker-compose.yml` - Configuração de containers
- `.env.example` - Template de variáveis de ambiente
- `backend/prisma/schema.prisma` - Schema do banco de dados
- `restart_dev.bat` - Script de reinicialização do ambiente de desenvolvimento

---

*Última atualização: Janeiro 2026*
