@echo off
TITLE Server LMS PSE
cd /d "%~dp0"
echo ==========================================
echo    MEMULAI SERVER LMS PSE (PRODUKSI)
echo ==========================================
echo Pastikan terminal ini tetap terbuka selama website digunakan.
echo Website berjalan di: http://localhost:3000
echo ------------------------------------------
npm.cmd run start
pause
