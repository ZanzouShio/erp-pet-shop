# 🌱 Populando o Banco com Dados de Teste

## 📊 Dados que serão inseridos:

- ✅ **5 Categorias** (Rações, Acessórios, Higiene, Petiscos, Brinquedos)
- ✅ **10 Produtos** (os mesmos do mock do PDV)
- ✅ **3 Usuários** (Admin, 2 operadores de PDV)
- ✅ **4 Clientes** cadastrados
- ✅ **5 Pets** vinculados aos clientes
- ✅ **5 Vendas** de exemplo nos últimos 7 dias

## 🚀 Como executar o seed:

### Opção 1: Via pgAdmin (Recomendado)

1. Abra **pgAdmin** em `http://localhost:5050`
2. Conecte ao servidor `erp_petshop`
3. Clique com botão direito em `erp_petshop` (database)
4. Selecione **Query Tool**
5. Abra o arquivo `database-seed.sql` (Ctrl+O)
6. Clique em **Execute** (F5)
7. Verifique as mensagens de sucesso!

### Opção 2: Via Docker CLI

```bash
# Na pasta raiz do projeto
docker exec -i erp-petshop-db psql -U erp_admin -d erp_petshop < database-seed.sql
```

### Opção 3: Via linha de comando (psql)

```bash
psql -h localhost -p 5432 -U erp_admin -d erp_petshop -f database-seed.sql
```

## ✅ Verificação

Após executar, você verá:

```
Categorias cadastradas: 5
Produtos cadastrados: 10
Usuários cadastrados: 3
Clientes cadastrados: 4
Pets cadastrados: 5
Vendas realizadas: 5
Itens vendidos: 11
Total de vendas (últimos 7 dias): R$ 804,10
Valor em estoque: R$ 8.245,00
```

## 📦 Produtos cadastrados:

| ID | Nome | Categoria | Preço | Estoque |
|----|------|-----------|-------|---------|
| 1 | Ração Golden Adult 15kg | Rações | R$ 189,90 | 25 |
| 2 | Ração Royal Canin Puppy 3kg | Rações | R$ 95,50 | 18 |
| 3 | Ração Premier Gatos 10kg | Rações | R$ 156,00 | 12 |
| 4 | Coleira Ajustável Média | Acessórios | R$ 25,90 | 45 |
| 5 | Guia Retrátil 5m | Acessórios | R$ 42,00 | 30 |
| 6 | Shampoo Pet Clean 500ml | Higiene | R$ 18,50 | 65 |
| 7 | Petisco Pedigree Dentastix | Petiscos | R$ 15,90 | 100 |
| 8 | Brinquedo Bola com Guizo | Brinquedos | R$ 12,50 | 55 |
| 9 | Cama Pet Confort G | Acessórios | R$ 89,90 | 8 ⚠️ |
| 10 | Areia Higiênica 4kg | Higiene | R$ 22,00 | 40 |

## 🔐 Usuários de teste:

| Email | Senha | Tipo |
|-------|-------|------|
| admin@petshop.com | admin123 | Administrador |
| pdv@petshop.com | admin123 | Operador |
| maria@petshop.com | admin123 | Operador |

⚠️ **Nota:** As senhas estão com hash placeholder. Você precisará gerar hashes reais com bcrypt no backend.

## 📈 Vendas de exemplo:

5 vendas foram criadas entre 20/11/2024 e hoje, totalizando **R$ 804,10** em vendas.

## 🎯 Próximos passos:

Após o seed:
1. ✅ Banco populado com dados
2. 🔄 Criar backend Node.js simples
3. 🔄 Conectar frontend aos dados reais
4. 🔄 Implementar autenticação

---

**Status:** ✅ Pronto para executar!
