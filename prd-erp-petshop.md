# Documento de Requisitos de Produto (PRD)
## Sistema ERP para Pet Shop e Casa de Rações

**Versão:** 1.1  
**Data:** 17 de Janeiro de 2026  
**Status:** Em Desenvolvimento

### Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.1 | 17/01/2026 | Arquitetura atualizada: removido modo offline (Electron/SQLite), adicionado Hardware Service como módulo desktop para integração com periféricos via WebSocket |
| 1.0 | 23/11/2025 | Versão inicial do PRD |

---

## 1. Visão Geral do Produto

### 1.1 Objetivo
Desenvolver um sistema ERP completo e integrado para gestão de Pet Shop e Casa de Rações, oferecendo controle total sobre operações financeiras, estoque, vendas e emissão de documentos fiscais, com integração de periféricos via módulo desktop complementar (Hardware Service).

### 1.2 Problema a Resolver
Empresas do segmento pet precisam de uma solução centralizada que unifique gestão financeira, controle de estoque (incluindo produtos perecíveis), emissão de notas fiscais e operação de PDV, com capacidade de integração com periféricos como impressoras térmicas, balanças e gavetas de dinheiro.

### 1.3 Público-Alvo
- Proprietário da empresa (uso pessoal)
- Operadores de caixa/PDV
- Gerentes de loja
- Equipe de estoque
- Equipe financeira

### 1.4 Escala Inicial
- **Usuários simultâneos:** 1-10 usuários
- **PDVs simultâneos:** até 10 pontos de venda
- **Produtos cadastrados:** 500+ produtos inicialmente
- **Volume de vendas:** ~200 vendas/dia estimado
- **Múltiplas lojas:** arquitetura preparada para expansão

---

## 2. Arquitetura e Stack Tecnológica

### 2.1 Stack Proposta

**Frontend Web (Gerencial Online)**
- React 18+
- Vite (build tool)
- TypeScript
- TailwindCSS para estilização
- React Router para navegação
- Zustand ou React Context para gerenciamento de estado
- React Query para cache e sincronização de dados

**Hardware Service (Módulo Desktop Complementar)**
- Node.js standalone (serviço local)
- WebSocket server para comunicação com aplicação web
- Protocolo ESC/POS para impressoras térmicas
- Comunicação serial para balanças e gavetas
- Instalável em Windows (executável ou serviço)
- Porta padrão: ws://localhost:3002

**Backend**
- Node.js com Express ou Fastify
- TypeScript
- PostgreSQL (banco de dados principal)
- Prisma ORM
- Redis para cache e filas
- WebSocket para atualizações em tempo real

**Infraestrutura**
- Docker para containerização
- Nginx como reverse proxy
- Sistema de filas (Bull/BullMQ) para processamento assíncrono
- Cron jobs para tarefas agendadas (backup, relatórios)

### 2.2 Arquitetura do Sistema

**Arquitetura Principal**
```
[Frontend Web] <--> [API REST/WebSocket] <--> [PostgreSQL]
       |                                  <--> [Redis Cache]
       |                                  <--> [Sistema Fiscal]
       |                                  <--> [Gateway PIX]
       v
[Hardware Service]  (módulo desktop local)
       |
       +-- [Impressora Térmica] (ESC/POS)
       +-- [Balança Digital] (Serial)
       +-- [Gaveta de Dinheiro] (Serial/ESC)
       +-- [Leitor de Código de Barras] (USB HID)
```

**Comunicação Hardware Service**
```
[Browser/PDV Web] <-- WebSocket --> [Hardware Service ws://localhost:3002]
                                           |
                                           +-> Impressora (node-thermal-printer)
                                           +-> Balança (serialport)
                                           +-> Gaveta (serialport)
                                           +-> Scanner (stdin/keyboard)
```

> **Nota:** O sistema requer conexão com internet para operação completa.
> O Hardware Service roda localmente apenas para comunicação com periféricos.

---

## 3. Funcionalidades Principais

## 3.1 Painel Administrativo

### 3.1.1 Gestão de Usuários
- Criar, editar e desativar usuários do sistema
- Definir permissões e níveis de acesso
- Grupos de permissões (Admin, Gerente, Caixa, Financeiro, Estoque)
- Auditoria de ações dos usuários
- Histórico de login e atividades
- Redefinição de senha
- Autenticação de dois fatores (2FA) opcional

### 3.1.2 Configurações do Sistema
- Dados da empresa (CNPJ, razão social, endereço)
- Configurações fiscais (certificado digital, série NF-e, CST, CFOP)
- Parametrizações de PDV
- Configurações de backup
- Integrações com APIs externas

---

## 3.2 Gestão Financeira

### 3.2.1 Contas a Receber
- Cadastro de receitas e vendas a prazo
- Controle de parcelas e vencimentos
- Recebimentos parciais
- Geração automática de boletos
- Baixa automática via PIX
- Multas e juros por atraso
- Notificações de vencimento

### 3.2.2 Contas a Pagar
- Cadastro de despesas e fornecedores
- Controle de parcelas e vencimentos
- Pagamentos parciais
- Categorização de despesas
- Agendamento de pagamentos
- Alertas de vencimento
- Relatório de compromissos financeiros

### 3.2.3 Fluxo de Caixa
- Visão anual do fluxo de caixa
- Projeções de entrada e saída
- Saldo disponível em tempo real
- Comparativo realizado vs orçado
- Gráficos de evolução financeira
- Exportação de dados

### 3.2.4 Conciliação Bancária
- Importação de extratos bancários (OFX, CSV)
- Conciliação automática de lançamentos
- Identificação de divergências
- Múltiplas contas bancárias
- Integração bancária via Open Banking

### 3.2.5 Relatórios Financeiros
- DRE (Demonstração do Resultado do Exercício)
- Balancete
- Relatório de lucratividade
- Análise de custos
- Relatório de inadimplência
- Fluxo de caixa realizado vs projetado

---

## 3.3 Gestão de Estoque

### 3.3.1 Cadastro de Produtos
- Informações básicas (nome, descrição, marca)
- Códigos (SKU, EAN, código interno)
- Categorias e subcategorias
- Preço de custo, venda e margem
- Estoque mínimo e máximo
- Fornecedor principal
- Imagens do produto
- Produtos com variações (tamanho, peso, sabor)
- Produtos compostos/kits
- Controle por lote e validade (opcional)
- NCM, CEST, CFOP para fiscal
- **Produtos a granel:**
  - Vinculação com produto "mãe" (pacote fechado)
  - Unidade de medida (kg, g, L, ml)
  - Conversão automática (ex: pacote 15kg gera 15 unidades de 1kg)
  - Controle de estoque por peso/volume
  - Preço por unidade de medida
- **Múltiplos locais de estoque:**
  - Loja principal
  - Depósito/armazém
  - Outras filiais (futuro)
  - Transferência entre locais

### 3.3.2 Movimentação de Estoque
- Entrada manual de produtos
- Entrada por nota fiscal (importação XML)
- Saída por venda (automática via PDV)
- Transferência entre locais
- Ajustes de inventário
- Devolução de produtos
- Perda/quebra de produtos

### 3.3.3 Controle de Produtos Perecíveis
- Cadastro de data de validade
- Alertas de produtos próximos ao vencimento (15, 7, 3 dias)
- Relatório de produtos vencidos/a vencer
- Controle FIFO (First In, First Out)
- **Controle de lote (opcional):**
  - Ativado apenas quando necessário (recall de fabricante)
  - Rastreabilidade de lote por produto
  - Relatório de produtos por lote específico
  - Bloqueio de lote comprometido

### 3.3.4 Gestão de Produtos a Granel

#### 3.3.4.1 Abertura de Pacotes
- Seleção do produto "mãe" (ex: Ração 15kg)
- Informar quantidade a ser aberta
- Sistema cria movimento de baixa do produto fechado
- Sistema dá entrada automática no produto a granel
- Conversão automática baseada em peso/volume
- Registro de data e responsável pela abertura
- Rastreabilidade de origem (qual pacote foi aberto)

#### 3.3.4.2 Venda a Granel
- PDV permite venda por peso (balança integrada)
- Cálculo automático de valor (preço por kg × peso)
- Etiqueta com código de barras contendo peso e valor
- Tara automática da embalagem
- Baixa proporcional no estoque

#### 3.3.4.3 Controle de Estoque a Granel
- Estoque em quilos/litros com precisão decimal
- Alerta de estoque mínimo
- Relatório de quebra/perda
- Inventário com pesagem física

### 3.3.5 Controle de Múltiplos Locais de Estoque
- Cadastro de locais (Loja 1, Depósito, Loja 2, etc.)
- Estoque por produto por local
- Transferência entre locais
- Relatório de posição por local
- Consolidação de estoque total

### 3.3.6 Relatórios de Estoque
- Posição atual de estoque
- Movimentações por período
- Inventário por categoria
- Produtos com estoque baixo
- Curva ABC de produtos
- Produtos sem movimento
- Valor total do estoque
- Histórico de preços

---

## 3.4 Vendas e Orçamentos

### 3.4.1 Orçamentos
- Criação rápida de orçamentos
- Produtos/serviços no orçamento
- Descontos e acréscimos
- Validade do orçamento (configurável - padrão 15 dias)
- Status (pendente, aprovado, recusado, expirado)
- Conversão automática de orçamento em venda
- Notificação de expiração próxima
- Envio por e-mail/WhatsApp
- Histórico de orçamentos por cliente
- Reserva opcional de produtos (bloqueia estoque temporariamente)

### 3.4.2 Ordens de Serviço (Módulo Futuro)
- Cadastro de serviços (banho, tosa, consulta)
- **Agendamento de serviços:**
  - Calendário visual de agendamentos
  - Bloqueio de horários
  - Notificações de lembrete (SMS/WhatsApp)
  - Reagendamento e cancelamento
- Vinculação com pet e cliente
- Status do serviço (agendado, em andamento, concluído, cancelado)
- Observações e histórico
- Fotos antes/depois
- Conversão em venda ao finalizar
- Tempo estimado e profissional responsável

### 3.4.3 Controle de Vendas
- Histórico completo de vendas
- Vendas por período
- Vendas por produto
- Vendas por vendedor/operador
- Vendas por forma de pagamento
- Análise de performance
- Metas de vendas

---

## 3.5 Emissão de Documentos Fiscais

### 3.5.1 NF-e (Nota Fiscal Eletrônica - Modelo 55)
- Emissão de NF-e de venda
- Emissão de NF-e de entrada
- Cálculo automático de impostos (ICMS, PIS, COFINS)
- Validação de dados antes do envio
- Envio para SEFAZ
- Recepção do XML autorizado
- Download de DANFE (PDF)
- Envio automático por e-mail
- Cancelamento de NF-e
- Carta de Correção Eletrônica (CC-e)
- Inutilização de numeração

### 3.5.2 NFC-e (Nota Fiscal de Consumidor Eletrônica - Modelo 65)
- Emissão integrada ao PDV
- QR Code para consulta
- Envio para SEFAZ estadual
- Impressão simplificada
- Contingência offline (DPEC)
- Cancelamento e substituição

### 3.5.3 NFS-e (Nota Fiscal de Serviço Eletrônica)
- Integração com prefeitura de Mauá/SP
- Cadastro de serviços
- Cálculo de ISS
- Emissão e consulta de NFS-e
- RPS (Recibo Provisório de Serviço)
- **Nota:** Implementação específica para legislação municipal de Mauá

### 3.5.4 CF-e SAT SP (Cupom Fiscal Eletrônico - Modelo 59)
**Nota:** Módulo planejado para implementação futura
- Integração com equipamento SAT
- Emissão de cupom fiscal
- Cancelamento de CF-e
- Extrato de movimento
- Compliance com legislação paulista

### 3.5.5 Gestão de Certificados
- Upload de certificado digital A1
- Validação de validade
- Alertas de vencimento (90, 60, 30, 15 dias)
- Renovação de certificado
- **Nota:** Certificado será adquirido antes do go-live do sistema fiscal

---

## 3.6 Sistema PDV (Frente de Caixa)

### 3.6.1 Interface de Venda
- Modo touchscreen otimizado
- Leitura de código de barras
- Busca rápida de produtos (nome, código, EAN)
- Adição de produtos por quantidade/peso
- Aplicação de descontos (valor ou percentual)
- Múltiplas formas de pagamento em uma venda
- Identificação de cliente (CPF/CNPJ na nota)
- Calculadora de troco
- Teclas de atalho para agilidade

### 3.6.2 Formas de Pagamento
- Dinheiro
- Cartão de débito (registro manual - sem integração)
- Cartão de crédito à vista (registro manual - sem integração)
- Cartão de crédito parcelado (registro manual - sem integração)
- PIX com QR Code dinâmico (integrado)
- Boleto
- Vale/Crédito em loja
- Pagamento misto (combinação de formas)
- **Stone:** registro de pagamento com código de autorização (sem integração automática)

**Fluxo Stone:**
1. Operador passa transação na maquininha Stone
2. Cliente efetua pagamento
3. Operador registra manualmente no PDV o valor e código de autorização
4. Sistema salva comprovante para posterior conciliação

### 3.6.3 Hardware Service (Módulo Desktop)

O PDV web se comunica com periféricos através do **Hardware Service**, um módulo desktop que roda em `ws://localhost:3002`.

**Arquitetura:**
```
[PDV Web] <-- WebSocket --> [Hardware Service] --> [Periféricos]
```

**Instalação:**
- O Hardware Service é instalado uma vez por máquina PDV
- Roda como processo em background ou serviço Windows
- Não requer configuração especial do usuário

**Status de Conexão:**
- A aplicação web verifica a conexão com Hardware Service ao carregar
- Indicador visual: 🟢 Conectado / 🔴 Desconectado
- Periféricos ficam indisponíveis se Hardware Service não estiver rodando

### 3.6.4 Integração com Periféricos via Hardware Service

> **Importante:** Todos os periféricos são acessados através do Hardware Service.
> A aplicação web envia comandos via WebSocket e recebe eventos em tempo real.

#### 3.6.4.1 Balança Digital
- **Modelo suportado:** Balança Toledo (protocolo serial)
- Comunicação: Porta serial configurável
- **Eventos WebSocket:**
  - `{type: "weight", data: 1.250}` - Peso lido automaticamente
- **Comandos:**  
  - `{action: "readWeight"}` - Solicita leitura de peso

#### 3.6.4.2 Impressora Térmica
- **Modelos suportados:** Epson, Brother, Elgin, Daruma (ESC/POS)
- **Larguras:** 58mm (32 caracteres) ou 80mm (48 caracteres)
- **Comandos WebSocket:**
  - `{action: "printReceipt", data: {...}}` - Imprime cupom de venda
  - `{action: "printCashClose", data: {...}}` - Imprime fechamento de caixa
  - `{action: "listPrinters"}` - Lista impressoras disponíveis
- **Funcionalidades:**
  - Impressão de cupom não fiscal com cabeçalho da empresa
  - Impressão de fechamento de caixa
  - Impressão de saldo cashback do cliente
  - Normalização automática de acentos

#### 3.6.4.3 Leitor de Código de Barras
- Modo: USB HID (emulação de teclado)
- Leitura: EAN-13, EAN-8, Code 128
- **Eventos WebSocket:**
  - `{type: "barcode", data: "7891234567890"}` - Código lido
- Funciona automaticamente sem configuração adicional

#### 3.6.4.4 Gaveta de Dinheiro
- Conexão: Porta serial (RJ11 via impressora ou direta)
- Comando: ESC/POS kick drawer
- **Comandos WebSocket:**
  - `{action: "openDrawer"}` - Abre a gaveta
- Abertura automática: configurável após venda em dinheiro
- Log de aberturas manuais

#### 3.6.4.5 Display para Cliente (Planejado)
- Monitor secundário com exibição da venda
- Valores em tempo real
- Mensagens de agradecimento

### 3.6.5 Operações de Caixa
- Abertura de caixa (informar saldo inicial)
- Sangria (retirada de dinheiro)
- Suprimento (adição de dinheiro)
- Fechamento de caixa
- Conferência de valores
- Relatório de caixa por operador
- **Auditoria específica de movimentações:**
  - Log de exclusão de itens durante venda
  - Registro de cancelamentos
  - Identificação do responsável pela ação
  - Motivo da exclusão/cancelamento (campo obrigatório)
  - Histórico completo de modificações em vendas

---

## 3.7 Recebimento via PIX

### 3.7.1 Integração PIX

**PSPs Suportados:**
- Itaú (API Pix)
- Mercado Pago (Checkout Transparente)
- Nubank (Pix API)

**Funcionalidades:**
- Geração de QR Code dinâmico
- Valor e identificador único por transação
- Validação automática de recebimento (webhook)
- Tempo de expiração configurável (padrão 15 minutos)
- Conciliação automática com venda
- Extrato simplificado de transações PIX
- Estorno e devolução via PIX
- Notificação em tempo real de recebimento
- Suporte a múltiplas contas PIX (seleção no momento da venda)

**Configuração por PSP:**
- Itaú: Client ID, Client Secret, Certificado
- Mercado Pago: Access Token, Public Key
- Nubank: API Key, Certificado

### 3.7.2 Fluxo de Pagamento
1. Cliente seleciona PIX como forma de pagamento
2. Sistema gera QR Code com valor da venda
3. Cliente escaneia e efetua pagamento
4. Sistema valida recebimento (3-10 segundos)
5. Venda é confirmada e NFC-e/CF-e é emitida
6. Comprovante é entregue ao cliente

---

## 3.8 Registro Manual de Pagamentos com Maquininha

### 3.8.1 Stone (Sem Integração Automática)
- Registro manual de transação no PDV
- Campos: valor, bandeira, tipo (débito/crédito), parcelas
- Código de autorização (NSU)
- Data e hora da transação
- Taxa de administração (informada manualmente)
- Status: aprovado, pendente, cancelado

### 3.8.2 Conciliação Manual
- Importação de relatório Stone (CSV/Excel)
- Matching manual de transações
- Relatório de divergências
- Controle de recebíveis previstos
- Taxas e descontos aplicados

---

## 3.9 Cadastros Auxiliares

### 3.9.1 Clientes
- **Dados pessoais (campos opcionais):**
  - Nome completo (obrigatório apenas para NF-e)
  - CPF/CNPJ (opcional)
  - Data de nascimento
  - Telefone/celular
  - E-mail
- Endereço completo (opcional)
- Histórico de compras
- Limite de crédito
- Status (ativo, inativo, inadimplente)
- Observações e anotações
- Pets vinculados ao cliente (opcional)
- **Programa de Fidelidade:**
  - Pontos acumulados
  - Histórico de resgates
  - Regras de acúmulo (R$ 1,00 = X pontos)
  - Catálogo de prêmios/descontos
  - Validade de pontos
  - Notificações de pontos a expirar

**Privacidade:**
- Cliente pode recusar cadastro
- Venda sem identificação (CPF na nota: não informado)
- Conformidade com LGPD

### 3.9.2 Pets (Opcional para Pet Shops)
- Nome e espécie
- Raça e porte
- Data de nascimento/idade
- Sexo
- Foto
- Histórico de serviços
- Observações veterinárias

### 3.9.3 Fornecedores
- Razão social e CNPJ
- Nome fantasia
- Contatos (telefone, e-mail, WhatsApp)
- Endereço completo
- **Condições de pagamento:**
  - Prazo médio de pagamento
  - Formas aceitas pelo fornecedor
  - Descontos para pagamento antecipado
- Produtos fornecidos (catálogo)
- **Histórico de compras:**
  - Valor total comprado
  - Quantidade de pedidos
  - Ticket médio
  - Última compra
  - Frequência de compras
- Avaliação de desempenho (qualidade, prazo, preço)
- Status (ativo, inativo)
- Observações e contrato

---

## 3.10 Relatórios Gerenciais (Sob Demanda)

### 3.10.1 Top 5 Relatórios Críticos Diários

#### 1. **Resumo de Vendas do Dia**
- Total de vendas em R$
- Quantidade de transações
- Ticket médio
- Comparativo com dia anterior
- Comparativo com mesmo dia semana anterior
- Produtos mais vendidos (top 10)
- Formas de pagamento utilizadas
- Vendas por operador

#### 2. **Posição de Caixa**
- Saldo inicial
- Entradas (vendas, suprimentos)
- Saídas (sangrias, despesas)
- Saldo atual
- Divergências encontradas
- Vendas pendentes de fechamento
- Status dos PDVs (aberto/fechado)

#### 3. **Situação Financeira do Dia**
- Contas a receber hoje
- Contas a pagar hoje
- Saldo disponível em caixa/banco
- Previsão de caixa próximos 7 dias
- Inadimplência (valores em atraso)
- Recebimentos confirmados via PIX/cartão

#### 4. **Alertas de Estoque**
- Produtos com estoque abaixo do mínimo
- Produtos zerados
- Produtos próximos ao vencimento (15, 7, 3 dias)
- Produtos vencidos
- Produtos sem movimento (últimos 30 dias)
- Valor total de produtos parados

#### 5. **Performance de Produtos**
- Curva ABC (faturamento)
- Margem de lucro por produto
- Produtos com maior giro
- Produtos com menor giro
- Análise de rentabilidade por categoria
- Oportunidades de compra (produtos com alta demanda e estoque baixo)

### 3.10.2 Relatórios Complementares

#### Financeiro
- DRE mensal/anual
- Fluxo de caixa realizado
- Análise de custos operacionais
- Lucratividade por período
- Contas a pagar por fornecedor
- Inadimplência por cliente

#### Vendas
- Vendas por período (dia/semana/mês/ano)
- Vendas por categoria de produto
- Vendas por marca
- Análise de sazonalidade
- Comparativo entre lojas (futuro)
- Performance de vendedores

#### Estoque
- Inventário completo
- Movimentações por período
- Entrada vs Saída
- Valor do estoque por categoria
- Histórico de ajustes
- Produtos transferidos entre locais

#### Clientes
- Ranking de clientes (maior faturamento)
- Clientes inativos (sem compra há X dias)
- Análise de recorrência
- Programa de fidelidade (pontos distribuídos/resgatados)

### 3.10.3 Características dos Relatórios
- Geração sob demanda (não automática)
- Filtros por período, loja, categoria, etc.
- Visualização em tela (HTML)
- **Impressão direta do navegador** (função de imprimir do browser)
- Formatação otimizada para impressão
- Gráficos visuais (charts) quando aplicável
- Totalizadores e subtotais
- Sem necessidade de exportação PDF/Excel (opcional no futuro)

### 5.1 Performance
- Tempo de resposta da API: máximo 200ms (p95)
- Tempo de carregamento de telas: máximo 2 segundos
- Comunicação Hardware Service: máximo 100ms por comando
- Suporte a 500+ produtos cadastrados sem degradação
- Suporte a até 10 PDVs simultâneos
- Processamento de ~200 vendas/dia sem lentidão
- Geração de relatórios: máximo 10 segundos para períodos de até 1 ano

### 5.2 Segurança
- Criptografia de dados sensíveis (senhas, certificados, chaves de API)
- HTTPS obrigatório em todas as comunicações
- Tokens JWT com expiração (24h)
- **Perfis de acesso:**
  - **Admin:** acesso total ao sistema
  - **Gerente:** acesso a relatórios, cadastros, vendas (sem exclusões fiscais)
  - **Caixa:** acesso apenas ao PDV e operações de venda
  - **Estoquista:** acesso a estoque, produtos, movimentações
  - **Financeiro:** acesso a contas a pagar/receber, conciliação, relatórios financeiros
- **Auditoria específica:**
  - Log detalhado de exclusão de produtos em vendas
  - Registro de cancelamentos de vendas
  - Identificação do usuário responsável
  - Timestamp de todas as ações críticas
  - Campo obrigatório de justificativa para exclusões
- Backup automático diário (3h da manhã)
- Proteção contra SQL Injection e XSS
- Rate limiting na API (100 requisições/minuto por IP)
- Conformidade com LGPD

### 5.3 Usabilidade
- Interface responsiva (desktop 1366x768+)
- PDV otimizado para touchscreen
- Suporte a atalhos de teclado (F1-F12 configuráveis)
- Feedback visual para todas as ações
- Mensagens de erro claras e acionáveis
- Documentação de ajuda contextual (tooltips, ? ao lado de campos)
- Wizard de configuração inicial (onboarding)
- Modo escuro/claro (opcional)

### 5.4 Confiabilidade
- Disponibilidade: 99% (objetivo)
- **Backup automático diário** (3h da manhã)
- Retenção de backups: 30 dias
- Backup incremental a cada 6 horas (dados críticos)
- Processo de restauração documentado e testado
- Recuperação de desastres: RPO 24h, RTO 8h
- Monitoramento de erros via logs
- Alertas automáticos para falhas críticas (e-mail/SMS)

### 5.5 Compatibilidade
- **Navegadores (Sistema Web):** Chrome 100+, Firefox 100+, Edge 100+
- **Sistema Operacional (Hardware Service):** Windows 10/11
- **Resolução mínima:** 1366x768
- **Hardware Service:**
  - Node.js 18+ instalado
  - Porta 3002 disponível para WebSocket
- **Periféricos compatíveis:**
  - Balança: Toledo (protocolo serial)
  - Impressora: Epson, Brother, Elgin, Daruma (ESC/POS 58mm/80mm)
  - Leitor: qualquer USB HID (emulação de teclado)
  - Gaveta: via porta serial ou impressora (ESC/POS kick drawer)

---

## 6. Fluxos Principais

### 6.1 Fluxo de Venda no PDV

1. Operador faz login no PDV
2. Sistema valida credenciais e permissões
3. Sistema verifica conexão com Hardware Service (periféricos)
4. Abre um novo pedido de venda
5. Adiciona produtos:
   - Via busca por nome
   - Via código de barras (leitor via Hardware Service)
   - Via balança (peso recebido via WebSocket)
   - Via tela touchscreen (categorias)
6. Para produtos a granel:
   - Operador coloca produto na balança
   - Hardware Service envia peso via WebSocket `{type: "weight", data: X}`
   - Sistema calcula valor (preço/kg × peso)
7. Aplica descontos se necessário (requer justificativa)
8. Identifica cliente (opcional, obrigatório para NF-e e programa de fidelidade)
9. Cliente acumula pontos/cashback (se cadastrado)
10. Seleciona forma(s) de pagamento:
    - **Dinheiro:** informa valor recebido, calcula troco
    - **PIX:** gera QR Code, aguarda confirmação (webhook)
    - **Cartão:** registra dados manualmente da maquininha
11. Se exclusão de item: sistema registra quem, quando e por quê
12. Confirma venda
13. Sistema emite NFC-e automaticamente (quando implementado)
14. Envia comando de impressão via Hardware Service:
    - `{action: "printReceipt", data: {...}}`
15. Atualiza estoque automaticamente (baixa produtos)
16. Registra movimento financeiro (conta a receber ou entrada em caixa)
17. Abre gaveta de dinheiro (se pagamento em espécie):
    - `{action: "openDrawer"}`
18. Exibe mensagem de agradecimento

> **Importante:** O sistema requer conexão com a internet. 
> Se o Hardware Service não estiver conectado, operações com periféricos ficam indisponíveis.

### 6.3 Fluxo de Entrada de Mercadoria por XML
1. Usuário acessa "Estoque > Entrada de Produtos"
2. Clica em "Importar XML da Nota Fiscal"
3. Faz upload do arquivo XML do fornecedor
4. Sistema valida estrutura do XML
5. Sistema extrai dados:
   - Fornecedor (CNPJ, razão social)
   - Data da nota
   - Produtos (código, descrição, quantidade, valor unitário, total)
   - Impostos (ICMS, IPI, etc.)
6. Sistema tenta fazer matching automático dos produtos:
   - Por código EAN/NCM
   - Por descrição similar
7. Lista produtos encontrados com status:
   - ✅ Encontrado (produto já cadastrado)
   - ⚠️ Sugestão (produto similar)
   - ❌ Não encontrado (produto novo)
8. Usuário revisa e ajusta:
   - Confirma produtos encontrados
   - Vincula produtos sugeridos
   - Cadastra novos produtos (se necessário)
   - Ajusta quantidades se divergente
   - Confirma ou altera preços de custo
9. Sistema dá entrada no estoque:
   - Incrementa quantidade de cada produto
   - Atualiza custo médio ponderado
   - Registra movimentação com referência ao XML
10. Sistema registra movimento financeiro:
    - Cria conta a pagar (se compra a prazo)
    - Vincula com fornecedor
    - Define vencimentos conforme condição de pagamento
11. Sistema arquiva XML para auditoria fiscal
12. Exibe resumo da importação
13. Permite impressão/visualização do relatório de entrada

### 6.4 Fluxo de Fechamento de Caixa
1. Operador acessa "Fechar Caixa" no PDV
2. Sistema valida se há vendas pendentes de finalização
3. Sistema lista todas as vendas do turno do operador:
   - Vendas finalizadas
   - Cancelamentos
   - Sangrias realizadas
   - Suprimentos realizados
4. Exibe resumo por forma de pagamento:
   - Dinheiro: R$ X
   - Débito: R$ Y
   - Crédito: R$ Z
   - PIX: R$ W
   - Outros: R$ V
5. Operador informa valores físicos:
   - Dinheiro contado no caixa
   - Comprovantes de cartão (quantidade)
   - Comprovantes PIX
6. Sistema calcula divergências:
   - Sobra (positivo)
   - Falta (negativo)
7. Se divergência > R$ 5,00: exige justificativa
8. Operador confirma fechamento
9. Sistema:
   - Gera relatório detalhado de caixa
   - Salva snapshot das movimentações
   - Registra horário e responsável pelo fechamento
   - Marca caixa como "fechado"
10. Imprime comprovante de fechamento (2 vias):
    - 1ª via: operador
    - 2ª via: arquivo/gerência
11. Bloqueia PDV para novas vendas
12. Para reabrir: gerente ou admin deve autorizar nova abertura

### 6.5 Fluxo de Abertura de Pacote para Venda a Granel
1. Estoquista acessa "Estoque > Abrir Pacote"
2. Busca produto "mãe" (ex: "Ração Golden 15kg")
3. Informa quantidade de pacotes a abrir (ex: 2 pacotes)
4. Sistema calcula:
   - Baixa: 2 unidades do produto "Ração Golden 15kg"
   - Entrada: 30kg no produto "Ração Golden a Granel"
5. Sistema exibe prévia da movimentação
6. Estoquista confirma
7. Sistema:
   - Registra movimentação de saída do pacote fechado
   - Registra movimentação de entrada do produto a granel
   - Mantém rastreabilidade (número do lote, validade)
   - Calcula custo do produto a granel (proporcional ao pacote)
   - Registra data, hora e responsável
8. Sistema gera etiquetas de identificação:
   - Produto a granel
   - Validade
   - Lote de origem
9. Imprime etiquetas para as embalagens
10. Produto a granel fica disponível para venda no PDV

### 6.6 Fluxo de Venda de Produto a Granel no PDV
1. Cliente solicita quantidade de produto a granel
2. Operador:
   - Coloca embalagem vazia na balança (faz tara)
   - Adiciona produto até peso desejado
   - Balança envia peso automaticamente para PDV
3. Sistema:
   - Recebe peso da balança (ex: 2.350 kg)
   - Calcula valor (preço/kg × peso)
   - Adiciona ao pedido de venda
4. Sistema imprime etiqueta com:
   - Código de barras único
   - Descrição do produto
   - Peso
   - Valor unitário (R$/kg)
   - Valor total
   - Data
5. Operador cola etiqueta na embalagem
6. Venda continua normalmente
7. Ao finalizar venda:
   - Sistema dá baixa proporcional no estoque a granel
   - NFC-e é emitida com descrição e peso corretos

### Fase 1 - MVP Core (Meses 1-3)
**Objetivo:** Sistema básico funcional para iniciar operação

- ✅ Setup de infraestrutura (servidor, banco de dados)
- ✅ Autenticação e gestão de usuários (5 perfis)
- ✅ Cadastro de produtos (sem a granel ainda)
- ✅ Cadastro de clientes (campos opcionais)
- ✅ PDV simplificado online (sem offline)
- ✅ Venda com dinheiro
- ✅ Integração com balança Prix Fit 3 (pesagem básica)
- ✅ Integração com impressora Prix (cupom não fiscal)
- ✅ Integração com leitor de código de barras
- ✅ Emissão de cupom não fiscal
- ✅ Controle básico de estoque (entrada/saída)
- ✅ Relatório básico de vendas do dia
- ✅ Relatório de estoque atual

**Entregável:** PDV funcionando com venda básica e controle de estoque

### Fase 2 - Gestão Financeira Completa
**Objetivo:** Controle financeiro total da empresa

- ✅ Lançamentos financeiros (receitas e despesas)
- ✅ Plano de contas personalizado
- ✅ Centro de custos
- ✅ Contas a receber (com parcelas)
- ✅ Contas a pagar (com parcelas)
- ✅ Cadastro de contas bancárias (Itaú, Nubank, Mercado Pago)
- ✅ Fluxo de caixa (visão 12 meses)
- ✅ Projeção financeira
- ✅ Conciliação bancária (manual com importação CSV)
- ✅ Relatórios financeiros:
  - DRE completo
  - Balancete
  - Análise de custos por centro
  - Inadimplência
- ✅ Controle de impostos
- ✅ Categorização de despesas
- ✅ Pagamentos com cartão (registro manual)

**Entregável:** Controle financeiro operacional completo

### Fase 3 - PDV Avançado e Pagamentos
**Objetivo:** PDV completo com todos os métodos de pagamento e modo offline

- ✅ Modo offline com Electron
- ✅ Banco local SQLite
- ✅ Sincronização automática bidirecional
- ✅ Resolução de conflitos (last-write-wins)
- ✅ Recebimento via PIX (QR Code dinâmico):
  - Integração Itaú
  - Integração Mercado Pago
  - Integração Nubank
- ✅ Validação automática PIX (webhook)
- ✅ Múltiplas formas de pagamento em uma venda
- ✅ Display para cliente
- ✅ Gaveta de dinheiro automática
- ✅ Operações de caixa (abertura, fechamento, sangria, suprimento)
- ✅ Auditoria de exclusões/cancelamentos
- ✅ Indicador de status de conexão

**Entregável:** PDV robusto funcionando online e offline com PIX

### Fase 4 - Fiscal Completo
**Objetivo:** Emissão de todas as notas fiscais obrigatórias

**Pré-requisito:** Adquirir Certificado Digital A1

- ✅ Configuração de certificado digital
- ✅ NFC-e (Nota Fiscal de Consumidor Eletrônica):
  - Integração com SEFAZ-SP
  - Emissão automática pelo PDV
  - Contingência offline (DPEC)
  - Cancelamento
- ✅ NF-e (Nota Fiscal Eletrônica - Modelo 55):
  - Emissão de entrada
  - Emissão de saída
  - Carta de Correção
  - Inutilização de numeração
- ✅ NFS-e (Mauá/SP):
  - Integração com prefeitura
  - Cálculo de ISS
  - Emissão de RPS
- ✅ Gestão de séries e numeração
- ✅ Validação automática de dados fiscais
- ✅ Arquivo XML de notas
- ✅ Relatórios fiscais para contabilidade

**Entregável:** Sistema 100% fiscal e legal

**Nota:** CF-e SAT SP fica como opcional futuro (não é prioridade inicial)

### Fase 5 - Estoque Avançado
**Objetivo:** Gestão completa e específica de estoque pet shop

- ✅ **Produtos a granel:**
  - Abertura de pacotes
  - Conversão automática (kg/unidades)
  - Venda por peso (integração balança)
  - Impressão de etiquetas com código de barras
  - Rastreabilidade de origem
- ✅ **Produtos perecíveis:**
  - Controle de validade
  - Alertas automáticos (15, 7, 3 dias)
  - FIFO automático
  - Relatório de produtos a vencer/vencidos
- ✅ **Controle de lote (opcional):**
  - Ativação sob demanda
  - Rastreabilidade para recalls
  - Bloqueio de lotes
- ✅ Entrada por XML (importação automática de NF-e)
- ✅ Inventário e ajustes de estoque
- ✅ Múltiplos locais de estoque (loja, depósito)
- ✅ Transferência entre locais
- ✅ Curva ABC de produtos
- ✅ Relatório de movimentações detalhadas
- ✅ Produtos sem movimento
- ✅ Valor total do estoque

**Entregável:** Estoque otimizado para pet shop com controle a granel

### Fase 6 - Funcionalidades Complementares
**Objetivo:** Recursos que agregam valor e diferenciam o negócio

- ✅ **Programa de Fidelidade:**
  - Acúmulo de pontos por compra
  - Resgate de prêmios/descontos
  - Catálogo de prêmios
  - Relatórios de pontos distribuídos
- ✅ **Orçamentos:**
  - Criação rápida
  - Validade configurável
  - Conversão automática em venda
  - Envio por e-mail/WhatsApp
- ✅ **Cadastro de Pets:**
  - Vinculação com clientes
  - Histórico de compras por pet
  - Fotos
- ✅ **Gestão de Fornecedores:**
  - Histórico de compras
  - Avaliação de desempenho
  - Prazos de pagamento
- ✅ **Dashboard Gerencial:**
  - Visão consolidada do negócio
  - Top 5 relatórios em cards
  - Gráficos de evolução
  - Indicadores chave (KPIs)
- ✅ **Relatórios Avançados:**
  - Todos os 5 relatórios críticos diários
  - Relatórios complementares
  - Filtros avançados
- ✅ **Melhorias de UX/UI:**
  - Design refinado
  - Atalhos de teclado configuráveis
  - Modo escuro
  - Tutorial interativo
- ✅ Otimizações de performance
- ✅ Testes extensivos

**Entregável:** Sistema completo e polido pronto para escala

---

### Fase 7 - Futuro (Pós-MVP, sob demanda)
**Recursos planejados mas não prioritários:**

- 📅 Agendamento de serviços (banho, tosa)
- 📅 Ordens de Serviço completas
- 📅 Integração automática Stone (API)
- 📅 CF-e SAT SP (modelo 59)
- 📅 Open Banking (extrato automático)
- 📅 Integração WhatsApp Business (envio automático de orçamentos/notas)
- 📅 App mobile para consultas (clientes e gestores)
- 📅 Sistema de comissões para vendedores
- 📅 Módulo de compras (pedidos para fornecedores)
- 📅 Integração com marketplaces (vendas online)

---

## 8. Métricas de Sucesso

### 7.1 Métricas de Produto
- Tempo médio de fechamento de venda: < 60 segundos
- Taxa de sincronização bem-sucedida (offline): > 99%
- Tempo de emissão de NFC-e: < 5 segundos
- Uptime do sistema: > 99.5%

### 8.1 Métricas de Produto
- Tempo médio de fechamento de venda: < 45 segundos
- Taxa de sincronização bem-sucedida (offline): > 99%
- Tempo de emissão de NFC-e: < 5 segundos
- Uptime do sistema: > 99%
- Tempo de geração de relatórios: < 10 segundos
- Acurácia na conciliação bancária: > 95%

### 8.2 Métricas de Negócio
- Redução de erros de estoque: > 80% (comparado a controle manual)
- Agilidade no fechamento de caixa: redução de 60% do tempo
- Precisão no controle financeiro: 100% de rastreabilidade
- Tempo de treinamento de novos operadores: < 2 horas
- Satisfação do usuário (avaliação interna): > 8/10
- Redução de perdas por vencimento: > 50% (com alertas)
- Aumento na conversão de orçamentos: meta 30%
- Aderência ao programa de fidelidade: > 40% dos clientes

---

## 9. Riscos e Mitigações

### 9.1 Riscos Técnicos

**Risco:** Complexidade da integração fiscal (SEFAZ)
**Impacto:** Alto  
**Probabilidade:** Média
**Mitigação:** 
- Usar bibliotecas consolidadas (node-nfe, nfephp-org)
- Testes extensivos em ambiente de homologação
- Adquirir certificado digital A1 antes da Fase 4
- Consultoria fiscal se necessário

**Risco:** Sincronização offline com conflitos de dados
**Impacto:** Médio  
**Probabilidade:** Média
**Mitigação:** 
- Implementar estratégia last-write-wins
- Log detalhado de conflitos para revisão manual
- Testes intensivos de cenários offline
- Limitar operações críticas em modo offline

**Risco:** Integração com periféricos diversos (balança, impressora)
**Impacto:** Médio  
**Probabilidade:** Baixa (modelos específicos definidos)
**Mitigação:** 
- Usar protocolo ESC/POS padrão para impressora Prix
- Documentação específica da balança Prix Fit 3
- Criar camada de abstração para periféricos
- Adquirir equipamentos antes dos testes

**Risco:** Performance com grande volume de dados (500+ produtos, 200 vendas/dia)
**Impacto:** Médio  
**Probabilidade:** Baixa
**Mitigação:** 
- Índices otimizados no PostgreSQL
- Paginação em todas as listagens
- Cache com Redis para queries frequentes
- Arquivamento de dados antigos (> 2 anos)
- Monitoramento de performance desde o início

**Risco:** Falha na integração PIX (webhook não chega)
**Impacto:** Alto  
**Probabilidade:** Baixa
**Mitigação:** 
- Implementar polling como fallback
- Circuit breaker e retry com backoff
- Testar com 3 PSPs (Itaú, Mercado Pago, Nubank)
- Modo degradado: confirmação manual se webhook falhar

**Risco:** Electron PDV consumindo muitos recursos
**Impacto:** Médio  
**Probabilidade:** Baixa
**Mitigação:** 
- Otimizar bundle com Vite
- Lazy loading de componentes
- Limpeza de memória periódica
- Definir requisitos mínimos de hardware

### 9.2 Riscos de Negócio

**Risco:** Mudanças na legislação fiscal (SEFAZ, NFC-e)
**Impacto:** Alto  
**Probabilidade:** Média
**Mitigação:** 
- Monitorar atualizações da SEFAZ-SP
- Manter código fiscal modular e desacoplado
- Usar bibliotecas mantidas pela comunidade
- Assinar newsletters de contabilidade/fiscal

**Risco:** Indisponibilidade de APIs terceiras (PIX, SEFAZ)
**Impacto:** Alto  
**Probabilidade:** Baixa
**Mitigação:** 
- Implementar circuit breakers
- Modo contingência fiscal (DPEC para NFC-e)
- Fallbacks para funcionalidades críticas
- Múltiplos PSPs para PIX

**Risco:** Perda de dados por falha de hardware/servidor
**Impacto:** Crítico  
**Probabilidade:** Baixa
**Mitigação:** 
- Backup diário automático (3h da manhã)
- Backup incremental a cada 6 horas
- Armazenamento em múltiplos locais (local + nuvem)
- Testes de restauração mensais
- Documentação clara do processo de recovery

**Risco:** Resistência dos funcionários ao novo sistema
**Impacto:** Médio  
**Probabilidade:** Média
**Mitigação:** 
- Interface intuitiva e simples
- Treinamento prático de 2 horas
- Período de transição gradual
- Suporte próximo nas primeiras semanas
- Coletar feedback contínuo

**Risco:** Custo com infraestrutura maior que o esperado
**Impacto:** Baixo  
**Probabilidade:** Baixa
**Mitigação:** 
- Iniciar com servidor VPS básico
- Escalar conforme necessidade
- Otimizar queries e cache para reduzir recursos
- Monitorar custos mensalmente

---

## 10. Dependências Externas

### 10.1 APIs e Serviços
- **SEFAZ-SP** (estadual): emissão de NFC-e e NF-e
- **SEFAZ Nacional** (Receita Federal): validação de CNPJs, consultas
- **Prefeitura de Mauá/SP**: emissão de NFS-e
- **PSPs PIX:**
  - Itaú: API Pix (Client ID, Secret, Certificado)
  - Mercado Pago: Checkout Transparente (Access Token, Public Key)
  - Nubank: Pix API (API Key, Certificado)
- **Correios/ViaCEP**: consulta de CEPs (API pública)
- **Receita Federal**: validação de CNPJs (API pública)

### 10.2 Infraestrutura e Serviços
- **Servidor/Hospedagem:**
  - VPS Linux (Ubuntu 22.04+)
  - Mínimo: 4GB RAM, 2 vCPUs, 80GB SSD
  - Recomendado: 8GB RAM, 4 vCPUs, 160GB SSD
- **Domínio próprio:** para acesso web e certificado SSL
- **Certificado SSL:** Let's Encrypt (gratuito) ou pago
- **Serviço de e-mail:** para envio de notificações (Gmail SMTP, SendGrid, etc.)
- **Backup externo:** Google Drive, Dropbox, AWS S3 (para redundância)

### 10.3 Hardware e Equipamentos (PDV)
**Por ponto de venda:**
- **Computador:**
  - Windows 10/11
  - Mínimo: 4GB RAM, processador dual-core, 128GB armazenamento
  - Recomendado: 8GB RAM, quad-core, 256GB SSD
- **Monitor principal:** 19" ou superior (1366x768 mínimo)
- **Monitor secundário (opcional):** para display do cliente
- **Impressora térmica:** Impressora Prix (ESC/POS)
- **Balança:** Balança Comercial Digital Prix Fit 3 (Pholex)
- **Leitor de código de barras:** USB HID (qualquer modelo compatível)
- **Gaveta de dinheiro:** conectada à impressora (RJ11/12)
- **Conexão internet:** fibra óptica (mínimo 10Mbps, recomendado 50Mbps+)

### 10.4 Software e Licenças
- **Certificado Digital A1:** para emissão de notas fiscais (validade 1 ano)
  - Adquirir em: Serasa, Certisign, Soluti, etc.
  - Custo estimado: R$ 150-250/ano
- **Sistema Operacional:** Windows 10/11 (já licenciado no hardware)
- **Drivers:**
  - Driver impressora Prix
  - Driver balança Prix Fit 3 (fornecido pela Pholex)

### 10.5 Serviços Opcionais (Futuro)
- **WhatsApp Business API:** para envio automatizado de mensagens
- **SMS Gateway:** para notificações via SMS
- **Sistema de Monitoramento:** New Relic, Datadog, etc.
- **CDN:** Cloudflare para melhor performance web

---

## 11. Glossário

- **PDV**: Ponto de Venda (frente de caixa)
- **ERP**: Enterprise Resource Planning (sistema de gestão empresarial)
- **NFC-e**: Nota Fiscal de Consumidor Eletrônica (modelo 65)
- **NF-e**: Nota Fiscal Eletrônica (modelo 55)
- **NFS-e**: Nota Fiscal de Serviço Eletrônica
- **CF-e SAT**: Cupom Fiscal Eletrônico SAT (modelo 59 - São Paulo)
- **SEFAZ**: Secretaria da Fazenda
- **SKU**: Stock Keeping Unit (unidade de manutenção de estoque)
- **EAN**: European Article Number (código de barras padrão internacional)
- **FIFO**: First In, First Out (primeiro a entrar, primeiro a sair)
- **DRE**: Demonstração do Resultado do Exercício
- **CFOP**: Código Fiscal de Operações e Prestações
- **CST**: Código de Situação Tributária
- **NCM**: Nomenclatura Comum do Mercosul
- **CEST**: Código Especificador da Substituição Tributária
- **ICMS**: Imposto sobre Circulação de Mercadorias e Serviços
- **ISS**: Imposto Sobre Serviços
- **PSP**: Provedor de Serviços de Pagamento
- **PIX**: Sistema de pagamento instantâneo brasileiro
- **Webhook**: Callback HTTP para notificações em tempo real
- **A1**: Tipo de certificado digital armazenado em arquivo
- **DPEC**: Declaração Prévia de Emissão em Contingência
- **RPS**: Recibo Provisório de Serviço
- **CC-e**: Carta de Correção Eletrônica
- **CMV**: Custo da Mercadoria Vendida
- **EBITDA**: Lucro antes de juros, impostos, depreciação e amortização
- **JWT**: JSON Web Token (autenticação)
- **ESC/POS**: Protocolo de impressoras térmicas
- **HID**: Human Interface Device (dispositivo USB plug and play)
- **LGPD**: Lei Geral de Proteção de Dados
- **SLA**: Service Level Agreement (acordo de nível de serviço)
- **RPO**: Recovery Point Objective (ponto de recuperação)
- **RTO**: Recovery Time Objective (tempo de recuperação)

---

## 12. Próximos Passos

### 12.1 Validação e Aprovação
- [ ] Revisar e aprovar este PRD completo
- [ ] Validar todas as funcionalidades listadas
- [ ] Confirmar prioridades e roadmap
- [ ] Aprovar stack tecnológica proposta

### 12.2 Design e Prototipação
- [ ] Criar wireframes das telas principais:
  - Dashboard gerencial
  - PDV (tela de venda)
  - Cadastro de produtos
  - Gestão financeira (contas a pagar/receber)
  - Relatórios
- [ ] Definir identidade visual (logo, cores, tipografia)
- [ ] Prototipar fluxos críticos (venda, abertura de pacote, fechamento de caixa)
- [ ] Validar UX com usuários finais (você e equipe)

### 12.3 Arquitetura Detalhada
- [ ] Modelar banco de dados completo (PostgreSQL):
  - Diagrama ER
  - Tabelas e relacionamentos
  - Índices e constraints
- [ ] Definir estrutura de APIs REST:
  - Endpoints principais
  - Autenticação e autorização
  - Rate limiting
- [ ] Arquitetura de sincronização offline:
  - Estratégia de resolução de conflitos
  - Estrutura SQLite local
  - Filas e workers
- [ ] Arquitetura de integração com periféricos
- [ ] Plano de segurança e backup

### 12.4 Setup do Ambiente
- [ ] Configurar repositórios Git (GitHub/GitLab)
- [ ] Setup do servidor de desenvolvimento:
  - Backend (Node.js + PostgreSQL + Redis)
  - Frontend web (React + Vite)
  - PDV Electron
- [ ] Configurar CI/CD básico
- [ ] Ambiente de homologação (staging)
- [ ] Configurar ferramentas:
  - Prisma ORM
  - Docker/Docker Compose
  - ESLint + Prettier
  - Testes (Jest/Vitest)

### 12.5 Aquisição de Recursos
- [ ] **Hardware PDV:**
  - [ ] Computador (Windows 10/11, 8GB RAM)
  - [ ] Balança Prix Fit 3 (Pholex)
  - [ ] Impressora Prix
  - [ ] Leitor de código de barras USB
  - [ ] Gaveta de dinheiro
  - [ ] Monitor adicional (display cliente)
- [ ] **Contas e Credenciais:**
  - [ ] Confirmar acesso APIs PIX:
    - [ ] Itaú (solicitar credenciais de desenvolvimento)
    - [ ] Mercado Pago (criar conta dev)
    - [ ] Nubank (solicitar API Key)
  - [ ] Conta SEFAZ homologação (ambiente de testes)
  - [ ] Prefeitura Mauá (credenciais NFS-e)
- [ ] **Infraestrutura:**
  - [ ] Contratar VPS (DigitalOcean, AWS, Contabo, etc.)
  - [ ] Registrar domínio
  - [ ] Configurar certificado SSL
  - [ ] Configurar serviço de e-mail (SMTP)

### 12.6 Desenvolvimento
- [ ] Seguir roadmap detalhado por fases
- [ ] Entregas incrementais de funcionalidades
- [ ] Testes contínuos de cada funcionalidade
- [ ] Documentação técnica e de usuário
- [ ] Ajustes com base em feedback

### 12.7 Preparação para Go-Live Fiscal
- [ ] Adquirir Certificado Digital A1
- [ ] Homologar empresa na SEFAZ-SP
- [ ] Configurar séries de NFC-e e NF-e
- [ ] Realizar testes em ambiente de homologação
- [ ] Solicitar autorização de uso da NFS-e em Mauá

---

## 13. Critérios de Aceitação

### 13.1 Para Fase 1 (MVP)
- [ ] Usuário consegue fazer login com diferentes perfis
- [ ] Cadastrar 50 produtos em menos de 30 minutos
- [ ] Realizar venda com dinheiro em menos de 60 segundos
- [ ] Balança captura peso automaticamente
- [ ] Leitor de código de barras adiciona produto instantaneamente
- [ ] Impressora emite cupom não fiscal corretamente
- [ ] Estoque atualiza automaticamente após venda
- [ ] Relatório de vendas do dia exibe dados corretos
- [ ] Sistema funciona 8 horas seguidas sem erros

### 13.2 Para Fase 2 (Financeiro)
- [ ] Lançar 20 contas a pagar em menos de 15 minutos
- [ ] Fluxo de caixa projeta corretamente próximos 30 dias
- [ ] Conciliação bancária identifica 95% das transações automaticamente
- [ ] DRE gera em menos de 5 segundos para período de 1 ano
- [ ] Alertas de vencimento chegam com 3 dias de antecedência

### 13.3 Para Fase 3 (PDV Avançado)
- [ ] PDV funciona offline por 8 horas ininterruptas
- [ ] Sincronização completa 50 vendas em menos de 3 minutos
- [ ] PIX valida pagamento em menos de 10 segundos
- [ ] Gaveta abre automaticamente ao receber dinheiro
- [ ] Display cliente mostra valores em tempo real
- [ ] Fechamento de caixa completo em menos de 5 minutos

### 13.4 Para Fase 4 (Fiscal)
- [ ] NFC-e emitida em menos de 5 segundos
- [ ] XML autorizado pela SEFAZ sem erros
- [ ] NF-e de entrada importada e produtos cadastrados automaticamente
- [ ] Certificado digital valida corretamente
- [ ] Modo contingência funciona quando SEFAZ indisponível

### 13.5 Para Fase 5 (Estoque)
- [ ] Abrir pacote e converter para granel em menos de 2 minutos
- [ ] Venda a granel com balança funciona perfeitamente
- [ ] Alertas de validade notificam 15, 7 e 3 dias antes
- [ ] Entrada por XML processa 20 produtos em menos de 3 minutos
- [ ] Curva ABC classifica 500 produtos em menos de 10 segundos

### 13.6 Para Sistema Completo
- [ ] Sistema suporta 10 PDVs simultâneos sem lentidão
- [ ] Uptime > 99% em 30 dias de operação
- [ ] Backup automático funciona diariamente
- [ ] Todos os relatórios críticos geram em menos de 10 segundos
- [ ] Taxa de erros < 1% em 1000 transações
- [ ] Satisfação do usuário ≥ 8/10

---

**Observações Finais:**  

✅ Este PRD está completo e detalhado, cobrindo **todas** as funcionalidades solicitadas  
✅ Roadmap dividido em 6 fases alcançáveis de forma incremental  
✅ Especificações técnicas alinhadas com sua realidade (equipamentos, bancos, município)  
✅ Controle financeiro **completo** integrado ao sistema  
✅ Gestão de estoque específica para pet shop (produtos a granel, perecíveis)  
✅ Foco em usabilidade e agilidade no PDV  
✅ Preparado para escalar conforme o negócio cresce  
✅ Pronto para desenvolvimento com copilot de IA (Cursor, Windsurf, etc.)

**Este documento é vivo**: atualize-o sempre que novos requisitos surgirem ou prioridades mudarem. Use-o como referência durante todo o desenvolvimento! 🚀