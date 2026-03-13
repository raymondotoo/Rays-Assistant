import React, { useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useMetricsStore } from '../store'
import { HardDrive, Zap, TrendingUp } from 'lucide-react'

export default function MetricsDashboard() {
  const { metrics, fetchMetrics } = useMetricsStore()
  
  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.model_name} className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-bold text-lg mb-3">{metric.model_name}</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <HardDrive size={16} />
                  <span>Size</span>
                </div>
                <span className="font-semibold">{metric.model_size_mb.toFixed(1)}MB</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Zap size={16} />
                  <span>Avg Response</span>
                </div>
                <span className="font-semibold">{metric.avg_response_time.toFixed(2)}s</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp size={16} />
                  <span>Rating</span>
                </div>
                <span className="font-semibold">{metric.avg_rating.toFixed(2)}/5 ⭐</span>
              </div>
              
              <div className="text-gray-500 text-xs">
                {metric.total_requests} requests • {metric.total_feedback_count} ratings
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Response Time Comparison */}
      {metrics.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold text-lg mb-4">Response Time Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_response_time" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Rating Trend */}
      {metrics.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold text-lg mb-4">Model Ratings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model_name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_rating" fill="#764ba2" name="Average Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
