const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI问答服务运行正常' });
});

// AI问答接口
app.post('/api/ask', async (req, res) => {
  const { question, messages = [] } = req.body;
  
  // 参数验证
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ 
      error: '请提供有效的问题', 
      detail: '问题不能为空' 
    });
  }

  // 验证消息历史格式
  if (!Array.isArray(messages)) {
    return res.status(400).json({ 
      error: '消息历史格式错误', 
      detail: 'messages必须是数组格式' 
    });
  }

  // 检查API Key
  if (!process.env.QWEN_API_KEY) {
    return res.status(500).json({ 
      error: '服务配置错误', 
      detail: '请在.env文件中配置QWEN_API_KEY' 
    });
  }

  try {
    console.log(`收到问题: ${question}`);
    console.log(`对话历史条数: ${messages.length}`);
    
    // 构建消息历史，限制历史消息数量以避免超出token限制
    const maxHistoryMessages = parseInt(process.env.MAX_HISTORY_MESSAGES) || 10;
    const recentMessages = messages.slice(-maxHistoryMessages);
    
    // 构建发送给AI的消息数组
    const aiMessages = [
      {
        role: 'system',
        content: process.env.SYSTEM_PROMPT || '你是一个有用的AI助手，请用简洁明了的中文回答用户的问题。你能够根据之前的对话内容来理解上下文，提供连贯和相关的回答。'
      }
    ];
    
    // 添加历史消息
    recentMessages.forEach(msg => {
      if (msg.type === 'user') {
        aiMessages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.type === 'assistant') {
        aiMessages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });
    
    // 添加当前问题
    aiMessages.push({
      role: 'user',
      content: question
    });
    
    // 调用通义千问 API
    const response = await axios.post(
      process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: process.env.QWEN_MODEL || 'qwen-turbo',
        input: {
          messages: aiMessages
        },
        parameters: {
          max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
          top_p: parseFloat(process.env.TOP_P) || 0.8
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: parseInt(process.env.API_TIMEOUT) || 30000 // 可配置的超时时间
      }
    );

    const answer = response.data.output.text;
    console.log(`AI回答: ${answer.substring(0, 50)}...`);
    
    res.json({ 
      answer: answer,
      success: true 
    });
    
  } catch (error) {
    console.error('API调用失败:', error.message);
    
    // 处理不同类型的错误
    if (error.response) {
      // API返回了错误响应
      const status = error.response.status;
      const message = error.response.data?.error?.message || '未知错误';
      
      if (status === 401) {
        return res.status(500).json({ 
          error: 'API密钥无效', 
          detail: '请检查QWEN_API_KEY是否正确' 
        });
      } else if (status === 429) {
        return res.status(500).json({ 
          error: 'API调用频率过高', 
          detail: '请稍后再试' 
        });
      } else if (status === 400) {
        return res.status(500).json({ 
          error: '请求参数错误', 
          detail: message 
        });
      } else {
        return res.status(500).json({ 
          error: 'API调用失败', 
          detail: `${status}: ${message}` 
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      // 请求超时
      return res.status(500).json({ 
        error: '请求超时', 
        detail: '请稍后重试' 
      });
    } else {
      // 网络错误或其他错误
      return res.status(500).json({ 
        error: '网络错误', 
        detail: error.message 
      });
    }
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 后端服务启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`💡 请确保已在.env文件中配置QWEN_API_KEY`);
});
