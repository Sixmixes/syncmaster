@echo off
echo Starting SyncMaster application compilation...
cd /d "%~dp0"
call npm run electron:build
echo.
echo ===================================================
echo Build complete! Check the release/win-unpacked folder.
echo ===================================================
pause
