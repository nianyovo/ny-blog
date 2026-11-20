@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   [1/3] 正在打包公开静态站点（自动隔离私密内容）...
echo ==========================================
node blog.js build
if errorlevel 1 (
    echo.
    echo [错误] 静态站点打包失败，请检查报错信息。
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   [2/3] 正在整理并提交本地改动...
echo ==========================================
git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "sync blog"
    if errorlevel 1 (
        echo.
        echo [错误] Git 提交失败。
        pause
        exit /b 1
    )
) else (
    echo 没有检测到新的文件改动，跳过提交步骤。
)

echo.
echo ==========================================
echo   [3/3] 正在推送到 GitHub 触发自动部署...
echo ==========================================
git push
if errorlevel 1 (
    echo.
    echo [失败] 推送到 GitHub 失败，请检查网络或代理后再双击重试。
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   √ 同步成功！
echo   Cloudflare 正在后台自动更新，约 30~60 秒后生效：
echo   https://nianyou.xyz
echo ==========================================
pause
