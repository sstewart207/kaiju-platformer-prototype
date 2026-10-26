@echo off
cd /d "%~dp0"
if not exist "node_modules\vite" (
  echo Install the project dependencies with npm install first.
  pause
  exit /b 1
)
call npm run dev -- --open
