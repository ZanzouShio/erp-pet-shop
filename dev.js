const { spawn, exec } = require('child_process');
const path = require('path');

// Cores para o console
const colors = {
    reset: "\x1b[0m",
    backend: "\x1b[36m", // Cyan
    frontend: "\x1b[32m", // Green
    system: "\x1b[33m"   // Yellow
};

function log(source, message) {
    const color = source === 'BACKEND' ? colors.backend :
        source === 'FRONTEND' ? colors.frontend : colors.system;

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

            // Remove duplicatas
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
    console.log(`${colors.system}=== INICIANDO ERP PET SHOP ===${colors.reset}`);

    // 1. Limpar portas
    console.log(`${colors.system}Limpando portas 3001 e 5173...${colors.reset}`);
    await killPort(3001);
    await killPort(5173);

    // 2. Iniciar Backend
    const backend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'backend'),
        shell: true
    });

    backend.stdout.on('data', data => log('BACKEND', data));
    backend.stderr.on('data', data => log('BACKEND', data));

    // 3. Iniciar Frontend
    // Aguarda um pouco para o backend subir
    setTimeout(() => {
        const frontend = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, 'erp-petshop'),
            shell: true
        });

        frontend.stdout.on('data', data => log('FRONTEND', data));
        frontend.stderr.on('data', data => log('FRONTEND', data));
    }, 2000);
}

start();
