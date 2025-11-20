import { useState } from 'react'
import { PenTool, Copy, Check } from 'lucide-react'

interface ContentGeneratorProps {
  onGenerate: (prompt: string, contentType: string, tone: string) => Promise<string>
  isLoading: boolean
}

export default function ContentGenerator({ onGenerate, isLoading }: ContentGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('blog-post')
  const [tone, setTone] = useState('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [copied, setCopied] = useState(false)

  const contentTypes = [
    { value: 'blog-post', label: 'Blog Post' },
    { value: 'article', label: 'Article' },
    { value: 'social-media', label: 'Social Media Post' },
    { value: 'email', label: 'Email' },
    { value: 'product-description', label: 'Product Description' },
    { value: 'ad-copy', label: 'Ad Copy' },
  ]

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'persuasive', label: 'Persuasive' },
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    try {
      const content = await onGenerate(prompt, contentType, tone)
      setGeneratedContent(content)
    } catch (error) {
      console.error('Content generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error generating content. Please try again.'
      setGeneratedContent(`❌ ${errorMessage}`)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <PenTool className="w-5 h-5 text-[#14F195]" />
        <h3 className="font-semibold">Content Generator</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            >
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            >
              {tones.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">What do you want to write about?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write about the benefits of AI in modern healthcare"
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-[#9945FF] hover:bg-[#7d3dd6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Content'}
        </button>
      </div>

      {generatedContent && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Generated Content</label>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-zinc-900 text-gray-100 rounded-lg p-4 border border-white/10 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {generatedContent}
          </div>
        </div>
      )}
    </div>
  )
}
