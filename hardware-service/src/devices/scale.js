/**
 * Toledo Scale Device
 * 
 * Communicates with Toledo scales via serial port.
 * Protocol: sends weight request, receives weight in kg.
 */

const EventEmitter = require('events');

class ScaleDevice extends EventEmitter {
    constructor(options = {}) {
        super();
        this.port = options.port || 'COM3';
        this.baudRate = options.baudRate || 9600;
        this.serialPort = null;
        this.lastWeight = 0;

        this.connect();
    }

    async connect() {
        try {
            // Dynamic import to handle if serialport is not installed
            const { SerialPort } = await import('serialport');
            const { ReadlineParser } = await import('@serialport/parser-readline');

            this.serialPort = new SerialPort({
                path: this.port,
                baudRate: this.baudRate
            });

            const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

            parser.on('data', (data) => {
                const weight = this.parseWeight(data);
                if (weight !== null && weight !== this.lastWeight) {
                    this.lastWeight = weight;
                    this.emit('weight', weight);
                }
            });

            this.serialPort.on('error', (err) => {
                console.error('Scale error:', err.message);
                this.emit('error', err);
            });

            this.serialPort.on('open', () => {
                console.log('Scale connected on', this.port);
                this.emit('connected');
            });

        } catch (e) {
            console.error('Failed to connect scale:', e.message);
            throw e;
        }
    }

    /**
     * Parse weight from Toledo protocol response
     * Format varies by model, common formats:
     * - "  1.234 kg"
     * - "ST,GS,  1.234kg"
     */
    parseWeight(data) {
        try {
            // Remove non-numeric except decimal point
            const cleaned = data.replace(/[^\d.]/g, '');
            const weight = parseFloat(cleaned);

            if (!isNaN(weight) && weight >= 0) {
                return weight;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Request current weight from scale
     */
    async readWeight() {
        return new Promise((resolve, reject) => {
            if (!this.serialPort || !this.serialPort.isOpen) {
                reject(new Error('Scale not connected'));
                return;
            }

            // Some scales need a command to request weight
            // Common commands: 'W', 'P', ENQ (0x05)
            this.serialPort.write(Buffer.from([0x05]), (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Wait for response
                const timeout = setTimeout(() => {
                    resolve(this.lastWeight);
                }, 500);

                this.once('weight', (weight) => {
                    clearTimeout(timeout);
                    resolve(weight);
                });
            });
        });
    }

    close() {
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close();
        }
    }
}

module.exports = { ScaleDevice };
