import React, { useEffect, useRef, useState } from 'react'
import { Send, Loader } from 'lucide-react'

export default function CodeChat({ 
  messages, 
  isLoading, 
  onSubmit, 
  issueInput, 
  onIssueChange,
  onApplyUpdate 
}) {
  const messagesEndRef = useRef(null)
  const [displayedMessages, setDisplayedMessages] = useState([])

  // Typing animation effect
  useEffect(() => {
    if (messages.length === 0) {
      setDisplayedMessages([])
      return
    }

    const lastMessage = messages[messages.length - 1]
    
    if (displayedMessages.length < messages.length) {
      // New message, start typing animation
      const newMsg = { ...lastMessage, displayedContent: '' }
      setDisplayedMessages([...displayedMessages.slice(0, -1), newMsg])
      
      // Type out the content character by character
      let charIndex = 0
      const content = lastMessage.content
      const typingInterval = setInterval(() => {
        if (charIndex <= content.length) {
          setDisplayedMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              displayedContent: content.substring(0, charIndex)
            }
            return updated
          })
          charIndex++
        } else {
          clearInterval(typingInterval)
        }
      }, 15) // Speed of typing animation
      
      return () => clearInterval(typingInterval)
    } else if (displayedMessages.length === messages.length) {
      // Update existing messages to show full content
      setDisplayedMessages(messages.map(msg => ({
        ...msg,
        displayedContent: msg.content
      })))
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayedMessages, isLoading])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      onSubmit()
    }
  }

  const renderMessage = (msg) => {
    const content = msg.displayedContent !== undefined ? msg.displayedContent : msg.content
    const isTyping = msg.displayedContent !== undefined && msg.displayedContent !== msg.content
    
    return (
      <div
        className={`max-w-xs px-3 py-2 rounded-lg text-sm animate-slideIn ${
          msg.role === 'user'
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isTyping && <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse"></span>}
        <span className="text-xs opacity-70 mt-1 block">
          {msg.timestamp}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayedMessages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Describe your code issue or problem...</p>
          </div>
        ) : (
          displayedMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {renderMessage(msg)}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start animate-slideIn">
            <div className="bg-gradient-to-r from-purple-200 to-purple-300 text-purple-900 px-3 py-2 rounded-lg text-sm rounded-bl-none flex items-center gap-2 shadow-sm">
              <Loader size={16} className="animate-spin" />
              <span className="font-medium">Analyzing code...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2">
          <textarea
            value={issueInput}
            onChange={(e) => onIssueChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your code issue... (Shift+Enter for new line)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={onSubmit}
            disabled={isLoading || !issueInput.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white p-2 rounded-lg transition flex items-center justify-center"
            title="Send message (Ctrl+Enter)"
          >
            {isLoading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
