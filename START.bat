@echo off
echo Starting BI Application...
echo.

cd server
start "Backend Server" cmd /k "node index.js"
timeout /t 2 /nobreak >nul

cd ..\client
start "Frontend App" cmd /k "npm run dev"

echo.
echo ========================================
echo   BI Application Started!
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

taskkill /F /IM node.exe
echo All servers stopped.
