# Hardware Service

Serviço local para integração de hardware do PDV.

## Periféricos Suportados

- **Leitor de Código de Barras** - USB HID (funciona como teclado)
- **Balança Toledo** - Porta serial (protocolo Toledo)
- **Gaveta de Dinheiro** - Porta serial (comando ESC/POS)

## Instalação

```bash
npm install
```

## Configuração

Copie `.env.example` para `.env` e configure as portas:

```bash
cp .env.example .env
```

## Execução

```bash
# Produção
npm start

# Desenvolvimento (auto-reload)
npm run dev
```

## Comunicação

O serviço expõe um WebSocket em `ws://localhost:3002` com os seguintes comandos:

### Eventos do Servidor → Cliente

```json
{"type": "barcode", "data": "7891234567890"}
{"type": "weight", "data": 1.250}
{"type": "connected", "devices": ["scanner", "scale"]}
```

### Comandos do Cliente → Servidor

```json
{"action": "openDrawer"}
{"action": "readWeight"}
{"action": "getStatus"}
```
