/**
 * Cash Drawer Device
 * 
 * Opens cash drawer via serial port using ESC/POS commands.
 * Compatible with most RJ11-connected cash drawers.
 */

const EventEmitter = require('events');

class DrawerDevice extends EventEmitter {
    constructor(options = {}) {
        super();
        this.port = options.port || 'COM4';
        this.baudRate = options.baudRate || 9600;
        // Standard ESC/POS drawer kick command
        this.openCommand = options.openCommand || Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
        this.serialPort = null;

        this.connect();
    }

    async connect() {
        try {
            const { SerialPort } = await import('serialport');

            this.serialPort = new SerialPort({
                path: this.port,
                baudRate: this.baudRate
            });

            this.serialPort.on('error', (err) => {
                console.error('Drawer error:', err.message);
                this.emit('error', err);
            });

            this.serialPort.on('open', () => {
                console.log('Drawer connected on', this.port);
                this.emit('connected');
            });

        } catch (e) {
            console.error('Failed to connect drawer:', e.message);
            throw e;
        }
    }

    /**
     * Open the cash drawer
     */
    async open() {
        return new Promise((resolve, reject) => {
            if (!this.serialPort || !this.serialPort.isOpen) {
                reject(new Error('Drawer not connected'));
                return;
            }

            this.serialPort.write(this.openCommand, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log('Drawer opened');
                this.emit('opened');
                resolve(true);
            });
        });
    }

    close() {
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close();
        }
    }
}

module.exports = { DrawerDevice };
