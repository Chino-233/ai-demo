# AI 问答小组件

一个基于 Vue 3 + Express + Node.js 的智能问答系统，用户可以输入问题，获得 AI 回答。

## 🏗️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 快速的前端构建工具
- **Axios** - HTTP 客户端库

### 后端
- **Node.js** - JavaScript 运行环境
- **Express** - Web 应用框架

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

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 通义千问 API Key（阿里云 DashScope）


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

编辑 `.env` 文件，配置通义千问 API Key 和其他参数


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



### 4. 启动服务
**Windows 用户请使用 CMD 运行以下命令。**  
**启动后端服务**（在 backend 目录下）：
```bash
npm start
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
1. **新建对话**：点击"新建对话"按钮开始新的对话
2. **输入问题**：在文本框中输入你想要询问的问题
3. **提交询问**：点击"提问"按钮或使用快捷键 `Enter`
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


### 模型选择

根据需求选择不同的通义千问模型：

| 模型 | 适用场景 | 特点 |
|------|----------|------|
| `qwen-turbo` | 日常对话 | 速度快，成本低 |
| `qwen-plus` | 复杂任务 | 质量高，功能强 |
| `qwen-max` | 专业场景 | 最高质量，最高成本 |

## 常见问题

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

## AI辅助部分
- 项目的基础框架搭建
- 前端页面的CSS样式设计