@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "http://localhost:4321"
node blog.js dev
pause
