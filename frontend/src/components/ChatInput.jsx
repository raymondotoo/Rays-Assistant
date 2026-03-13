import React, { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useChatStore } from '../store'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const { sendMessage, loading } = useChatStore()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    await sendMessage(input.trim())
    setInput('')
  }
  
  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the LLM ensemble..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
            loading || !input.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-secondary'
          }`}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </form>
  )
}
