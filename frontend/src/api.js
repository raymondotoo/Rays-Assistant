// Download a model via backend (Ollama)
export const downloadModel = async (modelName) => {
  try {
    const response = await axios.post(`${API_BASE}/models/download`, { model: modelName })
    return response.data
  } catch (error) {
    console.error('Failed to download model:', error)
    throw error
  }
}
import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

export const submitFeedback = async (messageId, modelName, rating, comment) => {
  try {
    const response = await axios.post(`${API_BASE}/chat/feedback`, {
      message_id: messageId,
      model_name: modelName,
      rating: rating,
      comment: comment
    })
    return response.data
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    throw error
  }
}

export const getConversation = async (conversationId) => {
  try {
    const response = await axios.get(`${API_BASE}/chat/conversations/${conversationId}`)
    return response.data
  } catch (error) {
    console.error('Failed to get conversation:', error)
    throw error
  }
}
