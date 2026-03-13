import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { submitFeedback } from '../api'

export default function FeedbackForm({ messageId, modelName, conversationId, onSubmitSuccess }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleSubmit = async () => {
    if (!messageId || !modelName) {
      setError('Missing required information')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      await submitFeedback(messageId, modelName, rating, comment)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
      setRating(0)
      setComment('')
      onSubmitSuccess?.()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  if (submitted) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
        ✓ Feedback submitted!
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2 text-sm">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">
          {error}
        </div>
      )}
      
      {/* Star Rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none transition"
          >
            <Star
              size={18}
              className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
            />
          </button>
        ))}
      </div>
      
      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional: share your feedback..."
        className="w-full p-2 border border-gray-300 rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        rows="2"
      />
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || loading}
        className={`w-full px-2 py-1 rounded text-xs font-medium ${
          rating === 0 || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-secondary'
        }`}
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  )
}
