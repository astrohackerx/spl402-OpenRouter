import { useState } from 'react'
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react'

interface VisionAnalyzerProps {
  onAnalyze: (prompt: string, imageUrl: string) => Promise<string>
  isLoading: boolean
}

export default function VisionAnalyzer({ onAnalyze, isLoading }: VisionAnalyzerProps) {
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [result, setResult] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setImageUrl(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (url: string) => {
    setImageUrl(url)
    setImagePreview(url)
  }

  const handleAnalyze = async () => {
    if (!prompt.trim() || !imageUrl) return

    try {
      const analysis = await onAnalyze(prompt, imageUrl)
      setResult(analysis)
    } catch (error) {
      console.error('Vision analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error analyzing image. Please try again.'
      setResult(`❌ ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-[#14F195]" />
        <h3 className="font-semibold">Vision Analyzer</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Image Source</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Enter image URL..."
              className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            />
            <label className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-4 py-2 transition-colors cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {imagePreview && (
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-2">What do you want to know about this image?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Describe what's in this image, What objects can you see?"
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading || !prompt.trim() || !imageUrl}
          className="w-full bg-[#9945FF] hover:bg-[#7d3dd6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Image'
          )}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-2">Analysis Result</label>
          <div className="bg-zinc-900 text-gray-100 rounded-lg p-4 border border-white/10 whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}
