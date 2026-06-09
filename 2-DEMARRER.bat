@echo off
chcp 65001 >nul
title Ma Boutique - Serveur
color 0B
echo.
echo  ============================================
echo    DEMARRAGE DE VOTRE BOUTIQUE
echo  ============================================
echo.

REM Verifier que Node.js est installe
where node >nul 2>nul
if errorlevel 1 (
  color 0C
  echo  [X] Node.js n'est pas installe.
  echo  Lancez d'abord le fichier "1-INSTALLER.bat".
  echo.
  pause
  exit /b
)

REM Verifier que l'installation a ete faite
if not exist "node_modules" (
  color 0E
  echo  [!] La boutique n'a pas encore ete installee.
  echo  Lancez d'abord le fichier "1-INSTALLER.bat".
  echo.
  pause
  exit /b
)

echo  Votre boutique demarre...
echo.
echo  >>> La boutique va s'ouvrir dans votre navigateur. <<<
echo.
echo  IMPORTANT : Laissez CETTE fenetre noire OUVERTE
echo  tant que vous utilisez la boutique.
echo  Pour ARRETER la boutique : fermez cette fenetre.
echo.

REM Ouvrir le navigateur apres un court delai
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"

REM Demarrer le serveur
node server.js

pause
