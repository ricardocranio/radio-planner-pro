@echo off
chcp 65001 >nul
title PGM-FM - Servidor de Desenvolvimento
color 0A

echo ╔══════════════════════════════════════════════════════════════╗
echo ║         PGM-FM RADIO MONITOR - SERVIDOR LOCAL                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo [AVISO] Pasta node_modules nao encontrada!
    echo         Executando npm install...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Iniciando servidor de desenvolvimento...
echo.
echo   URL Local:    http://localhost:8080
echo   URL Rede:     http://[SEU-IP]:8080
echo.
echo   Pressione Ctrl+C para encerrar o servidor
echo.
echo ──────────────────────────────────────────────────────────────
echo.

:: Iniciar servidor Vite
call npm run dev

echo.
echo ──────────────────────────────────────────────────────────────
echo [INFO] Servidor encerrado.
echo.

pause
