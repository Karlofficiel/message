@echo off
echo ========================================
echo   Deploiement Messagerie Securisee
echo ========================================
echo.

REM Verifier si Node.js est installe
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js detecte: 
node --version
echo.

REM Verifier si npm est disponible
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: npm n'est pas disponible.
    pause
    exit /b 1
)

echo npm detecte:
npm --version
echo.

REM Installer les dependances
echo Installation des dependances...
npm install
if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des dependances.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation terminee avec succes!
echo ========================================
echo.
echo Pour demarrer l'application:
echo   1. Ouvrir un terminal dans ce dossier
echo   2. Executer: npm start
echo   3. Ouvrir http://localhost:3000
echo.
echo Pour arreter le serveur: Ctrl+C
echo.
pause 