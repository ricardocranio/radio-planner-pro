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
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale em: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Versao: %%i

:: AVISO sobre Node.js 25
for /f "tokens=1 delims=." %%v in ('node -v') do set NODE_MAJOR=%%v
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% geq 23 (
    echo.
    echo [AVISO] Node.js v%NODE_MAJOR% e muito recente!
    echo         Recomendado: Node.js 20 LTS
    echo         Download: https://nodejs.org/en/download/
    echo.
)
echo.

:: Verificar npm
echo [2/7] Verificando npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo       Versao npm: %%i
echo.

:: Verificar se node_modules existe
echo [3/7] Verificando dependencias do projeto...
if not exist "node_modules" (
    echo       Instalando dependencias do projeto...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)
echo       Dependencias OK!
echo.

:: Instalar Electron e electron-builder
echo [4/7] Instalando Electron e electron-builder...
echo.
call npm install --save-dev electron@latest electron-builder@latest
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao instalar Electron!
    echo       Tente manualmente: npm install --save-dev electron electron-builder
    pause
    exit /b 1
)
echo.
echo       Electron instalado!
echo.

:: Criar estrutura Electron se nao existir
echo [5/7] Criando estrutura Electron...
if not exist "electron" mkdir electron

:: Criar main.js
echo       Criando electron/main.js...
(
echo const { app, BrowserWindow } = require('electron'^);
echo const path = require('path'^);
echo.
echo function createWindow(^) {
echo   const win = new BrowserWindow({
echo     width: 1400,
echo     height: 900,
echo     icon: path.join(__dirname, '../public/icon-512.png'^),
echo     webPreferences: {
echo       nodeIntegration: false,
echo       contextIsolation: true,
echo       preload: path.join(__dirname, 'preload.js'^)
echo     },
echo     autoHideMenuBar: true
echo   }^);
echo.
echo   if (app.isPackaged^) {
echo     win.loadFile(path.join(__dirname, '../dist/index.html'^)^);
echo   } else {
echo     win.loadURL('http://localhost:8080'^);
echo   }
echo }
echo.
echo app.whenReady(^).then(createWindow^);
echo.
echo app.on('window-all-closed', (^) =^> {
echo   if (process.platform !== 'darwin'^) app.quit(^);
echo }^);
) > electron\main.js

:: Criar preload.js
echo       Criando electron/preload.js...
(
echo const { contextBridge } = require('electron'^);
echo contextBridge.exposeInMainWorld('electronAPI', {
echo   platform: process.platform,
echo   version: process.versions.electron
echo }^);
) > electron\preload.js

echo       Estrutura Electron criada!
echo.

:: Build do frontend
echo [6/7] Compilando frontend (Vite)...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao do frontend!
    pause
    exit /b 1
)
echo.
echo       Frontend compilado!
echo.

:: Build Electron
echo [7/7] Empacotando aplicacao Electron...
echo       Isso pode levar varios minutos...
echo.

:: Limpar builds anteriores
if exist "release" rmdir /s /q release 2>nul

call npx electron-builder --win --x64 --config electron-builder.json
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Tentando build sem config...
    call npx electron-builder --win --x64 -c.extraMetadata.main=electron/main.js
)

echo.
echo ══════════════════════════════════════════════════════════════

:: Verificar resultado
if exist "release\*.exe" (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║              BUILD ELECTRON CONCLUIDO!                       ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo   Instalador gerado em: %cd%\release
    echo.
    for %%f in (release\*.exe) do echo   - %%~nxf
    echo.
) else (
    echo.
    echo [INFO] Verifique a pasta 'release' ou 'dist' para os arquivos.
)

echo.
pause
