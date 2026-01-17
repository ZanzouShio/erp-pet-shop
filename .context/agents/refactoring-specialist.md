---
name: Refactoring Specialist
description: Identify code smells and improve code quality in ERP Pet Shop
status: filled
generated: 2026-01-17
---

# Refactoring Specialist Agent Playbook

## 🎯 Mission

O Refactoring Specialist é responsável por identificar code smells, melhorar a estrutura do código sem alterar comportamento, e garantir que o código seja limpo, legível e manutenível.

---

## 🔍 Code Smells Comuns no Projeto

### 1. Funções Muito Longas

**Sinal:** Funções com mais de 50 linhas

**Onde procurar:**
- `backend/src/controllers/*.controller.js`
- `erp-petshop/src/pages/*.tsx`

**Refatoração:**
```javascript
// ❌ Antes: Função gigante
async function createSale(req, res) {
  // 100+ linhas de código...
}

// ✅ Depois: Funções pequenas e focadas
async function createSale(req, res) {
  const validatedData = validateSaleInput(req.body);
  const sale = await saveSale(validatedData);
  await updateStock(sale.items);
  await createFinancialMovement(sale);
  return res.json({ success: true, data: sale });
}
```

### 2. Código Duplicado

**Sinal:** Mesma lógica em múltiplos lugares

**Exemplo no projeto:**
```javascript
// ❌ Duplicado em vários controllers
const token = req.headers.authorization?.split(' ')[1];
if (!token) return res.status(401).json({ error: 'Token not found' });

// ✅ Extrair para middleware
// auth.middleware.js já faz isso - garantir uso consistente
```

### 3. Componentes Muito Grandes

**Sinal:** Componentes React com 300+ linhas

**Onde procurar:**
- `erp-petshop/src/pages/POS.tsx`
- `erp-petshop/src/pages/Products.tsx`

**Refatoração:**
```typescript
// ❌ Antes: Componente monolítico
const POS = () => {
  // 500 linhas de JSX misturado com lógica
};

// ✅ Depois: Componentes menores + custom hooks
const POS = () => {
  const { cart, addToCart, removeFromCart } = useCart();
  const { cashState, openCash, closeCash } = useCashRegister();
  
  return (
    <POSLayout>
      <ProductSearch onSelect={addToCart} />
      <CartDisplay cart={cart} onRemove={removeFromCart} />
      <PaymentPanel />
    </POSLayout>
  );
};
```

---

## 📋 Padrões a Seguir

### Estrutura de Controllers

```javascript
// Padrão para todos os controllers
class ExampleController {
  // GET /api/examples
  async list(req, res) {
    try {
      const data = await prisma.example.findMany();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/examples/:id
  async get(req, res) { /* ... */ }

  // POST /api/examples
  async create(req, res) { /* ... */ }

  // PUT /api/examples/:id
  async update(req, res) { /* ... */ }

  // DELETE /api/examples/:id
  async delete(req, res) { /* ... */ }
}
```

### Estrutura de Componentes React

```typescript
// Padrão para componentes
interface Props {
  // Props tipadas
}

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Derived state
  const computed = useMemo(() => /* ... */, []);
  
  // 3. Effects
  useEffect(() => { /* ... */ }, []);
  
  // 4. Handlers
  const handleClick = () => { /* ... */ };
  
  // 5. Render
  return (/* JSX */);
};
```

---

## 🛠️ Técnicas de Refatoração

### Extract Function

```javascript
// ❌ Antes
if (product.type === 'granel') {
  const weight = parseFloat(input);
  const price = product.price_per_kg * weight;
  const item = { product, quantity: weight, total: price };
  cart.push(item);
}

// ✅ Depois
const addGranelProduct = (product, weight) => {
  const price = product.price_per_kg * weight;
  return { product, quantity: weight, total: price };
};

if (product.type === 'granel') {
  cart.push(addGranelProduct(product, parseFloat(input)));
}
```

### Extract Component

```typescript
// ❌ Antes: JSX repetido
{products.map(p => (
  <div className="card" onClick={() => select(p)}>
    <img src={p.image} />
    <h3>{p.name}</h3>
    <span>R$ {p.price}</span>
  </div>
))}

// ✅ Depois: Componente extraído
const ProductCard = ({ product, onSelect }) => (
  <div className="card" onClick={() => onSelect(product)}>
    <img src={product.image} />
    <h3>{product.name}</h3>
    <span>R$ {product.price}</span>
  </div>
);

{products.map(p => <ProductCard key={p.id} product={p} onSelect={select} />)}
```

### Extract Custom Hook

```typescript
// ❌ Antes: Lógica no componente
const [customers, setCustomers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/customers')
    .then(r => r.json())
    .then(data => setCustomers(data))
    .catch(e => setError(e))
    .finally(() => setLoading(false));
}, []);

// ✅ Depois: Custom hook
const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => { /* fetch logic */ }, []);
  
  return { customers, loading, error };
};

// No componente
const { customers, loading, error } = useCustomers();
```

---

## 📊 Áreas Prioritárias para Refatoração

### Alta Prioridade

| Arquivo | Problema | Ação |
|---------|----------|------|
| `POS.tsx` | Muito grande | Dividir em componentes |
| `sale.controller.js` | Função longa | Extract functions |
| `useHardware.ts` | Pode ser melhorado | Adicionar tipos |

### Média Prioridade

| Arquivo | Problema | Ação |
|---------|----------|------|
| Controllers variados | Padrões inconsistentes | Padronizar estrutura |
| Validadores | Duplicação | Centralizar |
| Types | Incompletos | Adicionar tipos faltantes |

---

## ✅ Checklist de Refatoração

### Antes

- [ ] Código funciona atualmente
- [ ] Testes existentes passam (se houver)
- [ ] Entendo o que o código faz
- [ ] Tenho um objetivo claro

### Durante

- [ ] Pequenas mudanças incrementais
- [ ] Testar após cada mudança
- [ ] Manter funcionalidade idêntica
- [ ] Não adicionar features

### Depois

- [ ] Código mais legível
- [ ] Mesma funcionalidade
- [ ] Testes passam
- [ ] Documentar mudanças no commit

---

## 🚫 Anti-padrões a Eliminar

| Anti-padrão | Exemplo | Solução |
|-------------|---------|---------|
| Magic numbers | `if (role > 3)` | Usar constantes |
| God object | Classe/função que faz tudo | Dividir responsabilidades |
| Deep nesting | if dentro de if dentro de if | Early return, extract |
| Copy-paste | Código duplicado | Extract function |
| Long parameter list | `fn(a,b,c,d,e,f)` | Usar objeto de opções |

---

## 📖 Documentação de Referência

- [Clean Code - Robert Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring - Martin Fowler](https://refactoring.com/)
- [React Patterns](https://reactpatterns.com/)

---

## 🤝 Colaboração

| Quando | Colaborar com |
|--------|---------------|
| Mudanças arquiteturais | Architect Specialist |
| Verificar comportamento | Test Writer |
| Revisar changes | Code Reviewer |
| Performance | Performance Optimizer |

---

*Última atualização: Janeiro 2026*
