# Segurança - ERP Pet Shop

## 🔐 Visão Geral

Este documento descreve as práticas de segurança implementadas no ERP Pet Shop para proteger dados de clientes, transações financeiras e informações fiscais.

---

## 🔑 Autenticação

### JWT (JSON Web Tokens)

O sistema utiliza JWT para autenticação stateless:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────►│  Valida     │────►│   Gera      │
│  (email,    │     │  Credenciais│     │   JWT       │
│   senha)    │     │             │     │ (24h exp)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Características:**
- Expiração: 24 horas
- Armazenamento: localStorage (frontend)
- Refresh: Usuário deve fazer login novamente

### Senhas

- **Hash:** bcrypt com salt rounds
- **Requisitos mínimos:** (a implementar)
  - 8 caracteres
  - Letras e números
- **Recuperação:** Link por email (planejado)

---

## 👤 Autorização (RBAC)

### Perfis de Acesso

| Perfil | Código | Descrição |
|--------|--------|-----------|
| **Admin** | `admin` | Acesso total ao sistema |
| **Gerente** | `gerente` | Relatórios, cadastros, vendas |
| **Caixa** | `caixa` | Apenas PDV e operações de venda |
| **Estoquista** | `estoquista` | Estoque, produtos, movimentações |
| **Financeiro** | `financeiro` | Contas, conciliação, relatórios |

### Matriz de Permissões

| Módulo | Admin | Gerente | Caixa | Estoquista | Financeiro |
|--------|:-----:|:-------:|:-----:|:----------:|:----------:|
| PDV | ✅ | ✅ | ✅ | ❌ | ❌ |
| Produtos | ✅ | ✅ | 👁️ | ✅ | 👁️ |
| Clientes | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Fornecedores | ✅ | ✅ | ❌ | 👁️ | ✅ |
| Estoque | ✅ | ✅ | ❌ | ✅ | ❌ |
| Financeiro | ✅ | 👁️ | ❌ | ❌ | ✅ |
| Relatórios | ✅ | ✅ | ❌ | 👁️ | ✅ |
| Configurações | ✅ | ❌ | ❌ | ❌ | ❌ |
| Usuários | ✅ | ❌ | ❌ | ❌ | ❌ |

> ✅ = Acesso total | 👁️ = Somente leitura | ❌ = Sem acesso

---

## 🔒 Proteção de Dados

### Dados Sensíveis

| Dado | Proteção |
|------|----------|
| Senhas | Hash bcrypt |
| Certificados digitais | Criptografados em disco |
| Chaves de API | Variáveis de ambiente |
| Dados de cartão | Não armazenados |
| CPF/CNPJ | Armazenados (necessário para NF-e) |

### HTTPS

- **Obrigatório** em produção
- Certificado SSL/TLS
- Redirect automático HTTP → HTTPS

### LGPD (Lei Geral de Proteção de Dados)

**Direitos do titular:**
- Cliente pode recusar cadastro
- Venda sem identificação permitida
- Direito à exclusão de dados (a implementar)

**Práticas implementadas:**
- Coleta mínima de dados
- Finalidade específica (operacional)
- Logs de acesso a dados pessoais (auditoria)

---

## 📋 Auditoria

### Logs de Ações Críticas

Todas as ações críticas são registradas na tabela `audit_logs`:

| Ação | Dados Registrados |
|------|-------------------|
| Login/Logout | Usuário, IP, timestamp |
| Exclusão de item em venda | Usuário, item, motivo, timestamp |
| Cancelamento de venda | Usuário, venda, motivo, timestamp |
| Alteração de preço | Usuário, produto, valor anterior/novo |
| Sangria/Suprimento | Usuário, valor, motivo |
| Alteração de estoque manual | Usuário, produto, quantidade |

### Campos Obrigatórios

Para ações destrutivas (exclusão, cancelamento):
- **Justificativa:** Campo de texto obrigatório
- **Aprovação:** Pode requerer supervisor (configurável)

### Retenção de Logs

- **Período:** 5 anos (requisito fiscal)
- **Backup:** Incluído no backup diário

---

## 🛡️ Proteções contra Ataques

### SQL Injection

- **Mitigação:** Prisma ORM com queries parametrizadas
- Nunca concatenar strings em queries

```javascript
// ❌ ERRADO
prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`

// ✅ CORRETO (Prisma já protege)
prisma.users.findUnique({ where: { id: userId } })
```

### XSS (Cross-Site Scripting)

- **Mitigação:** React escapa HTML automaticamente
- Não usar `dangerouslySetInnerHTML`
- Sanitizar inputs quando necessário

### CSRF (Cross-Site Request Forgery)

- **Mitigação:** Token JWT em header Authorization
- SameSite cookies (quando aplicável)

### Rate Limiting

- **Limite:** 100 requisições/minuto por IP (planejado)
- Proteção contra brute force em login
- Bloqueio temporário após tentativas falhas

---

## 💾 Backup e Recuperação

### Backup Automático

| Tipo | Frequência | Horário | Retenção |
|------|------------|---------|----------|
| Completo | Diário | 03:00 | 30 dias |
| Incremental | 6 em 6h | 06:00, 12:00, 18:00, 00:00 | 7 dias |

### Dados Incluídos

- Banco de dados PostgreSQL
- Uploads de imagens
- Certificados digitais
- Configurações do sistema

### Recuperação

- **RPO (Recovery Point Objective):** 24 horas
- **RTO (Recovery Time Objective):** 8 horas
- Procedimento documentado e testado periodicamente

---

## 🔧 Configurações de Segurança

### Variáveis de Ambiente

```env
# NUNCA commitar no repositório!
DATABASE_URL=postgresql://...
JWT_SECRET=<chave-segura-256-bits>
PIX_CLIENT_ID=...
PIX_CLIENT_SECRET=...
CERTIFICATE_PASSWORD=...
```

### Checklist de Produção

- [ ] HTTPS configurado
- [ ] Variáveis de ambiente seguras
- [ ] Rate limiting ativo
- [ ] Backup automático funcionando
- [ ] Logs de auditoria ativos
- [ ] Certificado digital válido
- [ ] Senhas fortes para todos os usuários admin

---

## ⚠️ Incidentes de Segurança

### Procedimento

1. **Identificar** o tipo de incidente
2. **Isolar** sistemas afetados
3. **Notificar** responsáveis
4. **Investigar** causa raiz
5. **Corrigir** vulnerabilidade
6. **Documentar** lições aprendidas

### Contatos

- Responsável técnico: [A definir]
- Email: [A definir]

---

*Última atualização: Janeiro 2026*
