import React, { useEffect } from 'react'
import { useChatStore, useMetricsStore } from '../store'
import { Cpu } from 'lucide-react'

export default function ModelSelector() {
  const { selectedModels, setSelectedModels } = useChatStore()
  const { availableModels, fetchAvailableModels } = useMetricsStore()

  useEffect(() => {
    fetchAvailableModels()
  }, [])

  const toggleModel = (model) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter(m => m !== model))
    } else {
      setSelectedModels([...selectedModels, model])
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={20} className="text-primary" />
        <h3 className="font-semibold text-gray-900">Select Models</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableModels.length === 0 ? (
          <span className="text-gray-500">No models available</span>
        ) : (
          availableModels.map(modelObj => {
            const modelName = modelObj.name || modelObj.model || "unknown";
            return (
              <button
                key={modelName}
                onClick={() => toggleModel(modelName)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedModels.includes(modelName)
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {modelName}
              </button>
            );
          })
        )}
      </div>
    </div>
  )
}
