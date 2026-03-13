import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, MessageSquare, Star, Code } from 'lucide-react'
import ChatMessages from './components/ChatMessages'
import ChatInput from './components/ChatInput'
import ModelSelector from './components/ModelSelector'
import MetricsDashboard from './components/MetricsDashboard'
import CodingEditor from './components/CodingEditor'
import LearningDashboard from './components/LearningDashboard'
import { useChatStore } from './store'
import { useMetricsStore } from './store'
import './index.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const { createConversation } = useChatStore()
  const { metrics, fetchMetrics } = useMetricsStore()
  
  useEffect(() => {
    createConversation('Chat Session')
    fetchMetrics()
    // Refresh metrics every 5 seconds
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // Calculate summary stats
  const totalModels = metrics.length
  const avgRating = metrics.length > 0 
    ? (metrics.reduce((sum, m) => sum + m.avg_rating, 0) / metrics.length).toFixed(1)
    : 0
  const totalFeedback = metrics.reduce((sum, m) => sum + m.total_feedback_count, 0)
  const bestModel = metrics.length > 0 
    ? metrics.reduce((best, m) => m.avg_rating > (best.avg_rating || 0) ? m : best)
    : null
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-primary to-secondary text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Rays LLM</h1>
          <p className="text-sm mt-1 opacity-90">Multi-Model Dashboard</p>
        </div>
        
        <nav className="mt-6 space-y-2 px-4">
          {[
            { id: 'chat', label: '💬 Chat', icon: 'Chat' },
            { id: 'coding', label: '💻 Coding', icon: 'Code' },
            { id: 'metrics', label: '📊 Metrics', icon: 'BarChart3' },
            { id: 'learning', label: '🧠 Learning', icon: 'TrendingUp' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-white text-primary font-semibold'
                  : 'hover:bg-white hover:text-primary text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <p className="text-xs leading-5">
              💡 Tip: Rate model responses to improve ensemble performance over time
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Metrics */}
        <header className="bg-white shadow-sm px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'chat' ? '💬 Chat with LLM Ensemble' : activeTab === 'coding' ? '💻 Code Assistant' : '📊 Model Metrics & Performance'}
            </h2>
          </div>
          
          {/* Quick Stats Bar */}
          {activeTab !== 'coding' && (
          <div className="grid grid-cols-4 gap-4 mt-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Models</p>
                  <p className="text-lg font-bold text-blue-600">{totalModels}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                  <p className="text-lg font-bold text-yellow-600">{avgRating}/5</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Feedback</p>
                  <p className="text-lg font-bold text-purple-600">{totalFeedback}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Best Model</p>
                  <p className="text-lg font-bold text-green-600 truncate">
                    {bestModel ? bestModel.model_name : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}
        </header>
        
        <div className="flex-1 overflow-auto">
          {activeTab === 'chat' ? (
            <div className="flex flex-col h-full">
              <ModelSelector />
              <ChatMessages />
            </div>
          ) : activeTab === 'coding' ? (
            <CodingEditor />
          ) : activeTab === 'learning' ? (
            <LearningDashboard />
          ) : (
            <div className="p-6">
              <MetricsDashboard />
            </div>
          )}
        </div>
        
        {activeTab === 'chat' && <ChatInput />}
      </div>
    </div>
  )
}
