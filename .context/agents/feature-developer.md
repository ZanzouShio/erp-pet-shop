# Feature Developer - ERP Pet Shop

## 🎯 Papel e Responsabilidades

Como **Feature Developer** neste projeto, seu objetivo é implementar novas funcionalidades seguindo os padrões estabelecidos, garantindo qualidade e integração com o sistema existente.

---

## 📁 Arquivos-Chave para Conhecer

### Backend

| Arquivo | Propósito |
|---------|-----------|
| `backend/src/server.js` | Entry point do servidor |
| `backend/src/routes/` | Definição de rotas da API |
| `backend/src/controllers/` | Lógica de negócio |
| `backend/src/middleware/auth.middleware.js` | Autenticação JWT |
| `backend/prisma/schema.prisma` | Schema do banco de dados |

### Frontend

| Arquivo | Propósito |
|---------|-----------|
| `erp-petshop/src/App.tsx` | Entry point e rotas |
| `erp-petshop/src/pages/` | Páginas da aplicação |
| `erp-petshop/src/components/` | Componentes reutilizáveis |
| `erp-petshop/src/contexts/AuthContext.tsx` | Autenticação |
| `erp-petshop/src/services/api.ts` | Cliente HTTP |
| `erp-petshop/src/hooks/` | Custom hooks |

---

## 🔄 Workflow para Nova Feature

### 1. Entender o Requisito

1. Ler o PRD (`prd-erp-petshop.md`) para contexto de negócio
2. Identificar componentes afetados
3. Planejar abordagem técnica

### 2. Criar Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

### 3. Backend (se necessário)

**A. Schema do Banco (Prisma)**

```prisma
// backend/prisma/schema.prisma
model nova_entidade {
  id          Int      @id @default(autoincrement())
  nome        String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

**B. Migração**

```bash
cd backend
npx prisma migrate dev --name add_nova_entidade
```

**C. Controller**

```javascript
// backend/src/controllers/novaEntidade.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const items = await prisma.nova_entidade.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const item = await prisma.nova_entidade.create({
      data: req.body
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create };
```

**D. Rotas**

```javascript
// backend/src/routes/novaEntidade.routes.js
const router = require('express').Router();
const controller = require('../controllers/novaEntidade.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, controller.getAll);
router.post('/', authMiddleware, controller.create);

module.exports = router;
```

**E. Registrar no Server**

```javascript
// backend/src/server.js
const novaEntidadeRoutes = require('./routes/novaEntidade.routes');
app.use('/api/nova-entidade', novaEntidadeRoutes);
```

### 4. Frontend

**A. Tipos**

```typescript
// erp-petshop/src/types/index.ts
export interface NovaEntidade {
  id: number;
  nome: string;
  created_at: string;
}
```

**B. Serviço de API**

```typescript
// erp-petshop/src/services/novaEntidadeService.ts
import { authFetch } from './api';

export const novaEntidadeService = {
  getAll: async () => {
    const response = await authFetch('/api/nova-entidade');
    return response.json();
  },
  
  create: async (data: Partial<NovaEntidade>) => {
    const response = await authFetch('/api/nova-entidade', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

**C. Componente/Página**

```tsx
// erp-petshop/src/pages/NovaEntidade.tsx
import { useState, useEffect } from 'react';
import { novaEntidadeService } from '../services/novaEntidadeService';

export function NovaEntidadePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await novaEntidadeService.getAll();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nova Entidade</h1>
      {/* Conteúdo */}
    </div>
  );
}
```

**D. Adicionar Rota**

```tsx
// erp-petshop/src/App.tsx
import { NovaEntidadePage } from './pages/NovaEntidade';

// No router
<Route path="/nova-entidade" element={<NovaEntidadePage />} />
```

### 5. Testar

- Testar fluxo completo (criar, listar, editar, deletar)
- Verificar permissões
- Testar edge cases

### 6. Commit e PR

```bash
git add .
git commit -m "feat(nova-entidade): implementar CRUD básico"
git push origin feature/nome-da-feature
```

---

## ✅ Checklist de Nova Feature

- [ ] Branch criada a partir de `develop`
- [ ] Schema Prisma atualizado (se aplicável)
- [ ] Migração criada e aplicada
- [ ] Controller implementado
- [ ] Rotas registradas
- [ ] Tipos TypeScript definidos
- [ ] Serviço de API criado
- [ ] Página/Componente implementado
- [ ] Rota adicionada no App.tsx
- [ ] Sidebar atualizado (se necessário)
- [ ] Testado localmente
- [ ] Commits seguem convenção
- [ ] PR criado para `develop`

---

## ⚠️ Armadilhas Comuns

1. **Esquecer `authMiddleware`** nas rotas protegidas
2. **Não usar `authFetch`** no frontend (requisições sem token)
3. **Não tratar erros** adequadamente
4. **Esquecer de atualizar tipos** no TypeScript
5. **Não validar inputs** no backend
6. **Hardcoded values** ao invés de usar variáveis de ambiente

---

## 📚 Referências

- [Architecture](../.context/docs/architecture.md)
- [Data Flow](../.context/docs/data-flow.md)
- [PRD](../prd-erp-petshop.md)

---

*Última atualização: Janeiro 2026*
