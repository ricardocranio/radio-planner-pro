@echo off
chcp 65001 >nul
title PGM-FM - Compilador do Agente
color 0A

echo ╔══════════════════════════════════════════════════════════════╗
echo ║           PGM-FM RADIO MONITOR - BUILD SCRIPT                ║
echo ║                    Windows x64                               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [1/6] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale em: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Versao: %%i
echo.

:: Verificar npm
echo [2/6] Verificando npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo       Versao: %%i
echo.

:: Limpar cache e node_modules antigos
echo [3/6] Limpando cache...
if exist "node_modules" (
    echo       Removendo node_modules antigo...
    rmdir /s /q node_modules 2>nul
)
if exist "dist" (
    echo       Removendo dist antigo...
    rmdir /s /q dist 2>nul
)
npm cache clean --force >nul 2>&1
echo       Cache limpo!
echo.

:: Instalar dependências
echo [4/6] Instalando dependencias...
echo       Isso pode levar alguns minutos...
npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo       Dependencias instaladas!
echo.

:: Build do projeto
echo [5/6] Compilando projeto...
npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao!
    pause
    exit /b 1
)
echo       Projeto compilado!
echo.

:: Verificar resultado
echo [6/6] Verificando build...
if exist "dist\index.html" (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║                    BUILD CONCLUIDO!                          ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo   Arquivos gerados em: %cd%\dist
    echo.
    echo   Para testar localmente:
    echo     npx serve dist
    echo.
    echo   Para deploy:
    echo     - Publique a pasta 'dist' em qualquer servidor web
    echo     - Ou use: npx surge dist
    echo.
) else (
    echo [ERRO] Arquivo index.html nao encontrado na pasta dist!
    pause
    exit /b 1
)

echo Pressione qualquer tecla para sair...
pause >nul
