---
name: Mobile Specialist
description: Mobile development guidance (not applicable to this project)
status: not-applicable
generated: 2026-01-17
---

# Mobile Specialist Agent Playbook

## ⚠️ Status: Não Aplicável

Este projeto **não possui módulo mobile nativo**. O ERP Pet Shop é uma aplicação web responsiva acessada via navegador.

---

## 📱 Situação Atual

### O que existe:

- **PWA Potencial:** O frontend React/Vite pode ser configurado como Progressive Web App
- **Responsividade:** A interface usa TailwindCSS e é adaptável para telas menores
- **Acesso via navegador:** Usuários podem acessar pelo navegador do celular

### O que NÃO existe:

- ❌ Aplicativo nativo iOS
- ❌ Aplicativo nativo Android
- ❌ React Native
- ❌ Flutter
- ❌ Ionic/Capacitor

---

## 🎯 Possível Evolução Futura

Se no futuro for necessário um app mobile, considerar:

### Opção 1: PWA (Recomendado)

**Vantagens:**
- Menor custo de desenvolvimento
- Reutiliza código existente
- Funciona em iOS e Android
- Atualizações instantâneas

**Implementação:**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ERP Pet Shop',
        short_name: 'PetShop',
        theme_color: '#4F46E5',
        icons: [/* ... */]
      }
    })
  ]
});
```

### Opção 2: React Native (Se necessário nativo)

**Quando considerar:**
- Acesso a hardware específico (NFC, Bluetooth Low Energy)
- Performance crítica em animações
- Publicação nas lojas obrigatória

---

## 📋 Hardware Service e Mobile

O **Hardware Service** (impressora, balança, gaveta) funciona apenas em máquinas Windows onde está instalado. Dispositivos móveis **não podem se conectar** ao Hardware Service.

**Solução possível:** Se um tablet for usado como PDV:
1. Instalar Hardware Service no servidor/computador central
2. Configurar WebSocket para aceitar conexões da rede local
3. Tablet se conecta via rede ao Hardware Service do servidor

---

## 📖 Documentação Relacionada

Se este agente for ativado no futuro:

- [Project Overview](../docs/project-overview.md)
- [Architecture](../docs/architecture.md)
- [React Native Docs](https://reactnative.dev/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

*Este playbook será atualizado se/quando o projeto incluir desenvolvimento mobile.*

*Última atualização: Janeiro 2026*
