# 🐾 ERP Pet Shop

Sistema de gestão completo para Pet Shops, desenvolvido com tecnologias modernas para garantir performance e escalabilidade.

## 🚀 Tecnologias

### Frontend
- **React + Vite:** Performance e desenvolvimento ágil.
- **Tailwind CSS:** Estilização moderna e responsiva.
- **Lucide React:** Ícones vetoriais leves.
- **React Router:** Navegação SPA.

### Backend
- **Node.js + Express:** Servidor robusto e escalável.
- **Arquitetura MVC:** Código organizado em Controllers e Routes.
- **PostgreSQL:** Banco de dados relacional confiável.
- **pg (node-postgres):** Driver de conexão otimizado.

## ✨ Funcionalidades Principais

### 📦 Gestão de Estoque
- **Movimentações:** Entrada e saída manual com histórico.
- **Custo Médio:** Cálculo automático do custo médio ponderado.
- **Alertas:** Notificação automática de margem de lucro baixa e estoque mínimo.

### 💰 Gestão de Vendas
- **PDV (Ponto de Venda):** Interface ágil para vendas rápidas.
- **Histórico:** Listagem completa de vendas com filtros avançados.
- **Detalhes:** Visualização detalhada de itens, pagamentos e descontos.
- **Cancelamento:** Estorno automático de estoque ao cancelar venda.

### 📊 Dashboard & Relatórios
- **Resumo Diário:** Vendas do dia, ticket médio.
- **Top Produtos:** Ranking dos produtos mais vendidos.
- **Relatórios Financeiros:** Taxas por operador, posição de caixa e performance.
- **Alertas:** Produtos com estoque baixo ou zerado.

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
