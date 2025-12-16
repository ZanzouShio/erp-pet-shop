const { spawn, exec } = require('child_process');
const path = require('path');

// Cores para o console
const colors = {
    reset: "\x1b[0m",
    hardware: "\x1b[35m", // Magenta
    system: "\x1b[33m"    // Yellow
};

function log(source, message) {
    const color = source === 'HARDWARE' ? colors.hardware : colors.system;

    const lines = message.toString().split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            console.log(`${color}[${source}] ${line}${colors.reset}`);
        }
    });
}

function killPort(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
            if (!stdout) return resolve();

            const lines = stdout.trim().split('\n');
            const pids = lines.map(line => line.trim().split(/\s+/).pop()).filter(pid => /^\d+$/.test(pid));

            if (pids.length === 0) return resolve();

            const uniquePids = [...new Set(pids)];

            let killed = 0;
            uniquePids.forEach(pid => {
                exec(`taskkill /F /PID ${pid}`, () => {
                    killed++;
                    if (killed === uniquePids.length) resolve();
                });
            });

            if (uniquePids.length === 0) resolve();
        });
    });
}

async function start() {
    console.log(`${colors.system}=== INICIANDO HARDWARE SERVICE ===${colors.reset}`);
    console.log(`${colors.system}Impressora | Leitor de Barras | Balanca | Gaveta${colors.reset}`);

    // 1. Limpar porta 3002
    console.log(`${colors.system}Limpando porta 3002...${colors.reset}`);
    await killPort(3002);

    // 2. Iniciar Hardware Service
    const hardware = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'hardware-service'),
        shell: true
    });

    hardware.stdout.on('data', data => log('HARDWARE', data));
    hardware.stderr.on('data', data => log('HARDWARE', data));

    hardware.on('close', (code) => {
        console.log(`${colors.system}Hardware service encerrado (code ${code})${colors.reset}`);
    });
}

start();
