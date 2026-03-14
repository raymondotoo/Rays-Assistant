import { create } from 'zustand'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

export const useChatStore = create((set, get) => ({
  conversationId: null,
  messages: [],
  models: [],
  selectedModels: ['mistral', 'neural-chat', 'openhermes'],
  loading: false,
  
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
  setSelectedModels: (models) => set({ selectedModels: models }),
  
  createConversation: async (title) => {
    try {
      const response = await axios.post(`${API_BASE}/chat/conversations`, {
        title: title || 'New Conversation'
      })
      set({ conversationId: response.data.id, messages: [] })
      return response.data
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  },
  
  sendMessage: async (message) => {
    const { conversationId, selectedModels } = get()
    set({ loading: true })
    
    try {
      const response = await axios.post(`${API_BASE}/chat/send`, {
        conversation_id: conversationId,
        message: message,
        models: selectedModels,
        use_ensemble: true
      })
      
      // Build messages with real IDs from response
      const newMessages = [
        { 
          role: 'user', 
          content: message,
          messageId: response.data.user_message_id,
          conversationId: response.data.conversation_id
        }
      ]
      
      // Add assistant responses with real message IDs from backend
      Object.entries(response.data.responses).forEach(([model, text]) => {
        const realMessageId = response.data.message_ids?.[model] || `${response.data.user_message_id}-${model}`
        newMessages.push({
          role: 'assistant',
          model: model,
          content: text,
          messageId: realMessageId,
          conversationId: response.data.conversation_id
        })
      })
      
      set(state => ({
        messages: [...state.messages, ...newMessages],
        conversationId: response.data.conversation_id
      }))
      
      return response.data
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      set({ loading: false })
    }
  },
}))

export const useMetricsStore = create((set) => ({
  metrics: [],
  availableModels: [],
  
  fetchMetrics: async () => {
    try {
      const response = await axios.get(`${API_BASE}/models/metrics`)
      set({ metrics: response.data })
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  },
  
  fetchAvailableModels: async () => {
    try {
      const response = await axios.get(`${API_BASE}/models/available`)
      set({ availableModels: response.data.models })
    } catch (error) {
      console.error('Failed to fetch models:', error)
    }
  }
}))
