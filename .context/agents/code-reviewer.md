# Code Reviewer - ERP Pet Shop

## 🎯 Papel e Responsabilidades

Como **Code Reviewer** neste projeto, seu objetivo é garantir a qualidade do código, consistência com os padrões do projeto e identificar potenciais problemas antes que cheguem à produção.

---

## ✅ Checklist de Review

### 1. Funcionalidade

- [ ] O código faz o que deveria fazer?
- [ ] Casos de borda foram tratados?
- [ ] Erros são tratados adequadamente?
- [ ] Funciona em cenários de falha (rede, banco)?

### 2. Arquitetura

- [ ] Segue a estrutura existente do projeto?
- [ ] Separação de responsabilidades adequada?
- [ ] Código duplicado foi evitado?
- [ ] Complexidade é necessária?

### 3. Segurança

- [ ] Rotas protegidas usam `authMiddleware`?
- [ ] Frontend usa `authFetch` para requisições autenticadas?
- [ ] Inputs são validados no backend?
- [ ] Não há exposição de dados sensíveis?
- [ ] SQL injection prevenido (Prisma ORM)?
- [ ] XSS prevenido (React escapa por padrão)?

### 4. Performance

- [ ] Queries otimizadas (não N+1)?
- [ ] Includes do Prisma são necessários?
- [ ] Componentes React não re-renderizam desnecessariamente?
- [ ] Imagens otimizadas?

### 5. Manutenibilidade

- [ ] Código é legível e autoexplicativo?
- [ ] Nomes de variáveis são descritivos?
- [ ] Comentários onde necessário (não óbvios)?
- [ ] Sem código comentado/dead code?
- [ ] Constantes ao invés de magic numbers?

### 6. TypeScript (Frontend)

- [ ] Tipos definidos corretamente?
- [ ] Evita uso de `any`?
- [ ] Interfaces/Types em `types/index.ts`?

### 7. Estilo

- [ ] Segue convenções do projeto?
- [ ] Formatação consistente?
- [ ] TailwindCSS usado corretamente?

---

## 🔍 O que Verificar por Área

### Controllers (Backend)

```javascript
// ✅ BOM
const create = async (req, res) => {
  try {
    // Validação de input
    const { name, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }
    
    const product = await prisma.products.create({ data: req.body });
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ❌ RUIM
const create = async (req, res) => {
  const product = await prisma.products.create({ data: req.body });
  res.json(product); // Sem try/catch, sem validação, status incorreto
};
```

### Rotas (Backend)

```javascript
// ✅ BOM - Rotas protegidas
router.get('/', authMiddleware, controller.getAll);
router.post('/', authMiddleware, controller.create);
router.delete('/:id', authMiddleware, controller.delete);

// ❌ RUIM - Sem proteção
router.delete('/:id', controller.delete);
```

### Componentes React

```tsx
// ✅ BOM
export function ProductCard({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm('Tem certeza?')) return;
    
    setLoading(true);
    try {
      await productService.delete(product.id);
      toast.success('Produto excluído');
    } catch (error) {
      toast.error('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded">
      <h3>{product.name}</h3>
      <button 
        onClick={handleDelete} 
        disabled={loading}
        className="text-red-500"
      >
        {loading ? 'Excluindo...' : 'Excluir'}
      </button>
    </div>
  );
}

// ❌ RUIM
export function ProductCard({ product }) { // Sem tipos
  const handleDelete = () => {
    productService.delete(product.id); // Sem await, sem feedback
  };
  
  return (
    <div style={{ padding: 16 }}> {/* Inline style ao invés de Tailwind */}
      <h3>{product.name}</h3>
      <button onClick={handleDelete}>Excluir</button>
    </div>
  );
}
```

### Services (Frontend)

```typescript
// ✅ BOM
export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await authFetch('/api/products');
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    return response.json();
  }
};

// ❌ RUIM
export const getProducts = async () => {
  const response = await fetch('/api/products'); // fetch direto, sem auth
  return response.json(); // Sem verificar response.ok
};
```

---

## 🎨 Padrões do Projeto

### Nomenclatura

| Item | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase + use | `useCashRegister.ts` |
| Serviços | camelCase + Service | `productService.ts` |
| Controllers | camelCase + .controller | `product.controller.js` |
| Rotas | camelCase + .routes | `product.routes.js` |

### Estrutura de Arquivos

```
// Componente simples
ComponentName.tsx

// Componente com estilos (se necessário)
ComponentName/
├── index.tsx
└── styles.css
```

### Imports

```typescript
// Ordem de imports (frontend)
// 1. React
import { useState, useEffect } from 'react';
// 2. Bibliotecas externas
import { useNavigate } from 'react-router-dom';
// 3. Componentes locais
import { Button } from '../components/Button';
// 4. Hooks
import { useAuth } from '../contexts/AuthContext';
// 5. Services
import { productService } from '../services/productService';
// 6. Types
import type { Product } from '../types';
// 7. Utils
import { formatCurrency } from '../utils/format';
```

---

## ❌ Red Flags (Rejeitar imediatamente)

1. **Credenciais hardcoded** no código
2. **Console.log** esquecido em produção
3. **Código comentado** extenso
4. **any** usado extensivamente sem justificativa
5. **Funções com 100+ linhas** sem divisão
6. **Dependências circulares**
7. **Requisições HTTP sem tratamento de erro**

---

## 💬 Como Dar Feedback

### Seja Específico

```markdown
❌ "Isso está errado"
✅ "Considere usar `authFetch` aqui para incluir o token de autenticação automaticamente"
```

### Sugira Soluções

```markdown
❌ "O erro não está sendo tratado"
✅ "Adicione try/catch aqui. Exemplo:
\`\`\`javascript
try {
  await service.save(data);
} catch (error) {
  toast.error('Erro ao salvar');
}
\`\`\`"
```

### Diferencie Crítico de Sugestão

```markdown
🔴 CRÍTICO: Falta autenticação nesta rota
🟡 SUGESTÃO: Poderia extrair esta lógica para um hook
```

---

## 📊 Níveis de Severidade

| Nível | Descrição | Ação |
|-------|-----------|------|
| 🔴 **Blocker** | Segurança, dados, produção | Rejeitar até corrigir |
| 🟠 **Major** | Bug potencial, má prática | Rejeitar, mas pode negociar |
| 🟡 **Minor** | Melhorias, style | Aprovar com comentário |
| 🟢 **Nitpick** | Preferência pessoal | Aprovar, sugestão opcional |

---

*Última atualização: Janeiro 2026*
