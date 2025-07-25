<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="gradient-circle gradient-circle-1"></div>
      <div class="gradient-circle gradient-circle-2"></div>
      <div class="gradient-circle gradient-circle-3"></div>
    </div>

    <!-- 主要布局 -->
    <div class="main-layout">
      <!-- 左侧栏 -->
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="logo-section">
            <div v-if="!sidebarCollapsed" class="logo">
              <img src="/avatars/Chino_small.png" alt="Logo" class="logo-image" />
            </div>
            <h1 v-if="!sidebarCollapsed" class="app-title">AI 问答助手</h1>
          </div>
          <button @click="toggleSidebar" class="sidebar-toggle">
            <span v-if="sidebarCollapsed">→</span>
            <span v-else>←</span>
          </button>
        </div>

        <div v-if="!sidebarCollapsed" class="sidebar-content">
          <!-- 新建对话按钮 -->
          <button @click="startNewConversation" class="new-chat-btn">
            ✨ 新建对话
          </button>

          <!-- 对话历史列表 -->
          <div class="conversation-list">
            <div class="conversation-list-header">
              <h3>对话历史</h3>
            </div>
            <div class="conversation-items">
              <div 
                v-for="(conv, index) in conversations" 
                :key="conv.id"
                @click="switchConversation(conv.id)"
                class="conversation-item"
                :class="{ active: currentConversationId === conv.id }"
              >
                <div class="conversation-title">{{ conv.title }}</div>
                <div class="conversation-time">{{ formatConversationTime(conv.updatedAt) }}</div>
                <button 
                  @click.stop="deleteConversation(conv.id)"
                  class="delete-conversation-btn"
                  title="删除对话"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div v-if="!sidebarCollapsed" class="sidebar-footer">
          <button @click="toggleTheme" class="theme-toggle" title="切换主题">
            <span v-if="isDark">🌙 深色模式</span>
            <span v-else>☀️ 浅色模式</span>
          </button>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 滚动容器 - 把滚动条放到右边缘 -->
        <div class="scroll-container" ref="scrollContainer">
          <!-- 问答界面 -->
          <div class="chat-container">
            <!-- 欢迎区域 -->
            <div v-if="!hasConversation" class="welcome-section">
              <div class="welcome-content">
                <div class="welcome-icon">✨</div>
                <h2 class="welcome-title">你好！我是 AI 助手</h2>
                <p class="welcome-subtitle">基于阿里云通义千问，为您提供智能问答服务</p>
                <div class="example-questions">
                  <div class="example-title">试试这些问题：</div>
                  <div class="example-list">
                    <button 
                      v-for="example in exampleQuestions" 
                      :key="example"
                      @click="setQuestion(example)"
                      class="example-button"
                    >
                      {{ example }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 对话历史 -->
            <div v-if="hasConversation" class="conversation-area">
              <div class="messages" ref="messagesContainer">
                <div v-for="(msg, index) in currentMessages" :key="index" class="message" :class="msg.type">
                  <div class="message-avatar">
                    <img 
                      v-if="msg.type === 'user'" 
                      src="/avatars/Chino.jpg"
                      alt="用户头像"
                      class="avatar-image"
                    />
                    <img 
                      v-else 
                      src="/avatars/1741874821056.jpeg"
                      alt="AI助手头像"
                      class="avatar-image"
                    />
                  </div>
                  <div class="message-content">
                    <div class="message-text">{{ msg.content }}</div>
                    <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                  </div>
                  <button 
                    v-if="msg.type === 'assistant' && msg.content"
                    @click="copyMessage(msg.content, index)"
                    class="copy-message-btn"
                    :title="copiedIndex === index ? '已复制' : '复制回答'"
                  >
                    <span v-if="copiedIndex === index">✅</span>
                    <span v-else>📋</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-if="error" class="error-toast">
              <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">{{ error }}</span>
                <button @click="error = ''" class="error-close">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 - 移到主内容区底部 -->
        <div class="input-section">
          <!-- 背景遮罩层 -->
          <div class="input-mask"></div>
          <div class="input-container">
            <div class="input-wrapper">
              <textarea
                v-model="question"
                :placeholder="loading ? '正在思考中...' : '输入你的问题，按 Enter 发送'"
                class="question-input"
                :disabled="loading"
                @keydown.enter.exact.prevent="handleAsk"
                @keydown.shift.enter.exact="() => {}"
                @input="onInput"
                rows="1"
                ref="inputRef"
              ></textarea>
              <button
                @click="handleAsk"
                :disabled="loading || !question.trim()"
                class="send-button"
                :class="{ loading: loading }"
              >
                <span v-if="loading" class="loading-spinner">⏳</span>
                <span v-else>🚀</span>
              </button>
            </div>
            <div class="input-footer">
              <div class="char-count" :class="{ warning: question.length > 800 }">
                {{ question.length }}/1000
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import axios from 'axios'

// 响应式数据
const question = ref('')
const error = ref('')
const loading = ref(false)
const copiedIndex = ref(-1)
const isDark = ref(false)
const inputRef = ref(null)
const messagesContainer = ref(null)
const scrollContainer = ref(null)
const sidebarCollapsed = ref(false)

// 对话管理
const conversations = ref([])
const currentConversationId = ref(null)

// 示例问题
const exampleQuestions = [
  '什么是人工智能？',
  '如何学习编程？',
  '介绍一下Vue.js框架',
  '人工智能的发展前景如何？'
]

// 计算属性
const currentMessages = computed(() => {
  const current = conversations.value.find(c => c.id === currentConversationId.value)
  return current ? current.messages : []
})

const hasConversation = computed(() => {
  // 如果没有当前对话ID，显示欢迎页面
  if (!currentConversationId.value) return false
  // 如果有对话ID但没有消息，也显示欢迎页面
  return currentMessages.value.length > 0
})

// 生成对话ID
const generateConversationId = () => {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 生成对话标题
const generateConversationTitle = (firstMessage) => {
  if (!firstMessage) return '新对话'
  const content = firstMessage.length > 20 ? firstMessage.substring(0, 20) + '...' : firstMessage
  return content
}

// 创建新对话 - 进入初始状态，不创建历史记录
const startNewConversation = () => {
  // 清空当前对话ID，进入欢迎页面状态
  currentConversationId.value = null
  error.value = ''
  
  // 清空输入框
  question.value = ''
}

// 切换对话
const switchConversation = (conversationId) => {
  currentConversationId.value = conversationId
  error.value = ''
  
  nextTick(() => {
    scrollToBottom()
  })
}

// 删除对话
const deleteConversation = (conversationId) => {
  const index = conversations.value.findIndex(c => c.id === conversationId)
  if (index !== -1) {
    conversations.value.splice(index, 1)
    
    // 如果删除的是当前对话
    if (currentConversationId.value === conversationId) {
      if (conversations.value.length > 0) {
        currentConversationId.value = conversations.value[0].id
      } else {
        // 如果没有对话了，回到欢迎页面
        currentConversationId.value = null
      }
    }
    
    saveConversations()
  }
}

// 更新对话
const updateCurrentConversation = (updates) => {
  const current = conversations.value.find(c => c.id === currentConversationId.value)
  if (current) {
    Object.assign(current, updates)
    current.updatedAt = new Date()
    saveConversations()
  }
}

// 保存对话到本地存储
const saveConversations = () => {
  try {
    localStorage.setItem('ai_conversations', JSON.stringify(conversations.value))
  } catch (err) {
    console.error('保存对话失败:', err)
  }
}

// 从本地存储加载对话
const loadConversations = () => {
  try {
    const saved = localStorage.getItem('ai_conversations')
    if (saved) {
      const parsed = JSON.parse(saved)
      conversations.value = parsed.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }))
      
      if (conversations.value.length > 0) {
        currentConversationId.value = conversations.value[0].id
      }
    }
  } catch (err) {
    console.error('加载对话失败:', err)
  }
}

// 主题管理
const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  
  // 确保dark类也应用到document.documentElement上，以便全局CSS变量生效
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 侧边栏切换
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value.toString())
  
  // 动态更新输入区域的位置
  nextTick(() => {
    updateInputSectionPosition()
  })
}

// 更新输入区域位置
const updateInputSectionPosition = () => {
  const inputSection = document.querySelector('.input-section')
  if (inputSection) {
    if (sidebarCollapsed.value) {
      inputSection.style.left = 'var(--sidebar-collapsed-width)'
    } else {
      inputSection.style.left = 'var(--sidebar-width)'
    }
  }
}

// 设置问题（来自示例问题）
const setQuestion = (text) => {
  question.value = text
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 格式化时间
const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now - time
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return time.toLocaleDateString() + ' ' + time.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 格式化对话时间
const formatConversationTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now - time
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return time.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 处理提问
const handleAsk = async () => {
  if (!question.value.trim()) {
    error.value = '请输入问题后再提问'
    return
  }

  if (question.value.length > 1000) {
    error.value = '问题长度不能超过1000字符'
    return
  }

  // 如果没有当前对话，创建新对话（这是用户第一次提问）
  if (!currentConversationId.value) {
    const newConversation = {
      id: generateConversationId(),
      title: generateConversationTitle(question.value),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id
  }

  // 添加用户消息
  const userMessage = {
    type: 'user',
    content: question.value.trim(),
    timestamp: Date.now()
  }
  
  // 添加消息到当前对话
  const current = conversations.value.find(c => c.id === currentConversationId.value)
  if (current) {
    current.messages.push(userMessage)
    
    // 如果是第一条消息，更新对话标题
    if (current.messages.length === 1) {
      current.title = generateConversationTitle(question.value)
    }
  }

  const currentQuestion = question.value.trim()
  question.value = ''
  loading.value = true
  error.value = ''

  // 添加占位的AI消息
  const aiMessage = {
    type: 'assistant',
    content: '',
    timestamp: Date.now(),
    loading: true
  }
  
  if (current) {
    current.messages.push(aiMessage)
  }

  try {
    console.log('发送问题:', currentQuestion)
    
    const response = await axios.post('/api/ask', {
      question: currentQuestion
    }, {
      timeout: 35000 // 35秒超时
    })

    if (response.data.success && response.data.answer) {
      // 更新AI消息
      if (current && current.messages.length > 0) {
        const lastMessage = current.messages[current.messages.length - 1]
        lastMessage.content = response.data.answer
        lastMessage.loading = false
      }
      
      // 保存对话到本地存储
      updateCurrentConversation({})
      saveConversations()
      console.log('收到回答:', response.data.answer.substring(0, 50) + '...')
    } else {
      throw new Error('服务器返回了无效的响应')
    }
    
  } catch (err) {
    console.error('请求失败:', err)
    
    // 移除占位消息
    if (current && current.messages.length > 0) {
      current.messages.pop()
    }
    
    if (err.code === 'ECONNABORTED') {
      error.value = '请求超时，请稍后重试'
    } else if (err.response) {
      const errorData = err.response.data
      error.value = errorData.error || '服务器错误'
      if (errorData.detail) {
        error.value += `：${errorData.detail}`
      }
    } else if (err.request) {
      error.value = '无法连接到服务器，请检查后端服务是否启动'
    } else {
      error.value = err.message || '未知错误'
    }
  } finally {
    loading.value = false
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}

// 复制消息
const copyMessage = async (content, index) => {
  if (!content) return
  
  try {
    await navigator.clipboard.writeText(content)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = -1
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = content
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = -1
    }, 2000)
  }
}

// 自动调整输入框高度
const autoResize = () => {
  const textarea = inputRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
}

// 监听输入变化
const onInput = () => {
  autoResize()
}

// 初始化
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // 检测系统主题偏好
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 确保初始化时也设置document.documentElement的dark类
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  const savedSidebarState = localStorage.getItem('sidebar_collapsed')
  if (savedSidebarState) {
    sidebarCollapsed.value = savedSidebarState === 'true'
  }

  loadConversations()
  
  // 如果没有任何对话历史，默认显示欢迎页面（currentConversationId 为 null）
  if (conversations.value.length === 0) {
    currentConversationId.value = null
  } else {
    // 如果有对话历史，默认选中第一个
    currentConversationId.value = conversations.value[0].id
  }
  
  // 初始化输入区域位置
  nextTick(() => {
    updateInputSectionPosition()
  })
})
</script>

<style>
/* 全局变量 - 浅色主题 */
:root {
  --bg-primary: #f8fafb;
  --bg-secondary: #e8f2f8;
  --bg-tertiary: #d6e9f5;
  --message-bg: #f0f6fa;
  --text-primary: #2c3e50;
  --text-secondary: #5a6c7d;
  --text-tertiary: #8897a8;
  --border-primary: #d1e3ed;
  --border-secondary: #b8d4e3;
  --accent-primary: #4a90e2;
  --accent-secondary: #7bb3f0;
  --accent-gradient: linear-gradient(135deg, #4a90e2 0%, #7bb3f0 100%);
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 60px;
}

/* 深色主题变量 */
.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --message-bg: #475569;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --border-primary: #334155;
  --border-secondary: #475569;
  --accent-primary: #60a5fa;
  --accent-secondary: #22d3ee;
  --accent-gradient: linear-gradient(135deg, #60a5fa 0%, #22d3ee 100%);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3);
}

/* 基础样式 - 重置全局，去掉任何多余的滚动 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  /* 固定到视口，禁止页面滚动 */
  height: 100%;
  width: 100%;
  overflow: hidden; 
  overscroll-behavior: none; /* 禁止所有方向的过度滚动链 */
  background: var(--bg-primary);
  transition: background-color 0.3s ease;
}

.app-container {
  /* Vue SPA根节点固定 */
  position: fixed;
  top: 0; 
  right: 0; 
  bottom: 0; 
  left: 0;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

/* 背景装饰 */
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.gradient-circle {
  position: absolute;
  border-radius: 50%;
  background: var(--accent-gradient);
  opacity: 0.1;
  animation: float 20s ease-in-out infinite;
}

.gradient-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.gradient-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: -7s;
}

.gradient-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

/* 主布局 */
.main-layout {
  display: flex;
  height: 100%;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-width);
  background: linear-gradient(180deg, #e8f2f8 0%, #d6e9f5 100%);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 100;
  backdrop-filter: blur(20px);
  box-shadow: 2px 0 12px rgba(74, 144, 226, 0.1);
  overflow: hidden;
}

/* 深色模式下的侧边栏 */
.dark .sidebar {
  background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  background: transparent;
  border-right: none;
  box-shadow: none;
}

.sidebar.collapsed .sidebar-header {
  background: transparent;
  border-bottom: none;
  justify-content: center;
}

.sidebar.collapsed .sidebar-toggle {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.dark .logo {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.sidebar.collapsed .app-title {
  opacity: 0;
  width: 0;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background: var(--bg-primary);
  transform: scale(1.05);
}

.sidebar-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.new-chat-btn {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #5ba0f2 0%, #4a90e2 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, #6bb0ff 0%, #5ba0f2 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

/* 深色模式下的新建对话按钮 */
.dark .new-chat-btn {
  background: var(--accent-gradient);
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
}

.dark .new-chat-btn:hover {
  background: linear-gradient(135deg, #7bb3f0 0%, #34d4ea 100%);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
}

.conversation-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conversation-list-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.conversation-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-item {
  padding: 12px;
  background: rgba(232, 242, 248, 0.6);
  border: 1px solid #b8d4e3;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  backdrop-filter: blur(10px);
}

.conversation-item:hover {
  background: rgba(232, 242, 248, 0.8);
  border-color: #4a90e2;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.15);
}

/* 深色模式下的对话项目 */
.dark .conversation-item {
  background: rgba(71, 85, 105, 0.6);
  border: 1px solid var(--border-primary);
}

.dark .conversation-item:hover {
  background: rgba(71, 85, 105, 0.8);
  border-color: var(--accent-primary);
}

.conversation-item.active {
  background: linear-gradient(135deg, #4a90e2 0%, #3b7dd6 100%);
  color: white;
  border-color: #4a90e2;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.conversation-item.active .conversation-time {
  color: rgba(255, 255, 255, 0.8);
}

.conversation-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conversation-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.delete-conversation-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: all 0.2s ease;
}

.conversation-item:hover .delete-conversation-btn {
  opacity: 1;
}

.delete-conversation-btn:hover {
  background: var(--error);
  color: white;
}

.conversation-item.active .delete-conversation-btn {
  color: rgba(255, 255, 255, 0.8);
}

.conversation-item.active .delete-conversation-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-primary);
}

.theme-toggle {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid #b8d4e3;
  background: linear-gradient(135deg, #f0f6fa 0%, #e8f2f8 100%);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  gap: 8px;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: linear-gradient(135deg, #e8f2f8 0%, #d6e9f5 100%);
  border-color: #4a90e2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
}

/* 深色模式下的主题切换按钮 */
.dark .theme-toggle {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
}

.dark .theme-toggle:hover {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

/* 深色模式下的主内容区 */
.dark .main-content {
  background: var(--bg-primary);
}

.sidebar.collapsed + .main-content {
  margin-left: var(--sidebar-collapsed-width);
}

/* 滚动容器 - 把滚动条放到右边缘 */
.scroll-container {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* 聊天容器 - 不再负责滚动，只负责布局 */
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  padding-bottom: 140px; /* 为输入区域留出空间 */
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  position: relative;
  z-index: 1;
  background: transparent;
  min-height: 100%;
}

/* 欢迎区域 */
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: calc(100vh - 200px);
  max-height: none;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  padding: 0 20px;
}

.welcome-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: var(--text-primary);
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.example-questions {
  margin-top: 24px;
}

.example-title {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.example-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.example-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #f0f6fa 0%, #e8f2f8 100%);
  border: 1px solid #d1e3ed;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.example-button:hover {
  background: linear-gradient(135deg, #e8f2f8 0%, #d6e9f5 100%);
  color: var(--text-primary);
  border-color: #4a90e2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
}

/* 深色模式下的示例按钮 */
.dark .example-button {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
}

.dark .example-button:hover {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: var(--text-primary);
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
}

/* 对话区域 */
.conversation-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: visible;
  min-height: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: visible;
  padding: 16px;
  background: transparent;
  border-radius: var(--radius-md);
  border: none;
  min-height: 0;
}

.message {
  display: flex;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
  margin-bottom: 4px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 4px;
  overflow: hidden;
  border: 2px solid var(--border-primary);
}

.message.user .message-avatar {
  background: #8ab7eb;
  border-color: #8ab7eb;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-text {
  background: rgba(240, 246, 250, 0.8);
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid rgba(209, 227, 237, 0.5);
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  max-width: 70%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  backdrop-filter: blur(10px);
}

.dark .message-text {
  background: rgba(71, 85, 105, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.message.user .message-text {
  background: #8ab7eb;
  color: white;
  border: none;
  border-radius: 18px 18px 4px 18px;
  margin-left: auto;
  box-shadow: 0 2px 8px rgba(138, 183, 235, 0.3);
}

/* AI消息气泡小尾巴 */
.message:not(.user) .message-text::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: -6px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-right-color: rgba(240, 246, 250, 0.8);
  border-bottom-color: rgba(240, 246, 250, 0.8);
  border-left: none;
  border-top: none;
}

.dark .message:not(.user) .message-text::before {
  border-right-color: rgba(71, 85, 105, 0.8);
  border-bottom-color: rgba(71, 85, 105, 0.8);
}

/* 用户消息气泡小尾巴 */
.message.user .message-text::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: -6px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-left-color: #8ab7eb;
  border-bottom-color: #8ab7eb;
  border-right: none;
  border-top: none;
}

.message-time {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 0 4px;
}

.copy-message-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(209, 227, 237, 0.5);
  background: rgba(232, 242, 248, 0.6);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.2s ease;
  align-self: flex-start;
  backdrop-filter: blur(10px);
}

.copy-message-btn:hover {
  opacity: 1;
  background: rgba(214, 233, 245, 0.8);
  transform: scale(1.05);
}

/* 深色模式下的复制按钮 */
.dark .copy-message-btn {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.5);
}

.dark .copy-message-btn:hover {
  background: rgba(51, 65, 85, 0.8);
}

/* 错误提示 */
.error-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
}

.error-content {
  background: var(--error);
  color: white;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-lg);
  min-width: 300px;
}

.error-icon {
  font-size: 16px;
}

.error-text {
  flex: 1;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 输入区域 */
.input-section {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width);
  right: 0;
  background: transparent;
  padding: 16px 24px;
  border-top: none;
  box-shadow: none;
  z-index: 10;
  transition: left 0.3s ease;
}

/* 背景遮罩层 */
.input-mask {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: -1;
}

/* 深色模式下的输入区域 */
.dark .input-section {
  background: transparent;
  border-top: none;
  box-shadow: none;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: #ffffff;
  border: 1px solid rgba(209, 227, 237, 0.6);
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.08);
  backdrop-filter: blur(20px);
}

/* 深色模式下的输入框 */
.dark .input-wrapper {
  background: #1e293b;
  border: 1px solid rgba(51, 65, 85, 0.6);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
}

.input-wrapper:focus-within {
  background: #ffffff;
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 2px 16px rgba(74, 144, 226, 0.2);
}

/* 深色模式下的聚焦状态 */
.dark .input-wrapper:focus-within {
  background: #1e293b;
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 2px 16px rgba(96, 165, 250, 0.3);
}

.question-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  font-family: inherit;
}

.question-input::placeholder {
  color: var(--text-tertiary);
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--accent-gradient);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 0 4px;
}

.char-count {
  color: var(--text-tertiary);
}

.char-count.warning {
  color: var(--warning);
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-30px) rotate(120deg); }
  66% { transform: translateY(30px) rotate(240deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 260px;
  }
  
  .main-content {
    margin-left: 260px;
  }
  
  .input-section {
    left: 260px;
  }
  
  .sidebar.collapsed + .main-content {
    margin-left: var(--sidebar-collapsed-width);
  }
  
  .sidebar.collapsed ~ * .input-section,
  .sidebar.collapsed + .main-content + .input-section {
    left: var(--sidebar-collapsed-width) !important;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .sidebar.collapsed + .main-content {
    margin-left: 0;
  }
  
  .chat-container {
    padding: 16px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .welcome-subtitle {
    font-size: 16px;
  }
  
  .example-list {
    flex-direction: column;
    align-items: center;
  }
  
  .example-button {
    width: 100%;
    max-width: 300px;
  }
  
  .messages {
    max-height: 50vh;
    padding: 12px;
  }
  
  .message {
    gap: 8px;
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  
  .avatar-image {
    width: 28px;
    height: 28px;
  }
  
  .input-footer {
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .gradient-circle-1,
  .gradient-circle-2,
  .gradient-circle-3 {
    display: none;
  }
  
  .welcome-icon {
    font-size: 36px;
  }
  
  .error-content {
    min-width: 280px;
    margin: 0 16px;
  }
}

/* 滚动条样式 */
.scroll-container::-webkit-scrollbar,
.sidebar-content::-webkit-scrollbar {
  width: 8px;
}

.scroll-container::-webkit-scrollbar-track,
.sidebar-content::-webkit-scrollbar-track {
  background: rgba(74, 144, 226, 0.1);
  border-radius: 4px;
  margin: 4px;
}

.scroll-container::-webkit-scrollbar-thumb,
.sidebar-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4a90e2 0%, #7bb3f0 100%);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.scroll-container::-webkit-scrollbar-thumb:hover,
.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #3b7dd6 0%, #6bb0ff 100%);
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3);
}

/* 深色模式下的滚动条 */
.dark .scroll-container::-webkit-scrollbar-track,
.dark .sidebar-content::-webkit-scrollbar-track {
  background: rgba(51, 65, 85, 0.5);
}

.dark .scroll-container::-webkit-scrollbar-thumb,
.dark .sidebar-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa 0%, #22d3ee 100%);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.dark .scroll-container::-webkit-scrollbar-thumb:hover,
.dark .sidebar-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #7bb3f0 0%, #34d4ea 100%);
  box-shadow: 0 2px 4px rgba(96, 165, 250, 0.3);
}
</style>
