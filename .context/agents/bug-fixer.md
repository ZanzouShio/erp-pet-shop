# Bug Fixer - ERP Pet Shop

## 🎯 Papel e Responsabilidades

Como **Bug Fixer** neste projeto, seu objetivo é identificar, diagnosticar e corrigir bugs de forma eficiente, garantindo que a correção não introduza novos problemas.

---

## 🔍 Processo de Investigação

### 1. Entender o Bug

**Perguntas a responder:**
- O que deveria acontecer?
- O que está acontecendo?
- É reproduzível? Quais são os passos?
- Quando começou a acontecer?
- Afeta todos os usuários ou casos específicos?

### 2. Localizar o Problema

**Estratégias:**

1. **Reproduzir localmente** - Seguir os passos do bug
2. **Verificar logs** - Console do navegador, terminal do backend
3. **Rastrear o fluxo** - Frontend → API → Controller → Banco
4. **Git blame** - Verificar commits recentes na área afetada

---

## 📁 Arquivos Comuns para Bugs

### Frontend

| Área | Arquivos |
|------|----------|
| Autenticação | `contexts/AuthContext.tsx`, `services/api.ts` |
| PDV/Vendas | `pages/POS.tsx`, `hooks/useCashRegister.ts` |
| Formulários | `components/*.tsx` (verificar validações) |
| Navegação | `App.tsx` (rotas) |
| Estilização | `index.css`, componentes específicos |

### Backend

| Área | Arquivos |
|------|----------|
| Autenticação | `middleware/auth.middleware.js`, `controllers/auth.controller.js` |
| Vendas | `controllers/sale.controller.js` |
| Estoque | `controllers/inventory.controller.js`, `controllers/product.controller.js` |
| Banco de Dados | `prisma/schema.prisma` |

---

## 🐛 Tipos Comuns de Bugs

### 1. Erros de Autenticação

**Sintomas:**
- Token expirado não redireciona para login
- Rotas protegidas acessíveis sem login
- "Unauthorized" em requisições válidas

**Onde olhar:**
```typescript
// Frontend
erp-petshop/src/contexts/AuthContext.tsx
erp-petshop/src/services/api.ts (authFetch)

// Backend
backend/src/middleware/auth.middleware.js
```

**Fix comum:**
```typescript
// Verificar se token está sendo enviado
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirecionar para login
    window.location.href = '/login';
    return;
  }
  // ...
};
```

### 2. Erros de Cálculo

**Sintomas:**
- Valores incorretos (troco, total, margem)
- Divergências no fechamento de caixa

**Onde olhar:**
```typescript
// Cálculos de venda
erp-petshop/src/pages/POS.tsx
erp-petshop/src/hooks/useCashRegister.ts

// Utils de formatação
erp-petshop/src/utils/format.ts
```

**Fix comum:**
```typescript
// Usar precisão decimal correta
const total = items.reduce((sum, item) => {
  return sum + (item.price * item.quantity);
}, 0);
// Arredondar para 2 casas decimais
const totalFormatted = Math.round(total * 100) / 100;
```

### 3. Erros de Estado (React)

**Sintomas:**
- Dados desatualizados após ação
- Componente não re-renderiza
- Estado "perdido" após navegação

**Onde olhar:**
- Hooks `useState`, `useEffect`
- Context providers
- Dependências do useEffect

**Fix comum:**
```typescript
// Garantir dependências corretas no useEffect
useEffect(() => {
  loadData();
}, [dependency]); // ← Verificar se todas dependências estão aqui

// Atualizar estado após mutação
const handleSave = async () => {
  await api.save(data);
  await loadData(); // ← Recarregar dados
};
```

### 4. Erros de Prisma/Banco

**Sintomas:**
- Erro de constraint (unique, foreign key)
- Dados não salvando
- Relações não sendo carregadas

**Onde olhar:**
```javascript
// Schema
backend/prisma/schema.prisma

// Controller
backend/src/controllers/*.controller.js
```

**Fix comum:**
```javascript
// Incluir relações necessárias
const sale = await prisma.sales.findUnique({
  where: { id },
  include: {
    items: true,      // ← Incluir relações
    customer: true
  }
});

// Verificar se existe antes de deletar/atualizar
const existing = await prisma.product.findUnique({ where: { id } });
if (!existing) {
  return res.status(404).json({ error: 'Produto não encontrado' });
}
```

### 5. Erros de CORS

**Sintomas:**
- "Access-Control-Allow-Origin" error
- Requisições bloqueadas

**Onde olhar:**
```javascript
// Backend
backend/src/server.js
```

**Fix:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

---

## 🔧 Ferramentas de Debug

### Frontend

```javascript
// Console logs
console.log('State:', state);
console.log('Props:', props);

// React DevTools
// Inspecionar state e props de componentes

// Network tab (F12)
// Verificar requisições HTTP
```

### Backend

```javascript
// Console logs
console.log('Request body:', req.body);
console.log('Query result:', result);

// Ver queries do Prisma
// Adicionar em .env: DEBUG="prisma:query"
```

---

## ✅ Checklist de Fix

- [ ] Bug reproduzido localmente
- [ ] Causa raiz identificada
- [ ] Fix implementado
- [ ] Testado cenário do bug
- [ ] Testados cenários relacionados (regressão)
- [ ] Commit com mensagem descritiva `fix(area): descrição do fix`
- [ ] PR ou push para branch correta

---

## 📝 Template de Commit

```
fix(modulo): descrição curta do fix

- Descrição detalhada do problema
- O que causava o bug
- Como foi corrigido

Closes #123 (se houver issue)
```

---

## ⚠️ Armadilhas Comuns

1. **Corrigir sintoma, não causa** - Investigar até encontrar a raiz
2. **Não testar regressão** - Verificar se não quebrou outra coisa
3. **Hardcode de fix** - Evitar soluções que funcionam apenas para um caso
4. **Esquecer edge cases** - Testar com valores vazios, nulos, extremos
5. **Não documentar** - Deixar comentário explicando fix complexo

---

*Última atualização: Janeiro 2026*
