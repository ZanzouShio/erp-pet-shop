# 🐾 ERP Pet Shop

Sistema de gestão completo para Pet Shops, desenvolvido com tecnologias modernas para garantir performance e escalabilidade.

## 🚀 Tecnologias

### Frontend
- **React 19:** Última versão da biblioteca para interfaces modernas.
- **Vite:** Build tool extremamente rápido.
- **Tailwind CSS v3:** Estilização utilitária e responsiva.
- **Lucide React:** Ícones vetoriais leves e consistentes.
- **Recharts:** Biblioteca de gráficos para dashboards financeiros.
- **React Router v7:** Roteamento avançado para SPA.

### Backend
- **Node.js + Express:** API RESTful robusta.
- **Prisma ORM:** Tipagem forte e migrações de banco de dados modernas.
- **PostgreSQL:** Banco de dados relacional confiável (via Docker).
- **Fast XML Parser:** Manipulação de notas fiscais (NFC-e/NF-e).
- **Multer:** Upload de arquivos (Certificados, XMLs).
- **Date-fns:** Manipulação precisa de datas e fuso horários.

## ✨ Funcionalidades Principais (Em Operação)

### 💰 Financeiro Completo
- **Contas a Pagar/Receber:** Controle detalhado com vencimentos.
- **Fluxo de Caixa:** Visão projetada e realizada, incluindo saldo bancário real.
- **Conciliação Bancária:** Ajuste de saldos e controle de contas.
- **Configuração de Pagamento:** Taxas, prazos de liquidação (D+0, D+1, D+30).

### 🛒 Ponto de Venda (PDV)
- **Venda Ágil:** Atalhos de teclado (F2 Buscar Produto, F8 Buscar Cliente, F4/F9 Finalizar).
- **Impressão de Cupom:** Layout térmico otimizado com correções de valores.
- **Busca Inteligente:** Clientes e Produtos com filtros rápidos.
- **Histórico no Caixa:** Exibe últimas 3 compras do cliente com detalhes (hover).

### 📦 Gestão de Estoque
- **Movimentações:** Entrada e saída manual com histórico e justificativas.
- **Custo Médio:** Cálculo automático do custo médio ponderado.
- **Produtos a Granel:** Estrutura pronta para conversão de pacotes.
- **Cadastro Completo:** Controle de margem, preço de custo/venda.
- **Alertas:** Notificação automática de margem de lucro baixa e estoque mínimo.

### 👥 Clientes e Fidelidade
- **Cadastro Detalhado:** Dados pessoais, endereço e documentos.
- **Carteira do Cliente:** Saldo de Cashback e Pontos de Fidelidade.
- **Histórico de Compras:** Rastreabilidade total de vendas por cliente com detalhes de itens.

### 📊 Dashboard & Relatórios
- **Resumo Diário:** Vendas do dia, ticket médio.
- **Top Produtos:** Ranking dos produtos mais vendidos.
- **Relatórios Financeiros:** Taxas por operador, posição de caixa e performance.
- **Evolução Financeira:** Gráficos de Entradas vs Saídas.

### 🤝 Gestão de Fornecedores
- **Cadastro Completo:** Dados cadastrais, contato e condições comerciais.
- **Automação:** Busca automática de endereço via CEP.
- **Validação:** Verificação de CNPJ (suporte a alfanumérico) e máscaras de input.

### ⚙️ Configurações
- **Espécies Dinâmicas:** Cadastro personalizável de espécies de pets.
- **Meios de Pagamento:** Configuração de taxas, prazos e cores para cartões e Pix.

## 📂 Estrutura do Projeto

```
erp-petshop/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuração de DB
│   │   ├── controllers/    # Lógica de Negócios
│   │   ├── routes/         # Definição de Rotas
│   │   ├── app.js          # Configuração do App
│   │   └── server.js       # Entry Point
│   └── package.json
│
├── erp-petshop/ (Frontend)
│   ├── src/
│   │   ├── components/     # Componentes Reutilizáveis
│   │   ├── pages/          # Páginas da Aplicação
│   │   └── ...
│   └── package.json
│
└── docs/                   # Documentação Técnica
```

## 🛠️ Como Rodar

### Backend
```bash
cd backend
npm install
npm run dev
```
Servidor rodando em: `http://localhost:3001`

### Frontend
```bash
cd erp-petshop
npm install
npm run dev
```
Aplicação rodando em: `http://localhost:5173`

## 📚 Documentação Técnica
Para detalhes de arquitetura e banco de dados, consulte a pasta `docs/`.
