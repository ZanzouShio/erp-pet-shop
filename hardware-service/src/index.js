/**
 * Hardware Service - Main Entry Point
 * 
 * WebSocket server for hardware integration (barcode scanner, scale, cash drawer)
 * Runs on localhost and communicates with the web PDV
 */

require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const { ScaleDevice } = require('./devices/scale');
const { DrawerDevice } = require('./devices/drawer');
const { ScannerDevice } = require('./devices/scanner');
const { PrinterDevice } = require('./devices/printer');

const PORT = process.env.PORT || 3002;
const DEBUG = process.env.DEBUG === 'true';
const API_KEY = process.env.HARDWARE_API_KEY || null;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:5174').split(',');

// Initialize devices
const devices = {
    scale: null,
    drawer: null,
    scanner: null,
    printer: null
};

function log(...args) {
    if (DEBUG) console.log('[Hardware]', ...args);
}

/**
 * Validate WebSocket connection request
 * - Check origin against allowed list
 * - Check API key if configured
 */
function validateConnection(request) {
    const origin = request.headers.origin || '';
    const parsedUrl = url.parse(request.url, true);
    const clientKey = parsedUrl.query.key || request.headers['x-api-key'];

    // Check origin
    const originAllowed = ALLOWED_ORIGINS.some(allowed => {
        // Allow wildcard or exact match
        if (allowed === '*') return true;
        return origin.startsWith(allowed.trim());
    });

    if (!originAllowed && origin) {
        log('❌ Connection rejected - invalid origin:', origin);
        return { valid: false, reason: 'Invalid origin' };
    }

    // Check API key if configured
    if (API_KEY && clientKey !== API_KEY) {
        log('❌ Connection rejected - invalid API key');
        return { valid: false, reason: 'Invalid API key' };
    }

    return { valid: true };
}

function initDevices() {
    // Initialize scale if enabled
    if (process.env.SCALE_ENABLED === 'true') {
        try {
            devices.scale = new ScaleDevice({
                port: process.env.SCALE_PORT,
                baudRate: parseInt(process.env.SCALE_BAUDRATE) || 9600
            });
            log('✅ Scale initialized on', process.env.SCALE_PORT);
        } catch (e) {
            console.error('❌ Failed to initialize scale:', e.message);
        }
    }

    // Initialize drawer if enabled
    if (process.env.DRAWER_ENABLED === 'true') {
        try {
            const command = process.env.DRAWER_COMMAND
                ? process.env.DRAWER_COMMAND.split(',').map(h => parseInt(h, 16))
                : [0x1B, 0x70, 0x00, 0x19, 0xFA];

            devices.drawer = new DrawerDevice({
                port: process.env.DRAWER_PORT,
                baudRate: parseInt(process.env.DRAWER_BAUDRATE) || 9600,
                openCommand: Buffer.from(command)
            });
            log('✅ Drawer initialized on', process.env.DRAWER_PORT);
        } catch (e) {
            console.error('❌ Failed to initialize drawer:', e.message);
        }
    }

    // Initialize scanner (keyboard/stdin mode)
    if (process.env.SCANNER_ENABLED !== 'false') {
        devices.scanner = new ScannerDevice();
        log('✅ Scanner initialized (keyboard mode)');
    }

    // Initialize printer if enabled
    if (process.env.PRINTER_ENABLED === 'true') {
        try {
            devices.printer = new PrinterDevice({
                type: process.env.PRINTER_TYPE || 'epson',
                interface: process.env.PRINTER_INTERFACE || null,
                width: parseInt(process.env.PRINTER_WIDTH) || 32 // 58mm = 32 chars
            });
            log('✅ Printer initialized:', process.env.PRINTER_INTERFACE || 'USB');
        } catch (e) {
            console.error('❌ Failed to initialize printer:', e.message);
        }
    }
}

// Create HTTP server for WebSocket
const server = http.createServer((req, res) => {
    // Simple HTTP endpoint for status check
    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            devices: {
                scale: devices.scale ? 'connected' : 'disabled',
                drawer: devices.drawer ? 'connected' : 'disabled',
                scanner: devices.scanner ? 'connected' : 'disabled'
            }
        }));
        return;
    }
    res.writeHead(404);
    res.end();
});

// Create WebSocket server with validation
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const validation = validateConnection(request);

    if (!validation.valid) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Hardware Service running on ws://localhost:${PORT}`);
    console.log(`   HTTP status: http://localhost:${PORT}/status`);
    console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    if (API_KEY) console.log('   🔒 API key protection enabled');
    console.log('   Waiting for PDV connections...');
});

// Broadcast to all clients
function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Setup device event handlers
function setupDeviceEvents() {
    // Scanner barcode events
    if (devices.scanner) {
        devices.scanner.on('barcode', (barcode) => {
            log('📦 Barcode scanned:', barcode);
            broadcast({ type: 'barcode', data: barcode });
        });
    }

    // Scale weight events
    if (devices.scale) {
        devices.scale.on('weight', (weight) => {
            log('⚖️ Weight:', weight, 'kg');
            broadcast({ type: 'weight', data: weight });
        });
    }
}

// Handle client connections
wss.on('connection', (ws) => {
    log('📱 Client connected');

    // Send initial status
    const enabledDevices = Object.entries(devices)
        .filter(([_, device]) => device !== null)
        .map(([name]) => name);

    ws.send(JSON.stringify({
        type: 'connected',
        devices: enabledDevices
    }));

    // Handle incoming commands
    ws.on('message', async (message) => {
        try {
            const cmd = JSON.parse(message.toString());
            log('📥 Command:', cmd);

            switch (cmd.action) {
                case 'openDrawer':
                    if (devices.drawer) {
                        await devices.drawer.open();
                        ws.send(JSON.stringify({ type: 'drawerOpened', success: true }));
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Drawer not available' }));
                    }
                    break;

                case 'readWeight':
                    if (devices.scale) {
                        const weight = await devices.scale.readWeight();
                        ws.send(JSON.stringify({ type: 'weight', data: weight }));
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Scale not available' }));
                    }
                    break;

                case 'getStatus':
                    const status = {
                        scale: devices.scale ? 'connected' : 'disabled',
                        drawer: devices.drawer ? 'connected' : 'disabled',
                        scanner: devices.scanner ? 'connected' : 'disabled',
                        printer: devices.printer ? 'connected' : 'disabled'
                    };
                    ws.send(JSON.stringify({ type: 'status', data: status }));
                    break;

                case 'printReceipt':
                    if (devices.printer) {
                        try {
                            await devices.printer.printReceipt(cmd.data);
                            ws.send(JSON.stringify({ type: 'receiptPrinted', success: true }));
                        } catch (e) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Print failed: ' + e.message }));
                        }
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Printer not available' }));
                    }
                    break;

                case 'printCashClose':
                    if (devices.printer) {
                        try {
                            await devices.printer.printCashClose(cmd.data);
                            ws.send(JSON.stringify({ type: 'cashClosePrinted', success: true }));
                        } catch (e) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Print failed: ' + e.message }));
                        }
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Printer not available' }));
                    }
                    break;

                case 'listPrinters':
                    try {
                        const printers = await PrinterDevice.listPrinters();
                        ws.send(JSON.stringify({ type: 'printerList', data: printers }));
                    } catch (e) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Failed to list printers: ' + e.message }));
                    }
                    break;

                // Simulated events for testing
                case 'simulateBarcode':
                    if (cmd.barcode) {
                        broadcast({ type: 'barcode', data: cmd.barcode });
                    }
                    break;

                case 'simulateWeight':
                    if (cmd.weight !== undefined) {
                        broadcast({ type: 'weight', data: cmd.weight });
                    }
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown action' }));
            }
        } catch (e) {
            log('❌ Error processing message:', e.message);
            ws.send(JSON.stringify({ type: 'error', message: e.message }));
        }
    });

    ws.on('close', () => {
        log('📱 Client disconnected');
    });
});

// Initialize
initDevices();
setupDeviceEvents();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    wss.close();
    process.exit(0);
});
