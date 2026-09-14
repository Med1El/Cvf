@echo off
cd /d "%~dp0"

where npx >nul 2>nul
if %errorlevel%==0 (
  start "cvf server" cmd /c "npx --yes serve -l 5173 ."
) else (
  echo npx was not found on PATH. Install Node.js to run cvf.
  pause
  exit /b 1
)

timeout /t 2 >nul
start "" "http://localhost:5173"
