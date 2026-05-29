@echo off
title Bolao Copa 2026 - Instalando...
color 0A

echo ============================================
echo   BOLAO COPA DO MUNDO 2026
echo ============================================
echo.
echo Instalando dependencias (aguarde 2-3 min)...
echo.

call npm install

echo.
echo ============================================
echo   Iniciando o servidor...
echo   Acesse: http://localhost:3000
echo ============================================
echo.

start http://localhost:3000

call npm run dev

pause
