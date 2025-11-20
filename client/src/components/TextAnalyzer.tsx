import { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'

interface TextAnalyzerProps {
  onAnalyze: (text: string, task: string) => Promise<string>
  isLoading: boolean
}

export default function TextAnalyzer({ onAnalyze, isLoading }: TextAnalyzerProps) {
  const [text, setText] = useState('')
  const [task, setTask] = useState('summarize')
  const [result, setResult] = useState('')

  const tasks = [
    { value: 'summarize', label: 'Summarize' },
    { value: 'analyze', label: 'Analyze' },
    { value: 'sentiment', label: 'Sentiment Analysis' },
    { value: 'keywords', label: 'Extract Keywords' },
  ]

  const handleAnalyze = async () => {
    if (!text.trim()) return

    try {
      const analysis = await onAnalyze(text, task)
      setResult(analysis)
    } catch (error) {
      console.error('Text analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error analyzing text. Please try again.'
      setResult(`❌ ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[#14F195]" />
        <h3 className="font-semibold">Text Analyzer</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Analysis Task</label>
          <select
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
          >
            {tasks.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Text to Analyze</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            disabled={isLoading}
          />
          <div className="text-xs text-gray-500 mt-1">{text.length} characters</div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading || !text.trim()}
          className="w-full bg-[#9945FF] hover:bg-[#7d3dd6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'Analyzing...' : 'Analyze Text'}
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
