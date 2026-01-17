---
name: Documentation Writer
description: Create clear, comprehensive documentation
status: unfilled
generated: 2026-01-17
---

# Documentation Writer Agent Playbook

## Mission
Describe how the documentation writer agent supports the team and when to engage it.

## Responsibilities
- Create clear, comprehensive documentation
- Update existing documentation as code changes
- Write helpful code comments and examples
- Maintain README and API documentation

## Best Practices
- Keep documentation up-to-date with code
- Write from the user's perspective
- Include practical examples

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Repository Starting Points
- `backend/` — TODO: Describe the purpose of this directory.
- `backups/` — TODO: Describe the purpose of this directory.
- `bkp/` — TODO: Describe the purpose of this directory.
- `docs/` — TODO: Describe the purpose of this directory.
- `erp-petshop/` — TODO: Describe the purpose of this directory.
- `hardware-service/` — TODO: Describe the purpose of this directory.
- `migrations/` — TODO: Describe the purpose of this directory.
- `old/` — TODO: Describe the purpose of this directory.

## Key Files
**Entry Points:**
- [`..\..\..\AppData\Local\Programs\Antigravity\erp-petshop\src\types\index.ts`](..\..\..\AppData\Local\Programs\Antigravity\erp-petshop\src\types\index.ts)
- [`..\..\..\AppData\Local\Programs\Antigravity\bkp\pdv-electron\src\types\index.ts`](..\..\..\AppData\Local\Programs\Antigravity\bkp\pdv-electron\src\types\index.ts)
- [`..\..\..\AppData\Local\Programs\Antigravity\erp-petshop\src\main.tsx`](..\..\..\AppData\Local\Programs\Antigravity\erp-petshop\src\main.tsx)
- [`..\..\..\AppData\Local\Programs\Antigravity\bkp\pdv-electron\src\main.tsx`](..\..\..\AppData\Local\Programs\Antigravity\bkp\pdv-electron\src\main.tsx)
- [`..\..\..\AppData\Local\Programs\Antigravity\hardware-service\src\index.js`](..\..\..\AppData\Local\Programs\Antigravity\hardware-service\src\index.js)
- [`..\..\..\AppData\Local\Programs\Antigravity\backend\src\server.js`](..\..\..\AppData\Local\Programs\Antigravity\backend\src\server.js)
- [`..\..\..\AppData\Local\Programs\Antigravity\backend\src\app.js`](..\..\..\AppData\Local\Programs\Antigravity\backend\src\app.js)

**Pattern Implementations:**
- Controller: [`UploadController`](backend\src\controllers\upload.controller.js), [`SuppliersController`](backend\src\controllers\suppliers.controller.js), [`PetSpeciesController`](backend\src\controllers\petSpecies.controller.js), [`PaymentRateController`](backend\src\controllers\paymentRate.controller.js), [`PaymentConfigurationController`](backend\src\controllers\paymentConfiguration.controller.js), [`CustomersController`](backend\src\controllers\customers.controller.js), [`BankReconciliationController`](backend\src\controllers\bankReconciliation.controller.js), [`BankAccountController`](backend\src\controllers\bankAccount.controller.js), [`AccountsReceivableController`](backend\src\controllers\accountsReceivable.controller.js)

## Architecture Context

### Utils
Shared utilities and helpers
- **Directories**: `erp-petshop\src\utils`, `backend\src\generated\prisma`, `backend\src\utils`
- **Symbols**: 5 total
- **Key exports**: [`isValidCPF`](erp-petshop\src\utils\validators.ts#L1), [`formatCPF`](erp-petshop\src\utils\validators.ts#L17), [`isValidCPF`](backend\src\utils\validators.js#L1), [`formatCPF`](backend\src\utils\validators.js#L17), [`formatCNPJ`](backend\src\utils\validators.js#L26)

### Services
Business logic and orchestration
- **Directories**: `erp-petshop\src\services`, `backend\src\services`, `bkp\pdv-electron\src\services`, `erp-petshop\src\components\management`, `hardware-service\src`, `hardware-service\src\devices`, `backend\src\routes`, `backend\src\controllers`
- **Symbols**: 44 total
- **Key exports**: [`Groomer`](erp-petshop\src\services\managementService.ts#L3), [`GroomingService`](erp-petshop\src\services\managementService.ts#L13), [`GroomingResource`](erp-petshop\src\services\managementService.ts#L22), [`ServiceMatrixEntry`](erp-petshop\src\services\managementService.ts#L29), [`Commission`](erp-petshop\src\services\commissionService.ts#L3), [`CommissionFilters`](erp-petshop\src\services\commissionService.ts#L16), [`Appointment`](erp-petshop\src\services\appointmentService.ts#L3), [`authFetch`](erp-petshop\src\services\api.ts#L48), [`SeniorityLevel`](backend\src\services\durationCalculator.ts#L1), [`CoatType`](backend\src\services\durationCalculator.ts#L2), [`BreedSize`](backend\src\services\durationCalculator.ts#L3), [`calculateAppointmentDuration`](backend\src\services\durationCalculator.ts#L36), [`initDatabase`](bkp\pdv-electron\src\services\database.ts#L11), [`saveToIndexedDB`](bkp\pdv-electron\src\services\database.ts#L192), [`getDatabase`](bkp\pdv-electron\src\services\database.ts#L266), [`closeDatabase`](bkp\pdv-electron\src\services\database.ts#L273)

### Repositories
Data access and persistence
- **Directories**: `erp-petshop\src\data`, `erp-petshop\src\components`, `erp-petshop\src\pages\Settings`
- **Symbols**: 3 total
- **Key exports**: [`NFeEmissionData`](erp-petshop\src\pages\Settings\NFeEmissionData.tsx#L5), [`NFCeEmissionData`](erp-petshop\src\pages\Settings\NFCeEmissionData.tsx#L5)

### Components
UI components and views
- **Directories**: `erp-petshop\src\pages`, `erp-petshop\src\components`, `erp-petshop\src\pages\Suppliers`, `erp-petshop\src\pages\Settings`, `erp-petshop\src\pages\Reports`, `erp-petshop\src\pages\Financial`, `erp-petshop\src\pages\Customers`, `erp-petshop\src\components\management`, `bkp\pdv-electron\src\pages`, `bkp\pdv-electron\src\components`
- **Symbols**: 123 total
- **Key exports**: [`Sidebar`](erp-petshop\src\components\Sidebar.tsx#L55), [`QuickCustomerModal`](erp-petshop\src\components\QuickCustomerModal.tsx#L12), [`OpenPackageModal`](erp-petshop\src\components\OpenPackageModal.tsx#L19), [`Header`](erp-petshop\src\components\Header.tsx#L19), [`CustomerSearch`](erp-petshop\src\components\CustomerSearch.tsx#L18), [`ConfirmationModal`](erp-petshop\src\components\ConfirmationModal.tsx#L15), [`NFeCertificate`](erp-petshop\src\pages\Settings\NFeCertificate.tsx#L5), [`NFCeCertificate`](erp-petshop\src\pages\Settings\NFCeCertificate.tsx#L5), [`InvoiceSettings`](erp-petshop\src\pages\Settings\InvoiceSettings.tsx#L5), [`BusinessSettingsDashboard`](erp-petshop\src\pages\Settings\BusinessSettingsDashboard.tsx#L5), [`AuditLogs`](erp-petshop\src\pages\Settings\AuditLogs.tsx#L21), [`ProductPerformanceReport`](erp-petshop\src\pages\Reports\ProductPerformanceReport.tsx#L7), [`DailySalesReport`](erp-petshop\src\pages\Reports\DailySalesReport.tsx#L7), [`QuickCustomerModal`](bkp\pdv-electron\src\components\QuickCustomerModal.tsx#L29)

### Controllers
Request handling and routing
- **Directories**: `erp-petshop\src\components`, `backend\src\routes`, `backend\src\middleware`, `backend\src\controllers`
- **Symbols**: 13 total
- **Key exports**: [`RoleProtectedRoute`](erp-petshop\src\components\RoleProtectedRoute.tsx#L19), [`canAccessPath`](erp-petshop\src\components\RoleProtectedRoute.tsx#L45)
## Key Symbols for This Agent
- [`Product`](erp-petshop\src\types\index.ts#L1) (interface)
- [`CartItem`](erp-petshop\src\types\index.ts#L13) (interface)
- [`Sale`](erp-petshop\src\types\index.ts#L19) (interface)
- [`Customer`](erp-petshop\src\types\index.ts#L32) (interface)
- [`Groomer`](erp-petshop\src\services\managementService.ts#L3) (interface)
- [`GroomingService`](erp-petshop\src\services\managementService.ts#L13) (interface)
- [`GroomingResource`](erp-petshop\src\services\managementService.ts#L22) (interface)
- [`ServiceMatrixEntry`](erp-petshop\src\services\managementService.ts#L29) (interface)
- [`Commission`](erp-petshop\src\services\commissionService.ts#L3) (interface)
- [`CommissionFilters`](erp-petshop\src\services\commissionService.ts#L16) (interface)
- [`Appointment`](erp-petshop\src\services\appointmentService.ts#L3) (interface)
- [`ReceiptData`](erp-petshop\src\hooks\useHardware.ts#L15) (interface)
- [`PrinterInfo`](erp-petshop\src\hooks\useHardware.ts#L42) (interface)
- [`CashCloseData`](erp-petshop\src\hooks\useHardware.ts#L47) (interface)
- [`Database`](bkp\pdv-electron\src\sql.js.d.ts#L2) (interface)

## Documentation Touchpoints
- [Documentation Index](../docs/README.md)
- [Project Overview](../docs/project-overview.md)
- [Architecture Notes](../docs/architecture.md)
- [Development Workflow](../docs/development-workflow.md)
- [Testing Strategy](../docs/testing-strategy.md)
- [Glossary & Domain Concepts](../docs/glossary.md)
- [Data Flow & Integrations](../docs/data-flow.md)
- [Security & Compliance Notes](../docs/security.md)
- [Tooling & Productivity Guide](../docs/tooling.md)

## Collaboration Checklist

1. Confirm assumptions with issue reporters or maintainers.
2. Review open pull requests affecting this area.
3. Update the relevant doc section listed above.
4. Capture learnings back in [docs/README.md](../docs/README.md).

## Hand-off Notes

Summarize outcomes, remaining risks, and suggested follow-up actions after the agent completes its work.
