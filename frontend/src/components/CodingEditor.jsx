import React, { useState, useEffect } from 'react'
import { Copy, Check, Send, Sparkles } from 'lucide-react'
import CodeChat from './CodeChat'

export default function CodingEditor() {
  const [originalCode, setOriginalCode] = useState('// Paste your code here...\n')
  const [updatedCode, setUpdatedCode] = useState('// AI suggestions will appear here...\n')
  const [displayedUpdatedCode, setDisplayedUpdatedCode] = useState('')
  const [copiedSection, setCopiedSection] = useState(null)
  const [codeIssue, setCodeIssue] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showingNewCode, setShowingNewCode] = useState(false)

  // Animate code appearance
  useEffect(() => {
    if (!showingNewCode) {
      setDisplayedUpdatedCode('')
      return
    }

    let charIndex = 0
    const interval = setInterval(() => {
      if (charIndex <= updatedCode.length) {
        setDisplayedUpdatedCode(updatedCode.substring(0, charIndex))
        charIndex++
      } else {
        clearInterval(interval)
      }
    }, 8) // Speed of code reveal animation

    return () => clearInterval(interval)
  }, [updatedCode, showingNewCode])

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const handleSubmitIssue = async () => {
    if (!codeIssue.trim() || !originalCode.trim()) return

    const userMessage = {
      role: 'user',
      content: codeIssue,
      timestamp: new Date().toLocaleTimeString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCodeIssue('')
    setIsLoading(true)
    setShowingNewCode(false)

    try {
      const response = await fetch('http://localhost:8001/api/chat/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_code: originalCode,
          issue_description: codeIssue
        })
      })

      const data = await response.json()
      
      // Update the code sections based on response
      if (data.suggested_code) {
        setUpdatedCode(data.suggested_code)
        setShowingNewCode(true) // Trigger animation
      }

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: data.explanation || 'Code updated based on your issue.',
        timestamp: new Date().toLocaleTimeString()
      }

      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: '❌ Error processing code review. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyUpdate = () => {
    setOriginalCode(updatedCode)
    setShowingNewCode(false)
    setDisplayedUpdatedCode('')
    const message = {
      role: 'user',
      content: '✓ Applied the suggested code. Ready for next review.',
      timestamp: new Date().toLocaleTimeString()
    }
    setChatMessages(prev => [...prev, message])
  }

  const handleClearAll = () => {
    setOriginalCode('// Paste your code here...\n')
    setUpdatedCode('// AI suggestions will appear here...\n')
    setDisplayedUpdatedCode('')
    setChatMessages([])
    setShowingNewCode(false)
  }

  return (
    <div className="h-full flex gap-4 p-6 bg-gray-50">
      <style>{`
        @keyframes fadeInCode {
          from {
            opacity: 0;
            background-color: rgba(34, 197, 94, 0.1);
          }
          to {
            opacity: 1;
            background-color: transparent;
          }
        }
        .code-highlight {
          animation: fadeInCode 0.3s ease-out;
        }
      `}</style>

      {/* Left side - Code Editor and Chat */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Original Code Section */}
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">📝 My Code</h3>
            <button
              onClick={() => copyToClipboard(originalCode, 'original')}
              className="p-1 hover:bg-blue-700 rounded transition"
              title="Copy code"
            >
              {copiedSection === 'original' ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
          <textarea
            value={originalCode}
            onChange={(e) => setOriginalCode(e.target.value)}
            className="flex-1 p-4 font-mono text-sm bg-gray-50 resize-none focus:outline-none border-0 focus:ring-2 focus:ring-blue-300 transition"
            placeholder="Paste your code here..."
            spellCheck="false"
          />
        </div>

        {/* Chat Section */}
        <div className="h-64 bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-l-4 border-purple-500">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles size={18} />
              Code Assistance Chat
            </h3>
          </div>
          <CodeChat 
            messages={chatMessages} 
            isLoading={isLoading}
            onSubmit={handleSubmitIssue}
            issueInput={codeIssue}
            onIssueChange={setCodeIssue}
            onApplyUpdate={handleApplyUpdate}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApplyUpdate}
            disabled={!showingNewCode}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            ✓ Apply Updated Code
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Right side - Updated Code Display */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-r-4 border-green-500">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">✨ Updated Code</h3>
            {showingNewCode && isLoading && (
              <span className="animate-pulse text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                Loading...
              </span>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(displayedUpdatedCode || updatedCode, 'updated')}
            className="p-1 hover:bg-green-700 rounded transition"
            title="Copy code"
          >
            {copiedSection === 'updated' ? (
              <Check size={18} />
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>
        <div className="flex-1 p-4 font-mono text-sm bg-gray-50 overflow-auto whitespace-pre-wrap break-words">
          {showingNewCode ? (
            <div className="text-green-700">
              {displayedUpdatedCode}
              {displayedUpdatedCode !== updatedCode && (
                <span className="inline-block w-2 h-5 bg-green-700 ml-1 animate-pulse"></span>
              )}
            </div>
          ) : (
            <div className="text-gray-400">// AI suggestions will appear here...</div>
          )}
        </div>
      </div>
    </div>
  )
}
