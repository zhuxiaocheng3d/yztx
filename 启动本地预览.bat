@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   艺展天下 - 本地预览 & 自动构建
echo ========================================
echo.

:: 1. 检查 Node.js 是否存在
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b
)

:: 2. 执行构建（生成最新首页、案例页、团队页、样式）
echo 🔨 正在构建网站 (node build.js) ...
node build.js
if %errorlevel% neq 0 (
    echo [错误] 构建失败，请检查 build.js 或目录结构
    pause
    exit /b
)

:: 3. 启动 HTTP 服务器
echo.
echo ✅ 构建完成！启动本地预览服务器...
echo 🌐 请打开浏览器访问：http://localhost:8000
echo 📁 根目录：%cd%
echo.
echo 💡 提示：修改案例图片/描述后，请重新运行本脚本以重新构建并刷新网站
echo 💡 关闭此窗口即可停止服务
echo.

:: 优先使用 Python 3 的 http.server
where py >nul 2>nul
if %errorlevel% equ 0 (
    py -3 -m http.server 8000
    exit /b
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    python -m http.server 8000
    exit /b
)

:: 如果都没有，尝试使用 npx（需要 npm）
where npx >nul 2>nul
if %errorlevel% equ 0 (
    npx http-server -p 8000
    exit /b
)

:: 最后的备胎提示
echo [错误] 未找到 Python 或 npx，请安装 Python 或 Node.js 的 http-server
pause