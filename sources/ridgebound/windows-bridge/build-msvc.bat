@echo off
setlocal
cd /d "%~dp0"
cl /nologo /EHsc /std:c++17 /O2 /W4 /utf-8 /MT bridge.cpp /Fe:ridgebound-wheel-bridge.exe /link dinput8.lib dxguid.lib ws2_32.lib ole32.lib shell32.lib user32.lib
