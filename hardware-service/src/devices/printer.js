/**
 * Thermal Printer Device
 * 
 * Prints receipts via USB/Serial using ESC/POS commands.
 * Compatible with most 58mm/80mm thermal printers (Epson, Brother, Elgin, etc.)
 */

const EventEmitter = require('events');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

class PrinterDevice extends EventEmitter {
    constructor(options = {}) {
        super();
        this.type = options.type || 'Brother';
        this.interface = options.interface || null; // USB interface path
        this.width = options.width || 40; // Characters per line (58mm = 32-42, 80mm = 48)
        this.printer = null;
        this.connected = false;

        // Always try to initialize (will use Windows default printer if no interface)
        this.connect();
    }

    async connect() {
        try {
            // Map printer type string to PrinterTypes
            const typeMap = {
                'epson': PrinterTypes.EPSON,
                'star': PrinterTypes.STAR,
                'brother': PrinterTypes.BROTHER,
                'daruma': PrinterTypes.DARUMA
            };

            const printerType = typeMap[this.type.toLowerCase()] || PrinterTypes.EPSON;

            this.printer = new ThermalPrinter({
                type: printerType,
                interface: this.interface,
                width: this.width,
                characterSet: CharacterSet.PC860_PORTUGUESE,
                removeSpecialCharacters: false,
                options: {
                    timeout: 5000
                }
            });

            // Test connection
            const isConnected = await this.printer.isPrinterConnected();
            this.connected = isConnected;

            if (isConnected) {
                console.log('✅ Printer connected:', this.interface);
                this.emit('connected');
            } else {
                console.log('⚠️ Printer configured but not responding:', this.interface);
            }

            return isConnected;
        } catch (e) {
            console.error('❌ Failed to connect printer:', e.message);
            this.connected = false;
            throw e;
        }
    }

    /**
     * Print a sale receipt
     * @param {object} receiptData - Receipt data
     * @param {string} receiptData.companyName - Company name
     * @param {string} receiptData.address - Company address
     * @param {string} receiptData.saleNumber - Sale number
     * @param {string} receiptData.date - Sale date/time
     * @param {array} receiptData.items - Array of items with name, quantity, price, total
     * @param {number} receiptData.subtotal - Subtotal
     * @param {number} receiptData.discount - Discount amount
     * @param {number} receiptData.total - Total amount
     * @param {string} receiptData.paymentMethod - Payment method
     * @param {number} receiptData.change - Change amount (if applicable)
     * @param {string} receiptData.operator - Operator name
     */
    async printReceipt(receiptData) {
        if (!this.printer) {
            throw new Error('Printer not initialized');
        }

        try {
            const p = this.printer;

            // Clear previous data
            p.clear();

            p.alignCenter();
            p.setTextNormal(); // Use normal/small text
            p.bold(true);
            p.println(this.normalizeText(receiptData.companyName || 'PET SHOP'));
            p.bold(false);

            // Address line 1: Rua + Número
            if (receiptData.address) {
                p.println(this.normalizeText(receiptData.address));
            }

            // Address line 2: Bairro, Cidade - UF
            if (receiptData.address2) {
                p.println(this.normalizeText(receiptData.address2));
            }

            // Contact: Email / Telefone
            if (receiptData.contact) {
                p.println(this.normalizeText(receiptData.contact));
            }

            p.drawLine();

            p.alignLeft();
            p.println(`Venda #${receiptData.saleNumber}`);
            p.println(`Data: ${receiptData.date}`);
            if (receiptData.operator) {
                p.println(`Operador: ${this.normalizeText(receiptData.operator)}`);
            }

            p.drawLine();

            // Items header
            p.bold(true);
            p.println('ITENS');
            p.bold(false);
            p.newLine();

            // Items
            for (const item of receiptData.items || []) {
                // Product name
                p.println(this.truncate(item.name, this.width));

                // Quantity x Price = Total
                const qty = `${item.quantity}x`;
                const price = this.formatCurrency(item.price);
                const itemTotal = this.formatCurrency(item.total);

                const detailLine = `  ${qty} ${price} = ${itemTotal}`;
                p.println(detailLine);
            }

            p.drawLine();

            // Totals
            p.alignRight();

            if (receiptData.subtotal && receiptData.discount > 0) {
                p.println(`Subtotal: ${this.formatCurrency(receiptData.subtotal)}`);
                p.println(`Desconto: -${this.formatCurrency(receiptData.discount)}`);
            }

            p.bold(true);
            p.println(`TOTAL: ${this.formatCurrency(receiptData.total)}`);
            p.bold(false);

            p.newLine();
            p.alignLeft();
            p.println(`Pagamento: ${this.normalizeText(receiptData.paymentMethod || 'Nao informado')}`);

            if (receiptData.change > 0) {
                p.println(`Troco: ${this.formatCurrency(receiptData.change)}`);
            }

            if (receiptData.installments && receiptData.installments > 1) {
                const installmentValue = receiptData.total / receiptData.installments;
                p.println(`Parcelado: ${receiptData.installments}x de ${this.formatCurrency(installmentValue)}`);
            }

            // Customer info (if identified)
            if (receiptData.customer) {
                p.drawLine();
                p.alignLeft();
                if (receiptData.customer.cpf) {
                    // Format CPF: 000.000.000-00
                    const cpf = receiptData.customer.cpf.replace(/[^\d]/g, '');
                    const formattedCpf = cpf.length === 11
                        ? `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`
                        : receiptData.customer.cpf;
                    p.println(`CPF: ${formattedCpf}`);
                }
                // Always show cashback balance
                const cashback = receiptData.customer.cashback_balance || 0;
                p.println(`Saldo Cashback: ${this.formatCurrency(cashback)}`);
            }

            p.drawLine();

            // Footer
            p.alignCenter();
            p.bold(true);
            p.println('SEM VALOR FISCAL');
            p.bold(false);
            p.println('Obrigado pela preferencia!');
            p.newLine();
            p.newLine();
            p.newLine();
            // No cut - just feed enough to tear manually

            // Execute print
            await p.execute();

            console.log('🖨️ Receipt printed successfully');
            this.emit('printed', receiptData.saleNumber);

            return true;
        } catch (e) {
            console.error('❌ Print error:', e.message || e);
            console.error('Full error:', e);
            this.emit('error', e);
            throw e;
        }
    }

    /**
     * Print a cash close report
     */
    async printCashClose(reportData) {
        if (!this.printer) {
            throw new Error('Printer not initialized');
        }

        try {
            const p = this.printer;
            p.clear();

            p.alignCenter();
            p.bold(true);
            p.println('FECHAMENTO DE CAIXA');
            p.bold(false);
            p.println(this.normalizeText(reportData.terminalName || 'Terminal'));
            p.drawLine();

            p.alignLeft();
            p.println(`Operador: ${this.normalizeText(reportData.operatorName || 'N/A')}`);
            p.println(`Abertura: ${reportData.openedAt || 'N/A'}`);
            p.println(`Fechamento: ${reportData.closedAt || new Date().toLocaleString('pt-BR')}`);
            p.drawLine();

            // Entradas
            p.bold(true);
            p.println('ENTRADAS');
            p.bold(false);
            p.println(`Saldo Inicial: ${this.formatCurrency(reportData.openingBalance)}`);
            p.println(`Suprimentos: +${this.formatCurrency(reportData.totalSuprimentos)}`);
            p.println(`Vendas Dinheiro: +${this.formatCurrency(reportData.totalSales)}`);

            // Vendas Cartão/PIX (se houver)
            if (reportData.totalDebit) {
                p.println(`Debito: ${this.formatCurrency(reportData.totalDebit)}`);
            }
            if (reportData.totalCredit) {
                p.println(`Credito: ${this.formatCurrency(reportData.totalCredit)}`);
            }
            if (reportData.totalPix) {
                p.println(`PIX: ${this.formatCurrency(reportData.totalPix)}`);
            }
            p.drawLine();

            // Saídas
            p.bold(true);
            p.println('SAIDAS');
            p.bold(false);
            p.println(`Sangrias: -${this.formatCurrency(reportData.totalSangrias)}`);
            p.drawLine();

            // Totais
            p.bold(true);
            p.println(`Saldo Esperado: ${this.formatCurrency(reportData.expectedBalance)}`);
            p.println(`Saldo Contado: ${this.formatCurrency(reportData.closingBalance)}`);

            const diff = parseFloat(reportData.closingBalance) - parseFloat(reportData.expectedBalance);
            const diffLabel = Math.abs(diff) < 0.01 ? 'CAIXA OK' : (diff > 0 ? 'SOBRA' : 'FALTA');
            p.println(`${diffLabel}: ${this.formatCurrency(Math.abs(diff))}`);
            p.bold(false);

            // Observações
            if (reportData.notes) {
                p.drawLine();
                p.println(`Obs: ${this.normalizeText(reportData.notes)}`);
            }

            p.drawLine();
            p.alignCenter();
            p.println(new Date().toLocaleString('pt-BR'));

            // Feed lines for manual tear (no cut)
            p.newLine();
            p.newLine();

            await p.execute();

            console.log('🖨️ Cash close report printed');
            return true;
        } catch (e) {
            console.error('❌ Print error:', e.message);
            throw e;
        }
    }

    /**
     * List available USB printers
     */
    static async listPrinters() {
        try {
            // On Windows, we can try to list USB devices
            // This is a simplified approach - real implementation would need 
            // proper USB enumeration or use Windows printer list
            const { exec } = require('child_process');

            return new Promise((resolve, reject) => {
                exec('wmic printer get name,portname', (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error listing printers:', error);
                        resolve([]);
                        return;
                    }

                    const lines = stdout.split('\n')
                        .filter(line => line.trim())
                        .slice(1) // Skip header
                        .map(line => {
                            const parts = line.trim().split(/\s{2,}/);
                            return {
                                name: parts[0] || '',
                                port: parts[1] || ''
                            };
                        })
                        .filter(p => p.name);

                    resolve(lines);
                });
            });
        } catch (e) {
            console.error('Error listing printers:', e);
            return [];
        }
    }

    // Helper functions
    formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return `R$ ${num.toFixed(2).replace('.', ',')}`;
    }

    truncate(str, maxLen) {
        if (!str) return '';
        const normalized = this.normalizeText(str);
        return normalized.length > maxLen ? normalized.substring(0, maxLen - 3) + '...' : normalized;
    }

    // Normalize accented characters to ASCII equivalents
    normalizeText(text) {
        if (!text) return '';
        const accents = {
            'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
            'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
            'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'ñ': 'n',
            'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
            'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
            'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
            'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
            'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
            'Ç': 'C', 'Ñ': 'N'
        };
        return text.split('').map(char => accents[char] || char).join('');
    }

    isConnected() {
        return this.connected;
    }

    close() {
        this.connected = false;
        this.printer = null;
    }
}

module.exports = { PrinterDevice };
