<template>
  <div class="ai-qa-container">
    <div class="qa-card">
      <header class="card-header">
        <h1 class="title">🤖 AI 问答小组件</h1>
        <p class="subtitle">基于阿里云通义千问的智能问答系统</p>
      </header>

      <div class="card-body">
        <!-- 问题输入区域 -->
        <div class="question-section">
          <label for="question" class="input-label">你的问题：</label>
          <textarea
            id="question"
            v-model="question"
            placeholder="请输入你想要询问的问题，比如：什么是人工智能？"
            class="question-input"
            rows="4"
            :disabled="loading"
            @keydown.ctrl.enter="handleAsk"
          ></textarea>
          <div class="input-tip">💡 提示：按 Ctrl+Enter 快速提问</div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <button
            @click="handleAsk"
            :disabled="loading || !question.trim()"
            class="ask-button"
            :class="{ loading: loading }"
          >
            <span v-if="loading" class="loading-icon">⏳</span>
            <span v-else class="button-icon">🚀</span>
            {{ loading ? '正在思考中...' : '开始提问' }}
          </button>
          
          <button
            v-if="answer"
            @click="clearAll"
            class="clear-button"
            :disabled="loading"
          >
            🗑️ 清空
          </button>
        </div>

        <!-- 回答显示区域 -->
        <div v-if="answer || error" class="answer-section">
          <div v-if="error" class="error-message">
            <div class="error-title">❌ 出现错误</div>
            <div class="error-detail">{{ error }}</div>
            <button @click="error = ''" class="error-close">关闭</button>
          </div>
          
          <div v-if="answer" class="answer-card">
            <div class="answer-header">
              <span class="answer-label">🎯 AI 回答：</span>
              <button @click="copyAnswer" class="copy-button" title="复制回答">
                📋 {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
            <div class="answer-content">{{ answer }}</div>
          </div>
        </div>

        <!-- 状态指示器 -->
        <div class="status-bar">
          <div class="status-item">
            状态: <span :class="statusClass">{{ statusText }}</span>
          </div>
          <div class="status-item">
            字数: {{ question.length }}/1000
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

// 响应式数据
const question = ref('')
const answer = ref('')
const error = ref('')
const loading = ref(false)
const copied = ref(false)

// 计算属性
const statusClass = computed(() => {
  if (loading.value) return 'status-loading'
  if (error.value) return 'status-error'
  if (answer.value) return 'status-success'
  return 'status-ready'
})

const statusText = computed(() => {
  if (loading.value) return '思考中...'
  if (error.value) return '错误'
  if (answer.value) return '完成'
  return '就绪'
})

// 方法
const handleAsk = async () => {
  if (!question.value.trim()) {
    error.value = '请输入问题后再提问'
    return
  }

  if (question.value.length > 1000) {
    error.value = '问题长度不能超过1000字符'
    return
  }

  loading.value = true
  error.value = ''
  answer.value = ''

  try {
    console.log('发送问题:', question.value)
    
    const response = await axios.post('/api/ask', {
      question: question.value
    }, {
      timeout: 35000 // 35秒超时
    })

    if (response.data.success && response.data.answer) {
      answer.value = response.data.answer
      console.log('收到回答:', answer.value.substring(0, 50) + '...')
    } else {
      throw new Error('服务器返回了无效的响应')
    }
    
  } catch (err) {
    console.error('请求失败:', err)
    
    if (err.code === 'ECONNABORTED') {
      error.value = '请求超时，请稍后重试'
    } else if (err.response) {
      // 服务器返回了错误响应
      const errorData = err.response.data
      error.value = errorData.error || '服务器错误'
      if (errorData.detail) {
        error.value += `：${errorData.detail}`
      }
    } else if (err.request) {
      // 请求发出了但没有收到响应
      error.value = '无法连接到服务器，请检查后端服务是否启动'
    } else {
      // 其他错误
      error.value = err.message || '未知错误'
    }
  } finally {
    loading.value = false
  }
}

const clearAll = () => {
  question.value = ''
  answer.value = ''
  error.value = ''
  copied.value = false
}

const copyAnswer = async () => {
  if (!answer.value) return
  
  try {
    await navigator.clipboard.writeText(answer.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案：创建临时文本域
    const textArea = document.createElement('textarea')
    textArea.value = answer.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.ai-qa-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.qa-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px;
  text-align: center;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
}

.card-body {
  padding: 32px;
}

.question-section {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.question-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.question-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.question-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.input-tip {
  margin-top: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.ask-button {
  flex: 1;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ask-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.ask-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ask-button.loading {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.clear-button {
  padding: 16px 20px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover:not(:disabled) {
  background: #e5e7eb;
  color: #374151;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.answer-section {
  margin-bottom: 24px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 8px;
}

.error-detail {
  color: #991b1b;
  margin-bottom: 12px;
}

.error-close {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.answer-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #e2e8f0;
  border-bottom: 1px solid #cbd5e1;
}

.answer-label {
  font-weight: 600;
  color: #374151;
}

.copy-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.copy-button:hover {
  background: #5a67d8;
}

.answer-content {
  padding: 20px;
  color: #1f2937;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-ready { color: #10b981; }
.status-loading { color: #f59e0b; }
.status-success { color: #10b981; }
.status-error { color: #ef4444; }

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    padding: 24px 20px;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .card-body {
    padding: 24px 20px;
  }
  
  .action-section {
    flex-direction: column;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
