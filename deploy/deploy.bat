@echo off
echo =====================================
echo    AI 问答小组件 - 快速启动脚本
echo =====================================
echo.

echo [1/4] 检查环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version

echo.
echo [2/4] 安装后端依赖...
cd backend
if not exist node_modules (
    echo 正在安装后端依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 后端依赖已存在
)

echo.
echo [3/4] 检查环境配置...
if not exist .env (
    echo ⚠️  未找到 .env 文件，正在创建...
    copy .env.example .env
    echo.
    echo ❗ 重要提醒：
    echo    请编辑 backend\.env 文件，填入你的通义千问 API Key
    echo    QWEN_API_KEY=sk-your-api-key-here
    echo.
    echo 📖 获取 API Key 步骤：
    echo    1. 访问 https://dashscope.console.aliyun.com/
    echo    2. 注册/登录阿里云账号
    echo    3. 开通 DashScope 服务（有免费额度）
    echo    4. 创建 API Key 并复制
    echo.
    echo ⏸️  请先配置 API Key，然后重新运行此脚本
    pause
    exit /b 0
)

echo ✅ 环境配置文件存在

echo.
echo [4/4] 安装前端依赖...
cd ..\frontend
if not exist node_modules (
    echo 正在安装前端依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 前端依赖已存在
)

echo.
echo =====================================
echo        ✅ 环境准备完成！
echo =====================================
echo.
echo [5/5] 启动服务...
echo.

echo 🚀 正在启动后端服务...
cd ..\backend
start /min powershell -WindowStyle Hidden -Command "npm start"

echo ⏰ 等待后端启动...
timeout /t 5 /nobreak >nul

echo 🚀 正在启动前端服务...
cd ..\frontend
start /min powershell -WindowStyle Hidden -Command "npm run dev"

echo.
echo =====================================
echo        🎉 服务启动中...
echo =====================================
echo.
echo ⏰ 正在等待服务完全启动（约15秒）...
echo.

REM 等待服务启动
for /l %%i in (1,1,3) do (
    echo 启动进度: %%i/3 秒
    timeout /t 1 /nobreak >nul
)

echo.
echo =====================================
echo        🎉 启动完成！
echo =====================================
echo.
echo ✅ 后端服务：http://localhost:3000
echo ✅ 前端服务：http://localhost:5173
echo.
echo 🌐 正在自动打开浏览器...
start http://localhost:5173

echo.
echo 💡 应用已在后台运行！
echo 📱 如需停止服务，请运行项目中的 stop.bat 文件
echo.
echo =====================================
echo 🎉 部署成功！应用已启动
echo =====================================
pause
