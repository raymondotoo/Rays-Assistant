import React, { useEffect, useState } from 'react'
import { useChatStore, useMetricsStore } from '../store'
import { Cpu, Download } from 'lucide-react'
import { downloadModel } from '../api'

export default function ModelSelector() {
  const { selectedModels, setSelectedModels } = useChatStore()
  const { availableModels, fetchAvailableModels } = useMetricsStore()
  const [downloading, setDownloading] = useState("");
  const [downloadMsg, setDownloadMsg] = useState("");

  // Recommended downloadable models
  const recommendedModels = [
    { name: "gpt-oss:20b", label: "GPT-OSS 20B" },
    { name: "mistral:latest", label: "Mistral" },
    { name: "neural-chat:latest", label: "Neural Chat" }
  ];

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

  const handleDownload = async (modelName) => {
    setDownloading(modelName);
    setDownloadMsg("");
    try {
      const res = await downloadModel(modelName);
      if (res.success) {
        setDownloadMsg(`Downloaded ${modelName} successfully!`);
        fetchAvailableModels();
      } else {
        setDownloadMsg(res.error || `Failed to download ${modelName}`);
      }
    } catch (e) {
      setDownloadMsg(`Error: ${e.message}`);
    }
    setDownloading("");
  }

  // Models already available
  const availableNames = availableModels.map(m => m.name || m.model);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={20} className="text-primary" />
        <h3 className="font-semibold text-gray-900">Select Models</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
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
      <div className="mt-2">
        <h4 className="font-medium text-gray-800 mb-1">Download More Models</h4>
        <div className="flex flex-wrap gap-2">
          {recommendedModels.map(({ name, label }) => (
            <button
              key={name}
              onClick={() => handleDownload(name)}
              disabled={downloading === name || availableNames.includes(name)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition ${
                availableNames.includes(name)
                  ? 'bg-green-100 text-green-700 border-green-300 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
              }`}
            >
              <Download size={14} />
              {availableNames.includes(name) ? `${label} (Available)` : (downloading === name ? `Downloading ${label}...` : `Download ${label}`)}
            </button>
          ))}
        </div>
        {downloadMsg && <div className="mt-2 text-sm text-blue-700">{downloadMsg}</div>}
      </div>
    </div>
  )
}
