@echo off
title Royal Heritage - Bridal & Jewellery POS Desktop
echo ====================================================================
echo Starting Royal Heritage Bridal & Jewellery POS Desktop Application
echo ====================================================================

cd /d "%~dp0"
echo Launching Node.js POS Server...
start "" node server.js

timeout /t 2 /nobreak >nul

echo Launching Windows Native Desktop Shell...
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1440,900
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1440,900
) else (
    start http://localhost:3000
)

echo App running at http://localhost:3000
