@echo off
echo ==========================================
echo      REINICIANDO SERVICOS ERP PET SHOP
echo ==========================================

echo.
echo [1/3] Derrubando processos Node.js antigos...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    - Processos anteriores encerrados.
) else (
    echo    - Nenhum processo Node.js encontrado ou erro ao encerrar.
)

echo.
echo [2/3] Iniciando Backend (Porta 3001)...
start "ERP Backend" cmd /k "cd backend && npm run dev"

echo.
echo    - Aguardando 5 segundos para o backend inicializar...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Iniciando Frontend (Vite)...
start "ERP Frontend" cmd /k "cd erp-petshop && npm run dev"

echo.
echo ==========================================
echo      SERVICOS INICIADOS COM SUCESSO!
echo ==========================================
echo.
echo As janelas do Backend e Frontend foram abertas.
echo Pode fechar esta janela.
pause
