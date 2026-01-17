# Frontend Specialist - ERP Pet Shop

## 🎯 Papel e Responsabilidades

Como **Frontend Specialist** neste projeto, você é responsável por interfaces, componentes React, estado e experiência do usuário.

---

## 🏗️ Arquitetura do Frontend

```
erp-petshop/
├── src/
│   ├── App.tsx                    # Entry point + Router
│   ├── main.tsx                   # React DOM render
│   ├── index.css                  # Estilos globais (Tailwind)
│   │
│   ├── components/                # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   │
│   ├── pages/                     # Páginas (rotas)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── POS.tsx
│   │   ├── Products/
│   │   │   ├── index.tsx
│   │   │   └── ProductForm.tsx
│   │   └── ...
│   │
│   ├── layouts/                   # Layouts de página
│   │   └── AdminLayout.tsx
│   │
│   ├── contexts/                  # Context API
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/                     # Custom Hooks
│   │   ├── useToast.ts
│   │   └── useCashRegister.ts
│   │
│   ├── services/                  # API Services
│   │   ├── api.ts                 # Base fetch + authFetch
│   │   └── productService.ts
│   │
│   ├── types/                     # TypeScript Types
│   │   └── index.ts
│   │
│   └── utils/                     # Helpers
│       └── format.ts
│
├── public/
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 📝 Templates de Código

### Componente Funcional

```tsx
import { useState } from 'react';

interface Props {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: Props) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      onAction?.();
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button 
        onClick={handleClick}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Carregando...' : 'Ação'}
      </button>
    </div>
  );
}
```

### Página com Dados

```tsx
import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { productService } from '../services/productService';
import type { Product } from '../types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError('Erro ao carregar produtos');
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        {error}
        <button onClick={loadProducts} className="ml-2 underline">
          Tentar novamente
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Produtos</h1>
      <div className="grid gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### Custom Hook

```tsx
import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(initialState = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
}
```

### Service de API

```tsx
import { authFetch } from './api';
import type { Product } from '../types';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await authFetch('/api/products');
    if (!response.ok) throw new Error('Erro ao buscar produtos');
    return response.json();
  },
  
  getById: async (id: number): Promise<Product> => {
    const response = await authFetch(`/api/products/${id}`);
    if (!response.ok) throw new Error('Produto não encontrado');
    return response.json();
  },
  
  create: async (data: Omit<Product, 'id'>): Promise<Product> => {
    const response = await authFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar produto');
    return response.json();
  },
  
  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await authFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar produto');
    return response.json();
  },
  
  delete: async (id: number): Promise<void> => {
    const response = await authFetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao excluir produto');
  },
};
```

---

## 🎨 Padrões de Estilo (TailwindCSS)

### Classes Comuns

```tsx
// Containers
<div className="container mx-auto px-4">
<div className="max-w-4xl mx-auto">

// Cards
<div className="bg-white rounded-lg shadow p-4">
<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">

// Buttons
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
<button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
<button className="text-red-600 hover:text-red-800">

// Forms
<input className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
<label className="block text-sm font-medium text-gray-700 mb-1">

// Tables
<table className="min-w-full divide-y divide-gray-200">
<th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
<td className="px-4 py-3 text-sm text-gray-900">

// Flexbox
<div className="flex items-center justify-between">
<div className="flex gap-4">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Responsividade

```tsx
// Mobile first
<div className="
  p-2           // Mobile
  md:p-4        // Tablet (768px+)
  lg:p-6        // Desktop (1024px+)
">

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## 🔐 Autenticação

### AuthContext

```tsx
// contexts/AuthContext.tsx
const { user, login, logout, isAuthenticated } = useAuth();

// Rota protegida
<Route 
  path="/dashboard" 
  element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
/>
```

### authFetch

```tsx
// services/api.ts
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
};
```

---

## 📦 Estado

### useState para estado local

```tsx
const [value, setValue] = useState('');
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(false);
```

### Context para estado global

```tsx
// Autenticação, Tema, etc.
const { user } = useAuth();
const { toast } = useToast();
```

### Props drilling vs Context

```
Poucos níveis → Props
Muitos níveis → Context
Muitos consumers → Context
```

---

## ⚠️ Armadilhas Comuns

### 1. useEffect infinito

```tsx
// ❌ ERRADO - Loop infinito
useEffect(() => {
  loadData();
}, [data]); // data muda quando carrega, causando loop

// ✅ CORRETO
useEffect(() => {
  loadData();
}, []); // Executa apenas uma vez
```

### 2. Estado não atualiza imediatamente

```tsx
// ❌ ERRADO
setCount(count + 1);
console.log(count); // Ainda é o valor antigo!

// ✅ CORRETO
setCount(prev => prev + 1);
// Ou usar useEffect para reagir à mudança
```

### 3. Fetch sem cleanup

```tsx
// ✅ CORRETO - Com cleanup
useEffect(() => {
  let cancelled = false;
  
  const load = async () => {
    const data = await fetchData();
    if (!cancelled) setData(data);
  };
  
  load();
  return () => { cancelled = true; };
}, []);
```

### 4. Key em listas

```tsx
// ❌ ERRADO - Index como key
{items.map((item, index) => <Item key={index} />)}

// ✅ CORRETO - ID único
{items.map(item => <Item key={item.id} />)}
```

---

## ✅ Checklist Frontend

- [ ] Tipos TypeScript definidos
- [ ] Estados de loading e error tratados
- [ ] Feedback visual para ações do usuário
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Formulários com validação
- [ ] Uso de authFetch para requisições autenticadas
- [ ] Keys únicos em listas
- [ ] useEffect com dependências corretas
- [ ] Componentes pequenos e reutilizáveis

---

*Última atualização: Janeiro 2026*
