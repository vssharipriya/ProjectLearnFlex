@echo off
cd /d "%~dp0"
node -e "const v=process.versions.node.split('.').map(Number);if(v[0]<22||(v[0]===22&&v[1]<5)){console.error('Install Node.js 22.5 or later (built-in SQLite is used).');process.exit(1)}"
if errorlevel 1 (
  echo Node.js 22.5 or later is required.
  pause
  exit /b 1
)
echo Starting LearnFlex...
npm start
pause
