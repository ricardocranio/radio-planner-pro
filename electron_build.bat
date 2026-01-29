@echo off
chcp 65001 >nul
title PGM-FM - Build Electron
color 0A

echo ╔══════════════════════════════════════════════════════════════╗
echo ║       PGM-FM RADIO MONITOR - ELECTRON BUILD                  ║
echo ║                    Windows x64                               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [1/7] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale em: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Versao: %%i
echo.

:: Verificar se node_modules existe
echo [2/7] Verificando dependencias...
if not exist "node_modules" (
    echo       Instalando dependencias do projeto...
    npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)
echo       Dependencias OK!
echo.

:: Instalar Electron e electron-builder se necessario
echo [3/7] Verificando Electron...
npm list electron >nul 2>&1
if %errorlevel% neq 0 (
    echo       Instalando Electron e electron-builder...
    npm install --save-dev electron electron-builder app-builder-bin
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar Electron!
        pause
        exit /b 1
    )
)
echo       Electron OK!
echo.

:: Criar estrutura Electron se nao existir
echo [4/7] Verificando estrutura Electron...
if not exist "electron" mkdir electron

if not exist "electron\main.js" (
    echo       Criando electron/main.js...
    (
        echo const { app, BrowserWindow } = require^('electron'^);
        echo const path = require^('path'^);
        echo.
        echo function createWindow^(^) {
        echo   const win = new BrowserWindow^({
        echo     width: 1400,
        echo     height: 900,
        echo     icon: path.join^(__dirname, '../public/icon-512.png'^),
        echo     webPreferences: {
        echo       nodeIntegration: false,
        echo       contextIsolation: true,
        echo       preload: path.join^(__dirname, 'preload.js'^)
        echo     },
        echo     autoHideMenuBar: true,
        echo     titleBarStyle: 'hidden',
        echo     titleBarOverlay: {
        echo       color: '#0a0a0a',
        echo       symbolColor: '#22c55e'
        echo     }
        echo   }^);
        echo.
        echo   // Em producao, carrega os arquivos buildados
        echo   if ^(app.isPackaged^) {
        echo     win.loadFile^(path.join^(__dirname, '../dist/index.html'^)^);
        echo   } else {
        echo     win.loadURL^('http://localhost:8080'^);
        echo     win.webContents.openDevTools^(^);
        echo   }
        echo }
        echo.
        echo app.whenReady^(^).then^(createWindow^);
        echo.
        echo app.on^('window-all-closed', ^(^) =^> {
        echo   if ^(process.platform !== 'darwin'^) app.quit^(^);
        echo }^);
        echo.
        echo app.on^('activate', ^(^) =^> {
        echo   if ^(BrowserWindow.getAllWindows^(^).length === 0^) createWindow^(^);
        echo }^);
    ) > electron\main.js
)

if not exist "electron\preload.js" (
    echo       Criando electron/preload.js...
    (
        echo const { contextBridge } = require^('electron'^);
        echo.
        echo contextBridge.exposeInMainWorld^('electronAPI', {
        echo   platform: process.platform,
        echo   version: process.versions.electron
        echo }^);
    ) > electron\preload.js
)
echo       Estrutura Electron OK!
echo.

:: Build do frontend
echo [5/7] Compilando frontend (Vite)...
npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao do frontend!
    pause
    exit /b 1
)
echo       Frontend compilado!
echo.

:: Limpar builds anteriores
echo [6/7] Limpando builds anteriores...
if exist "release" rmdir /s /q release 2>nul
echo       Limpo!
echo.

:: Build Electron
echo [7/7] Empacotando aplicacao Electron...
echo       Isso pode levar varios minutos...
echo.

npx electron-builder --win --x64 --config electron-builder.json

if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Build com config falhou, tentando build padrao...
    npx electron-builder --win --x64
)

echo.
echo ══════════════════════════════════════════════════════════════
echo.

:: Verificar resultado
if exist "release\*.exe" (
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║              BUILD ELECTRON CONCLUIDO!                       ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo   Instalador gerado em: %cd%\release
    echo.
    dir /b release\*.exe 2>nul
    echo.
) else (
    echo [INFO] Verifique a pasta 'dist' para os arquivos gerados.
)

echo.
pause
