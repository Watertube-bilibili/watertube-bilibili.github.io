@echo off
setlocal
cd /d "%~dp0"
"%~dp0ridgebound-wheel-bridge.exe" --web-root "%~dp0web"
if errorlevel 1 pause
