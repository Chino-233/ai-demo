# AI 问答小组件

一个基于 Vue 3 + Express + 通义千问 API 的智能问答系统，用户可以输入问题，获得 AI 回答。

## 🎯 功能特性

- ✨ **简洁美观的界面**：现代化的 UI 设计，支持响应式布局
- 🤖 **智能问答**：基于阿里云通义千问 qwen-turbo 模型
- 🔄 **上下文联系**：支持多轮对话，AI能理解对话历史并给出相关回答
- ⚡ **实时交互**：快速响应，流畅的用户体验
- 💬 **对话管理**：支持多个对话会话，可以创建、切换和删除对话
- 🛡️ **错误处理**：完善的错误提示和异常处理
- 📋 **便捷操作**：支持快捷键提问、一键复制回答
- 🔒 **安全配置**：API Key 和各种参数通过环境变量管理
- ⚙️ **灵活配置**：支持自定义模型参数、系统提示词等

## 🏗️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 快速的前端构建工具
- **Axios** - HTTP 客户端库

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 应用框架
- **通义千问 API** - 阿里云大语言模型服务

## 📦 项目结构

```
ai-qa-demo/
├── backend/                 # 后端服务
│   ├── index.js            # 服务器主文件
│   ├── package.json        # 后端依赖配置
│   ├── .env.example        # 环境变量示例
│   └── .gitignore         # Git 忽略文件
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── App.vue        # 主组件
│   │   └── main.js        # 入口文件
│   ├── index.html         # HTML 模板
│   ├── package.json       # 前端依赖配置
│   ├── vite.config.js     # Vite 配置
│   └── .gitignore        # Git 忽略文件
└── README.md              # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 通义千问 API Key（阿里云 DashScope）

### 🔑 获取通义千问 API Key

1. 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/)
2. 注册/登录阿里云账号
3. 开通 DashScope 服务（有免费额度）
4. 在 API-KEY 管理页面创建新的 API Key
5. 复制生成的 API Key（格式如：sk-xxxxxxxxxxxxxx）

> 💡 **提示**：
> - 新用户通常有免费的调用额度
> - 通义千问 API 比 OpenAI 更容易获取
> - 支持中文问答，响应速度快

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-qa-demo
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```bash
cd backend
copy .env.example .env
```

编辑 `.env` 文件，配置你的通义千问 API Key 和其他参数：

```env
# 通义千问API配置
QWEN_API_KEY=sk-your-qwen-api-key-here
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
QWEN_MODEL=qwen-turbo

# API参数配置
MAX_TOKENS=1000
TEMPERATURE=0.7
TOP_P=0.8
API_TIMEOUT=30000

# 对话配置
MAX_HISTORY_MESSAGES=10
SYSTEM_PROMPT=你是一个有用的AI助手，请用简洁明了的中文回答用户的问题。你能够根据之前的对话内容来理解上下文，提供连贯和相关的回答。

# 服务器配置
PORT=3001
NODE_ENV=development
```

#### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `QWEN_API_KEY` | 通义千问 API 密钥 | 必填 |
| `QWEN_API_URL` | API 接口地址 | dashscope 官方地址 |
| `QWEN_MODEL` | 使用的模型名称 | qwen-turbo |
| `MAX_TOKENS` | 最大生成token数 | 1000 |
| `TEMPERATURE` | 生成温度(0-1) | 0.7 |
| `TOP_P` | 核采样参数(0-1) | 0.8 |
| `API_TIMEOUT` | API请求超时时间(ms) | 30000 |
| `MAX_HISTORY_MESSAGES` | 最大历史消息数量 | 10 |
| `SYSTEM_PROMPT` | 系统提示词 | 默认中文助手提示 |
| `PORT` | 服务器端口 | 3001 |

> ⚠️ **重要提醒**：
> - 请前往 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/) 申请 API Key
> - 确保账户有足够的余额或免费额度
> - 提交代码时请删除真实的 API Key

### 4. 启动服务

**启动后端服务**（在 backend 目录）：
```bash
npm start
# 或者使用开发模式（需要安装 nodemon）
npm run dev
```

**启动前端服务**（在 frontend 目录）：
```bash
npm run dev
```

### 5. 访问应用

打开浏览器访问：http://localhost:5173

后端 API 地址：http://localhost:3001

## 📖 使用说明

### 基本使用
1. **新建对话**：点击"✨ 新建对话"按钮开始新的对话
2. **输入问题**：在文本框中输入你想要询问的问题
3. **提交询问**：点击"开始提问"按钮或使用快捷键 `Ctrl+Enter`
4. **查看回答**：等待 AI 处理并显示回答
5. **复制回答**：点击"复制"按钮将回答复制到剪贴板

### 对话管理
- **切换对话**：在左侧栏点击不同的对话记录进行切换
- **删除对话**：点击对话右侧的删除按钮
- **对话历史**：所有对话会自动保存到本地存储

### 上下文功能
- **智能联系**：AI 能够理解之前的对话内容，给出相关回答
- **历史限制**：默认保留最近 10 条消息作为上下文（可通过环境变量调整）
- **连续对话**：在同一对话中，AI 会记住之前讨论的内容

#### 上下文示例
```
用户: 什么是 Vue.js？
AI: Vue.js 是一个渐进式的 JavaScript 框架...

用户: 它和 React 有什么区别？
AI: [基于前面 Vue.js 的讨论] Vue.js 和 React 的主要区别包括...
```

## 🎮 快捷键

- `Ctrl + Enter`：快速提问

## 🔧 API 接口

### POST /api/ask
提交问题并获取 AI 回答（支持上下文）

**请求体：**
```json
{
  "question": "你的问题",
  "messages": [
    {
      "type": "user",
      "content": "之前的用户消息",
      "timestamp": 1640995200000
    },
    {
      "type": "assistant", 
      "content": "之前的AI回答",
      "timestamp": 1640995260000
    }
  ]
}
```

**响应：**
```json
{
  "answer": "AI的回答",
  "success": true
}
```

> 💡 **说明**：后端调用通义千问 qwen-turbo 模型，支持中文对话，响应速度快。

### GET /api/health
健康检查接口

**响应：**
```json
{
  "status": "ok",
  "message": "AI问答服务运行正常"
}
```

## 🛠️ 开发说明

### 后端开发

- 服务器使用 Express 框架
- 支持 CORS 跨域请求
- 完善的错误处理机制
- 请求超时控制（30秒）

### 前端开发

- 使用 Vue 3 Composition API
- 响应式设计，支持移动端
- 完善的加载状态和错误提示
- 代理配置，避免跨域问题

### 构建部署

```bash
# 构建前端
cd frontend
npm run build

# 生产环境启动后端
cd backend
NODE_ENV=production npm start
```

## ⚙️ 配置优化

### 性能优化建议

1. **调整历史消息数量**
   ```env
   MAX_HISTORY_MESSAGES=5  # 减少到5条以降低token消耗
   ```

2. **优化API参数**
   ```env
   TEMPERATURE=0.3   # 降低随机性，获得更一致的回答
   MAX_TOKENS=500    # 减少生成长度以节省成本
   ```

3. **自定义系统提示词**
   ```env
   SYSTEM_PROMPT=你是一个专业的技术助手，专门回答编程相关的问题。请简洁明了地回答用户的技术问题。
   ```

### 模型选择

根据需求选择不同的通义千问模型：

| 模型 | 适用场景 | 特点 |
|------|----------|------|
| `qwen-turbo` | 日常对话 | 速度快，成本低 |
| `qwen-plus` | 复杂任务 | 质量高，功能强 |
| `qwen-max` | 专业场景 | 最高质量，最高成本 |

### 安全建议

1. **保护API Key**
   - 不要将 `.env` 文件提交到版本控制
   - 定期轮换 API Key
   - 使用最小权限原则

2. **访问控制**
   - 在生产环境中配置适当的CORS策略
   - 添加请求频率限制
   - 考虑添加用户认证

## 🔍 故障排除

### 常见问题

1. **API Key 无效**
   - 检查 `.env` 文件中的 QWEN_API_KEY 是否正确
   - 确认阿里云 DashScope 账户余额充足

2. **无法连接到服务器**
   - 确认后端服务已启动（端口 3001）
   - 检查防火墙设置

3. **请求超时**
   - 检查网络连接
   - 尝试使用更简短的问题

4. **依赖安装失败**
   - 清除缓存：`npm cache clean --force`
   - 删除 `node_modules` 重新安装

### 日志查看

后端服务会在控制台输出详细的请求和错误日志，便于调试。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题请联系开发者。

---

⭐ 如果这个项目对你有帮助，请给一个 Star！
