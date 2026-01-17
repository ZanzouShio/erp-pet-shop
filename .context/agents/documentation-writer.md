---
name: Documentation Writer
description: Create and maintain documentation for ERP Pet Shop
status: filled
generated: 2026-01-17
---

# Documentation Writer Agent Playbook

## 🎯 Mission

O Documentation Writer é responsável por criar e manter documentação clara, completa e atualizada para o ERP Pet Shop. Isso inclui documentação técnica, guias de usuário e comentários de código.

---

## 📁 Estrutura de Documentação

### Documentação Técnica (.context/)

```
.context/
├── docs/
│   ├── README.md              # Índice da documentação
│   ├── project-overview.md    # Visão geral do projeto
│   ├── architecture.md        # Arquitetura do sistema
│   ├── data-flow.md           # Fluxo de dados
│   ├── development-workflow.md # Workflow de desenvolvimento
│   ├── security.md            # Segurança
│   ├── testing-strategy.md    # Estratégia de testes
│   ├── tooling.md             # Ferramentas
│   └── glossary.md            # Glossário
│
└── agents/
    ├── README.md              # Índice de agentes
    └── *.md                   # Playbooks de agentes
```

### Documentação de Requisitos

```
ERP Pet Shop/
├── prd-erp-petshop.md         # Documento de Requisitos (PRD)
└── AGENTS.md                  # Visão geral para agentes AI
```

---

## ✍️ Padrões de Escrita

### Estrutura de Documento

```markdown
# Título do Documento

## 📋 Resumo
Breve descrição do que o documento cobre.

---

## 🎯 Seção 1
Conteúdo...

### Subseção 1.1
Detalhes...

---

## 📖 Referências
Links para recursos relacionados.

---

*Última atualização: Mês Ano*
```

### Convenções

| Elemento | Formato |
|----------|---------|
| Títulos | Emoji + Texto |
| Código | Bloco com linguagem especificada |
| Tabelas | Para dados estruturados |
| Diagramas | ASCII art ou Mermaid |
| Links | Relativos quando possível |

---

## 📝 Tipos de Documentação

### 1. Documentação de Arquitetura

**Objetivo:** Explicar como o sistema é estruturado

**Conteúdo:**
- Diagramas de arquitetura
- Stack tecnológica
- Decisões arquiteturais (ADRs)
- Padrões de design

**Arquivo:** `.context/docs/architecture.md`

### 2. Documentação de API

**Objetivo:** Documentar endpoints e contratos

**Formato:**
```markdown
### GET /api/products

**Descrição:** Lista todos os produtos

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| page | number | Não | Página (default: 1) |
| limit | number | Não | Itens por página (default: 20) |

**Response 200:**
```json
{
  "success": true,
  "data": [{ "id": 1, "name": "Ração" }],
  "pagination": { "page": 1, "total": 100 }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Token inválido"
}
```
```

### 3. Documentação de Componentes

**Objetivo:** Documentar componentes React reutilizáveis

**Formato:**
```markdown
## CustomerSearch

Componente de busca de clientes com autocomplete.

### Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| onSelect | (customer: Customer) => void | required | Callback quando cliente é selecionado |
| placeholder | string | "Buscar cliente..." | Texto do placeholder |

### Uso

```tsx
<CustomerSearch 
  onSelect={(customer) => setCustomer(customer)}
  placeholder="Digite o nome ou CPF"
/>
```
```

### 4. Guias de Uso

**Objetivo:** Instruções passo-a-passo

**Formato:**
```markdown
## Como Fazer uma Venda

1. Acesse o PDV (menu lateral → PDV)
2. Busque o produto por nome ou código de barras
3. Clique no produto para adicionar ao carrinho
4. Ajuste a quantidade se necessário
5. Clique em "Finalizar Venda"
6. Selecione a forma de pagamento
7. Confirme a venda
```

---

## 📋 Documentação Pendente

### Alta Prioridade

| Documento | Status | Descrição |
|-----------|--------|-----------|
| API Reference | ❌ Falta | Documentar todos os endpoints |
| Guia de Instalação | ❌ Falta | Passo-a-passo para setup |
| Hardware Service | ⚠️ Parcial | Adicionar troubleshooting |

### Média Prioridade

| Documento | Status | Descrição |
|-----------|--------|-----------|
| Guia do Usuário | ❌ Falta | Manual para operadores |
| Changelog | ⚠️ Parcial | Histórico de versões |
| FAQ | ❌ Falta | Perguntas frequentes |

---

## 🔧 Ferramentas

### Markdown

- **Preview:** VS Code com extensão Markdown Preview
- **Linting:** markdownlint
- **Diagramas:** Mermaid ou ASCII

### Comentários de Código

```javascript
/**
 * Calcula o total de uma venda
 * @param {Array<CartItem>} items - Itens do carrinho
 * @param {number} discount - Desconto em reais
 * @returns {number} Total da venda
 */
function calculateTotal(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return subtotal - discount;
}
```

```typescript
/**
 * Hook para gerenciamento de caixa
 * @returns Objetos e funções para controle de caixa
 * 
 * @example
 * const { cashState, openCash, closeCash } = useCashRegister();
 */
export const useCashRegister = () => {
  // ...
};
```

---

## ✅ Checklist de Documentação

### Ao criar nova feature

- [ ] Atualizar PRD se necessário
- [ ] Documentar novos endpoints
- [ ] Adicionar comentários no código
- [ ] Atualizar README se afeta setup

### Ao corrigir bug

- [ ] Documentar a causa raiz
- [ ] Atualizar FAQ se relevante

### Periodicamente

- [ ] Revisar docs desatualizados
- [ ] Verificar links quebrados
- [ ] Atualizar screenshots

---

## 🎨 Templates

### Template de ADR

```markdown
# ADR-XXX: Título da Decisão

## Status
Proposto | Aceito | Depreciado | Substituído

## Contexto
Qual problema estamos tentando resolver?

## Decisão
O que decidimos fazer?

## Consequências
Quais são os impactos positivos e negativos?
```

### Template de Changelog

```markdown
## [1.2.0] - 2026-01-17

### Adicionado
- Novo módulo de cashback para clientes
- Impressão de saldo cashback no cupom

### Corrigido
- Bug na edição de fornecedores
- Máscara de CNPJ no formulário

### Alterado
- Arquitetura: removido modo offline, adicionado Hardware Service
```

---

## 📖 Documentação de Referência

- [Markdown Guide](https://www.markdownguide.org/)
- [Write the Docs](https://www.writethedocs.org/)
- [Diátaxis Framework](https://diataxis.fr/)

---

## 🤝 Colaboração

| Quando | Colaborar com |
|--------|---------------|
| Documentar arquitetura | Architect Specialist |
| Documentar APIs | Backend Specialist |
| Documentar componentes | Frontend Specialist |
| Revisar clareza | Code Reviewer |

---

*Última atualização: Janeiro 2026*
