@echo off
chcp 65001 >nul
title Installation de la boutique
color 0B
echo.
echo  ============================================
echo    INSTALLATION DE VOTRE BOUTIQUE
echo  ============================================
echo.
echo  Cette etape installe ce dont la boutique a besoin.
echo  A faire UNE SEULE FOIS. Patientez quelques minutes...
echo.

REM Verifier que Node.js est installe
where node >nul 2>nul
if errorlevel 1 (
  color 0C
  echo  [X] PROBLEME : Node.js n'est pas installe sur cet ordinateur.
  echo.
  echo  Veuillez d'abord installer Node.js :
  echo    1. Allez sur le site : https://nodejs.org
  echo    2. Cliquez sur le gros bouton vert "LTS"
  echo    3. Ouvrez le fichier telecharge et cliquez "Suivant" jusqu'au bout
  echo    4. Redemarrez l'ordinateur
  echo    5. Relancez ce fichier "1-INSTALLER.bat"
  echo.
  pause
  exit /b
)

echo  [OK] Node.js est bien installe. Installation en cours...
echo.
call npm install

if errorlevel 1 (
  color 0C
  echo.
  echo  [X] Une erreur s'est produite pendant l'installation.
  echo  Verifiez votre connexion internet et reessayez.
  echo.
  pause
  exit /b
)

color 0A
echo.
echo  ============================================
echo    [OK] INSTALLATION TERMINEE AVEC SUCCES !
echo  ============================================
echo.
echo  Vous pouvez maintenant fermer cette fenetre et
echo  double-cliquer sur le fichier "2-DEMARRER.bat"
echo  pour ouvrir votre boutique.
echo.
pause
