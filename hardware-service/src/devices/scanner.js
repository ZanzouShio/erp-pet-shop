/**
 * Barcode Scanner Device
 * 
 * Most USB barcode scanners work as HID (keyboard) devices.
 * This module listens for stdin input and emits barcode events.
 */

const EventEmitter = require('events');
const readline = require('readline');

class ScannerDevice extends EventEmitter {
    constructor() {
        super();
        this.buffer = '';
        this.lastInput = Date.now();
        this.inputTimeout = 50; // ms between characters to consider same barcode

        this.setupStdinListener();
    }

    setupStdinListener() {
        // For real hardware, we need raw mode
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');

            process.stdin.on('data', (key) => {
                // Handle Ctrl+C
                if (key === '\u0003') {
                    process.emit('SIGINT');
                    return;
                }

                // Handle Enter (barcode complete)
                if (key === '\r' || key === '\n') {
                    if (this.buffer.length > 0) {
                        this.emit('barcode', this.buffer);
                        this.buffer = '';
                    }
                    return;
                }

                // Add to buffer
                this.buffer += key;
                this.lastInput = Date.now();

                // Auto-emit if no input for a while (some scanners don't send Enter)
                setTimeout(() => {
                    if (Date.now() - this.lastInput >= this.inputTimeout && this.buffer.length > 0) {
                        this.emit('barcode', this.buffer);
                        this.buffer = '';
                    }
                }, this.inputTimeout + 10);
            });
        } else {
            // Non-TTY mode (e.g., piped input or testing)
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false
            });

            rl.on('line', (line) => {
                if (line.trim()) {
                    this.emit('barcode', line.trim());
                }
            });
        }
    }
}

module.exports = { ScannerDevice };
