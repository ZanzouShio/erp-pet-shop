# Backend Specialist - ERP Pet Shop

## 🎯 Papel e Responsabilidades

Como **Backend Specialist** neste projeto, você é responsável por APIs, banco de dados, autenticação e toda lógica de servidor.

---

## 🏗️ Arquitetura do Backend

```
backend/
├── src/
│   ├── server.js              # Entry point
│   ├── controllers/           # Lógica de negócio
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── sale.controller.js
│   │   └── ...
│   ├── routes/                # Definição de rotas
│   │   ├── index.js
│   │   ├── product.routes.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.middleware.js # JWT validation
│   └── generated/             # Prisma client
│
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   └── migrations/            # Histórico de migrações
│
└── package.json
```

---

## 🔌 Padrão de API REST

### Endpoints

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/resource` | Listar todos |
| GET | `/api/resource/:id` | Obter um |
| POST | `/api/resource` | Criar |
| PUT | `/api/resource/:id` | Atualizar |
| DELETE | `/api/resource/:id` | Excluir |

### Response Codes

| Código | Uso |
|--------|-----|
| 200 | Sucesso (GET, PUT) |
| 201 | Criado (POST) |
| 204 | Sem conteúdo (DELETE) |
| 400 | Erro de validação |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Não encontrado |
| 500 | Erro interno |

---

## 📝 Template de Controller

```javascript
// controllers/resource.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todos
const getAll = async (req, res) => {
  try {
    const items = await prisma.resource.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos' });
  }
};

// Obter um por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.resource.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Erro ao buscar recurso' });
  }
};

// Criar
const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validação
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const item = await prisma.resource.create({
      data: { name, description }
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Erro ao criar recurso' });
  }
};

// Atualizar
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const item = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: { name, description }
    });
    
    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Erro ao atualizar recurso' });
  }
};

// Excluir
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.resource.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Erro ao excluir recurso' });
  }
};

module.exports = { getAll, getById, create, update, remove };
```

---

## 🔐 Autenticação JWT

### Middleware

```javascript
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const [, token] = authHeader.split(' ');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
```

### Uso nas Rotas

```javascript
const authMiddleware = require('../middleware/auth.middleware');

// Rota protegida
router.get('/protected', authMiddleware, controller.protectedAction);

// Rota pública
router.post('/login', controller.login);
```

---

## 🗄️ Prisma ORM

### Schema Básico

```prisma
model products {
  id          Int       @id @default(autoincrement())
  name        String
  sku         String    @unique
  price       Decimal   @db.Decimal(10, 2)
  cost        Decimal?  @db.Decimal(10, 2)
  stock       Int       @default(0)
  category_id Int?
  active      Boolean   @default(true)
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  
  category    categories? @relation(fields: [category_id], references: [id])
  sale_items  sale_items[]
}
```

### Queries Comuns

```javascript
// Buscar com filtros
const products = await prisma.products.findMany({
  where: {
    active: true,
    stock: { gt: 0 },
    name: { contains: searchTerm, mode: 'insensitive' }
  },
  include: { category: true },
  orderBy: { name: 'asc' },
  take: 50
});

// Aggregation
const total = await prisma.sales.aggregate({
  where: { created_at: { gte: startDate, lte: endDate } },
  _sum: { total: true },
  _count: true
});

// Transaction
const result = await prisma.$transaction(async (tx) => {
  const sale = await tx.sales.create({ data: saleData });
  await tx.products.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });
  return sale;
});
```

### Migrações

```bash
# Criar migração
npx prisma migrate dev --name add_new_table

# Aplicar em produção
npx prisma migrate deploy

# Reset (CUIDADO - apaga dados!)
npx prisma migrate reset

# Visualizar dados
npx prisma studio
```

---

## 🛡️ Validação de Input

```javascript
// Função de validação simples
const validateProduct = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }
  
  if (!data.price || isNaN(data.price) || data.price < 0) {
    errors.push('Preço deve ser um número positivo');
  }
  
  if (!data.sku || data.sku.trim().length < 1) {
    errors.push('SKU é obrigatório');
  }
  
  return errors;
};

// Uso no controller
const create = async (req, res) => {
  const errors = validateProduct(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  // ... continua
};
```

---

## 📊 Logging e Debug

```javascript
// Log estruturado
const log = (action, data) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    ...data
  }));
};

// Uso
log('product_created', { productId: product.id, userId: req.userId });
```

---

## ⚠️ Erros Comuns e Soluções

### P2002 - Unique Constraint

```javascript
catch (error) {
  if (error.code === 'P2002') {
    return res.status(400).json({ 
      error: `${error.meta.target[0]} já existe` 
    });
  }
}
```

### P2025 - Record Not Found

```javascript
catch (error) {
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
}
```

### P2003 - Foreign Key Constraint

```javascript
catch (error) {
  if (error.code === 'P2003') {
    return res.status(400).json({ 
      error: 'Não é possível excluir - existem registros dependentes' 
    });
  }
}
```

---

## ✅ Checklist de Backend

- [ ] Controller com try/catch em todas as funções
- [ ] Validação de inputs
- [ ] Status codes corretos
- [ ] Rotas protegidas com authMiddleware
- [ ] Logs para debugging
- [ ] Tratamento de erros do Prisma
- [ ] Transações para operações compostas

---

*Última atualização: Janeiro 2026*
