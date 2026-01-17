# Database Specialist - ERP Pet Shop

## 🎯 Papel e Responsabilidades

Como **Database Specialist** neste projeto, você é responsável pelo schema do banco de dados, queries, migrações e otimização de performance.

---

## 🗄️ Tecnologias

| Componente | Tecnologia |
|------------|------------|
| Banco Principal | PostgreSQL 15 |
| Banco Offline | SQLite |
| ORM | Prisma |
| Conectividade | prisma/client |

---

## 📁 Estrutura do Schema

```
backend/prisma/
├── schema.prisma          # Schema principal
├── migrations/            # Histórico de migrações
│   ├── 20240101_init/
│   └── 20240115_add_feature/
└── seed.ts                # Dados iniciais (se houver)
```

---

## 📝 Entidades Principais

```prisma
// Exemplo do schema atual

model users {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  password_hash String
  name          String
  role          String    @default("caixa")
  active        Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  sales         sales[]
  audit_logs    audit_logs[]
}

model products {
  id          Int         @id @default(autoincrement())
  name        String
  sku         String      @unique
  ean         String?
  price       Decimal     @db.Decimal(10, 2)
  cost        Decimal?    @db.Decimal(10, 2)
  stock       Int         @default(0)
  min_stock   Int         @default(0)
  category_id Int?
  supplier_id Int?
  active      Boolean     @default(true)
  created_at  DateTime    @default(now())
  updated_at  DateTime    @updatedAt
  
  category    categories?  @relation(fields: [category_id], references: [id])
  supplier    suppliers?   @relation(fields: [supplier_id], references: [id])
  sale_items  sale_items[]
}

model sales {
  id          Int         @id @default(autoincrement())
  customer_id Int?
  user_id     Int
  total       Decimal     @db.Decimal(10, 2)
  discount    Decimal?    @db.Decimal(10, 2)
  payment_method String
  status      String      @default("completed")
  created_at  DateTime    @default(now())
  
  customer    customers?  @relation(fields: [customer_id], references: [id])
  user        users       @relation(fields: [user_id], references: [id])
  items       sale_items[]
}

model sale_items {
  id          Int       @id @default(autoincrement())
  sale_id     Int
  product_id  Int
  quantity    Int
  unit_price  Decimal   @db.Decimal(10, 2)
  subtotal    Decimal   @db.Decimal(10, 2)
  
  sale        sales     @relation(fields: [sale_id], references: [id])
  product     products  @relation(fields: [product_id], references: [id])
}
```

---

## 🔄 Migrações

### Criar Nova Migração

```bash
# Após alterar schema.prisma
npx prisma migrate dev --name descricao_da_mudanca

# Exemplo
npx prisma migrate dev --name add_loyalty_points_to_customers
```

### Aplicar em Produção

```bash
npx prisma migrate deploy
```

### Verificar Status

```bash
npx prisma migrate status
```

### Reset (⚠️ Apaga dados!)

```bash
npx prisma migrate reset
```

---

## 📊 Queries Prisma

### CRUD Básico

```javascript
// CREATE
const product = await prisma.products.create({
  data: {
    name: 'Ração Premium 15kg',
    sku: 'RAC-PREM-15',
    price: 189.90,
    stock: 50
  }
});

// READ - Um
const product = await prisma.products.findUnique({
  where: { id: 1 }
});

// READ - Vários
const products = await prisma.products.findMany({
  where: { active: true },
  orderBy: { name: 'asc' }
});

// UPDATE
const product = await prisma.products.update({
  where: { id: 1 },
  data: { price: 199.90 }
});

// DELETE
await prisma.products.delete({
  where: { id: 1 }
});
```

### Filtros Avançados

```javascript
// Múltiplas condições
const products = await prisma.products.findMany({
  where: {
    AND: [
      { active: true },
      { stock: { gt: 0 } },
      {
        OR: [
          { name: { contains: 'ração', mode: 'insensitive' } },
          { sku: { startsWith: 'RAC' } }
        ]
      }
    ]
  }
});

// Paginação
const products = await prisma.products.findMany({
  skip: 20,
  take: 10,
  orderBy: { created_at: 'desc' }
});
```

### Relacionamentos

```javascript
// Include (eager loading)
const sale = await prisma.sales.findUnique({
  where: { id: 1 },
  include: {
    customer: true,
    items: {
      include: { product: true }
    }
  }
});

// Select específico
const sale = await prisma.sales.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    total: true,
    customer: {
      select: { name: true, email: true }
    }
  }
});
```

### Agregações

```javascript
// Soma e contagem
const stats = await prisma.sales.aggregate({
  where: {
    created_at: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31')
    }
  },
  _sum: { total: true },
  _count: { id: true },
  _avg: { total: true }
});

// Group by
const salesByDay = await prisma.sales.groupBy({
  by: ['payment_method'],
  _sum: { total: true },
  _count: { id: true }
});
```

### Transações

```javascript
// Venda com baixa de estoque
const result = await prisma.$transaction(async (tx) => {
  // 1. Criar venda
  const sale = await tx.sales.create({
    data: {
      customer_id: customerId,
      user_id: userId,
      total: total,
      payment_method: 'dinheiro'
    }
  });
  
  // 2. Criar itens
  for (const item of items) {
    await tx.sale_items.create({
      data: {
        sale_id: sale.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }
    });
    
    // 3. Baixar estoque
    await tx.products.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    });
  }
  
  return sale;
});
```

---

## 🚀 Otimização

### Índices

```prisma
model products {
  id   Int    @id @default(autoincrement())
  sku  String @unique
  name String
  
  @@index([name])           // Índice em name
  @@index([sku, name])      // Índice composto
}
```

### Evitar N+1

```javascript
// ❌ N+1 Problem
const sales = await prisma.sales.findMany();
for (const sale of sales) {
  const items = await prisma.sale_items.findMany({ 
    where: { sale_id: sale.id } 
  }); // N queries!
}

// ✅ Uma query
const sales = await prisma.sales.findMany({
  include: { items: true }
});
```

### Selecionar Apenas o Necessário

```javascript
// ❌ Carrega tudo
const products = await prisma.products.findMany();

// ✅ Apenas campos necessários
const products = await prisma.products.findMany({
  select: { id: true, name: true, price: true }
});
```

---

## 🛡️ Boas Práticas

### 1. Sempre usar Decimal para dinheiro

```prisma
price  Decimal @db.Decimal(10, 2)  // ✅
price  Float                        // ❌ Impreciso!
```

### 2. Soft delete quando apropriado

```prisma
model products {
  active      Boolean   @default(true)
  deleted_at  DateTime? // null = não deletado
}
```

### 3. Timestamps automáticos

```prisma
created_at  DateTime  @default(now())
updated_at  DateTime  @updatedAt
```

### 4. Foreign keys com constraints

```prisma
model sale_items {
  product_id  Int
  product     products @relation(fields: [product_id], references: [id])
}
```

---

## 🔍 Debugging

### Ver Queries

```javascript
// Em .env
DEBUG="prisma:query"

// Ou no código
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

### Prisma Studio

```bash
npx prisma studio
# Abre http://localhost:5555
```

---

## ⚠️ Erros Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| P2002 | Unique constraint failed | Valor duplicado - verificar antes de inserir |
| P2003 | Foreign key constraint failed | Registro referenciado não existe |
| P2025 | Record not found | ID inválido - verificar existência |
| P2024 | Timed out | Query lenta - otimizar |

---

*Última atualização: Janeiro 2026*
