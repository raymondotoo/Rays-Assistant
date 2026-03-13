import React, { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../store'
import FeedbackForm from './FeedbackForm'

export default function ChatMessages() {
  const { messages } = useChatStore()
  const [expandedFeedback, setExpandedFeedback] = useState(null)
  const [displayedMessages, setDisplayedMessages] = useState([])
  const messagesEndRef = useRef(null)

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
      }, 8) // Speed of typing animation (faster than chat)
      
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
  }, [displayedMessages])
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <style>{`
        @keyframes slideInChat {
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
          animation: slideInChat 0.3s ease-out;
        }
        @keyframes pulse-cursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .cursor-blink {
          animation: pulse-cursor 1s infinite;
        }
      `}</style>

      {displayedMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
            <p>Ask the LLM ensemble a question to get responses from multiple models</p>
          </div>
        </div>
      ) : (
        displayedMessages.map((msg, idx) => {
          const content = msg.displayedContent !== undefined ? msg.displayedContent : msg.content
          const isTyping = msg.displayedContent !== undefined && msg.displayedContent !== msg.content
          
          return (
            <div key={idx} className="space-y-2 animate-slideIn">
              <div
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md p-3 rounded-lg transition-all ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none shadow-md'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none shadow-sm hover:shadow-md'
                  }`}
                >
                  {msg.model && (
                    <p className="text-xs font-bold mb-1 opacity-70 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
                      {msg.model}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {content}
                    {isTyping && (
                      <span className="inline-block w-2 h-5 ml-0.5 cursor-blink bg-current"></span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Show feedback form for assistant messages */}
              {msg.role === 'assistant' && msg.model && msg.messageId && msg.conversationId && !isTyping && (
                <div className="flex justify-start pl-4 animate-slideIn">
                  {expandedFeedback === idx ? (
                    <FeedbackForm 
                      messageId={msg.messageId}
                      modelName={msg.model}
                      conversationId={msg.conversationId}
                      onSubmitSuccess={() => setExpandedFeedback(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setExpandedFeedback(idx)}
                      className="text-xs text-primary hover:text-secondary font-medium transition-colors"
                    >
                      ⭐ Rate this response
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
