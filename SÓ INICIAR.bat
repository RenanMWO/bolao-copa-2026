@echo off
title Bolao Copa 2026
color 0A

echo ============================================
echo   BOLAO COPA DO MUNDO 2026
echo   Iniciando servidor...
echo   Acesse: http://localhost:3000
echo ============================================
echo.

start http://localhost:3000

call npm run dev

pause
