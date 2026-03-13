import React, { useEffect, useState } from 'react'

export default function LearningDashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:8001/api/learning/profile')
        const data = await res.json()
        setProfile(data)
      } catch (e) {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) {
    return <div className="p-6 text-gray-500">Loading learning profile...</div>
  }

  if (!profile) {
    return <div className="p-6 text-red-500">No learning profile found.</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-primary">🧠 Model Learning Profile</h2>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-lg font-semibold text-primary">{profile.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Bio</p>
            <p className="text-lg text-gray-700">{profile.bio || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Interests</p>
            <p className="text-lg text-blue-700">{profile.interests?.length ? profile.interests.join(', ') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expertise Areas</p>
            <p className="text-lg text-green-700">{profile.expertise_areas?.length ? profile.expertise_areas.join(', ') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Learning Topics</p>
            <p className="text-lg text-purple-700">{profile.learning_topics?.length ? profile.learning_topics.join(', ') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Conversations</p>
            <p className="text-lg text-gray-900">{profile.total_conversations}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Messages</p>
            <p className="text-lg text-gray-900">{profile.total_messages}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-lg text-gray-900">{new Date(profile.last_updated).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2 text-secondary">Learned Facts</h3>
        <ul className="list-disc pl-6 text-gray-700">
          {profile.profile_data && Object.entries(profile.profile_data).length > 0 ? (
            Object.entries(profile.profile_data).map(([key, value]) => (
              <li key={key}><span className="font-semibold text-primary">{key}:</span> {String(value)}</li>
            ))
          ) : (
            <li>No facts learned yet.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
