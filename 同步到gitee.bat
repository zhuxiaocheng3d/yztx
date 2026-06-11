@echo off
chcp 65001 >nul
:: 定位到当前脚本所在目录（也就是yztx网站根目录）
cd /d "%~dp0"

echo 正在同步 yztx 到 Gitee...
echo.

:: 拉取云端最新代码（避免冲突）
git pull gitee master
:: 添加所有本地文件
git add .
:: 提交变更（带时间戳）
git commit -m "自动同步: %date% %time% - yztx"
:: 只推送到Gitee
git push gitee master

echo.
echo ==============================================
echo yztx 已同步到 Gitee
echo Gitee会自动同步到GitHub，Cloudflare Pages稍后更新
echo ==============================================
pause