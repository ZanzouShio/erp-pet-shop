---
name: Security Auditor
description: Identify security vulnerabilities and ensure compliance for ERP Pet Shop
status: filled
generated: 2026-01-17
---

# Security Auditor Agent Playbook

## 🎯 Mission

O Security Auditor é responsável por identificar vulnerabilidades de segurança, garantir conformidade com regulamentações (LGPD), e implementar boas práticas de segurança no ERP Pet Shop.

---

## 🔐 Modelo de Segurança Atual

### Autenticação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────►│   Backend   │────►│   Gerar     │
│  (email,    │     │  Valida     │     │   JWT       │
│   senha)    │     │  bcrypt     │     │  (24h exp)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Arquivos relevantes:**
- `backend/src/controllers/auth.controller.js`
- `backend/src/middleware/auth.middleware.js`
- `erp-petshop/src/contexts/AuthContext.tsx`

### Autorização (RBAC)

| Perfil | Nível | Acesso |
|--------|-------|--------|
| `admin` | 5 | Acesso total |
| `gerente` | 4 | Relatórios, cadastros, vendas |
| `financeiro` | 3 | Contas, conciliação |
| `estoquista` | 2 | Estoque, produtos |
| `caixa` | 1 | PDV apenas |

---

## 🔍 Checklist de Auditoria

### 1. Autenticação

- [ ] Senhas com hash bcrypt (salt rounds >= 10)
- [ ] JWT com secret robusto (256 bits)
- [ ] Expiração de token configurada (24h)
- [ ] Rate limiting em login (prevenir brute force)
- [ ] Logout invalida token no cliente

### 2. Autorização

- [ ] Verificação de role em todas as rotas protegidas
- [ ] Middleware `checkRole()` aplicado corretamente
- [ ] Usuário não pode escalar próprias permissões
- [ ] Rotas de admin isoladas

### 3. Validação de Inputs

- [ ] Prisma ORM previne SQL injection
- [ ] Validação de tipos no frontend e backend
- [ ] Sanitização de dados sensíveis (CPF, CNPJ)
- [ ] Limite de tamanho em uploads

### 4. Proteção de Dados

- [ ] Senhas nunca retornadas na API
- [ ] Dados sensíveis não logados
- [ ] HTTPS em produção
- [ ] Certificados em variáveis de ambiente

### 5. Hardware Service

- [ ] Validação de origem (ALLOWED_ORIGINS)
- [ ] API key opcional configurada
- [ ] Apenas localhost aceito
- [ ] Comandos validados antes de execução

---

## 🛡️ Vulnerabilidades Comuns

### OWASP Top 10 - Aplicabilidade

| Vulnerabilidade | Risco no Projeto | Mitigação |
|-----------------|------------------|-----------|
| **Injection** | Médio | Prisma ORM, queries parametrizadas |
| **Broken Auth** | Alto | JWT, bcrypt, rate limiting |
| **Sensitive Data** | Alto | HTTPS, não logar senhas |
| **XXE** | Baixo | Não processamos XML externo |
| **Broken Access** | Alto | RBAC, middleware checkRole |
| **Security Misconfig** | Médio | Variáveis de ambiente |
| **XSS** | Médio | React escapa por padrão |
| **Insecure Deserial** | Baixo | JSON.parse com try/catch |
| **Vulnerable Components** | Médio | npm audit regular |
| **Insufficient Logging** | Médio | audit_logs implementado |

---

## 📋 Áreas Críticas para Auditoria

### Alta Prioridade

| Área | Arquivo | Risco |
|------|---------|-------|
| **Login** | `auth.controller.js` | Acesso não autorizado |
| **Vendas** | `sale.controller.js` | Fraude financeira |
| **Caixa** | `cashRegister.controller.js` | Desvio de dinheiro |
| **Usuários** | `user.controller.js` | Escalação de privilégios |

### Média Prioridade

| Área | Arquivo | Risco |
|------|---------|-------|
| **Clientes** | `customers.controller.js` | Vazamento de dados (LGPD) |
| **Relatórios** | Exportação de dados | Dados sensíveis expostos |
| **Hardware Service** | `index.js` | Acesso não autorizado |

---

## 🔧 Implementações de Segurança

### Rate Limiting (a implementar)

```javascript
// backend/src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});

// Aplicar em /api/auth/login
app.use('/api/auth/login', loginLimiter);
```

### Validação de Input

```javascript
// Sempre validar antes de processar
const validateSaleInput = (req, res, next) => {
  const { items, total, payment_method } = req.body;
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items inválidos' });
  }
  
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ error: 'Total inválido' });
  }
  
  const validMethods = ['DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX'];
  if (!validMethods.includes(payment_method)) {
    return res.status(400).json({ error: 'Método de pagamento inválido' });
  }
  
  next();
};
```

### Proteção de Dados Sensíveis

```javascript
// Nunca retornar senha na API
const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// Não logar dados sensíveis
const sanitizeLog = (data) => {
  const { password, token, certificate, ...safeData } = data;
  return safeData;
};
```

---

## 📊 Auditoria de Logs

### Eventos Auditados

| Evento | Dados Registrados |
|--------|-------------------|
| Login bem-sucedido | user_id, IP, timestamp |
| Login falho | email, IP, timestamp |
| Exclusão de item | user_id, item, motivo |
| Cancelamento venda | user_id, venda_id, motivo |
| Alteração de preço | user_id, produto_id, valor_anterior, valor_novo |
| Sangria/Suprimento | user_id, valor, motivo |

### Tabela audit_logs

```sql
SELECT * FROM audit_logs 
WHERE action = 'LOGIN_FAILED' 
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🔒 LGPD - Conformidade

### Dados Pessoais Armazenados

| Dado | Tabela | Finalidade | Base Legal |
|------|--------|------------|------------|
| CPF | customers | NF-e, Fidelidade | Obrigação legal |
| Nome | customers | Identificação | Contrato |
| Telefone | customers | Contato | Consentimento |
| Email | customers | Contato | Consentimento |
| Endereço | customers | Entrega | Contrato |

### Direitos do Titular

- [ ] Acesso aos dados (a implementar)
- [ ] Correção de dados (disponível via cadastro)
- [ ] Exclusão de dados (a implementar)
- [ ] Portabilidade (a implementar)

---

## 🚨 Resposta a Incidentes

### Procedimento

1. **Detectar** - Identificar o incidente
2. **Conter** - Isolar sistemas afetados
3. **Erradicar** - Remover causa raiz
4. **Recuperar** - Restaurar serviços
5. **Documentar** - Registrar lições aprendidas

### Contatos

| Papel | Responsável |
|-------|-------------|
| Responsável Técnico | [A definir] |
| DPO (LGPD) | [A definir] |

---

## 📖 Documentação de Referência

- [Segurança do Sistema](../docs/security.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

## 🤝 Colaboração

| Quando | Colaborar com |
|--------|---------------|
| Implementar correção | Backend Specialist |
| Revisar código | Code Reviewer |
| Arquitetura | Architect Specialist |
| Deploy seguro | DevOps Specialist |

---

*Última atualização: Janeiro 2026*
