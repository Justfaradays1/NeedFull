@echo off
cd /d "C:\Users\user\Desktop\NeedFull\needfull-frontend"
echo [%date% %time%] Starting NeedFull dev...
npx.cmd next dev --webpack -p 3000
echo [%date% %time%] Server exited with code %errorlevel%
pause
