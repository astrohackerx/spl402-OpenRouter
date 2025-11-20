import { useState } from 'react'
import { Code, Copy, Check } from 'lucide-react'

interface CodeGeneratorProps {
  onGenerate: (prompt: string, language: string) => Promise<string>
  isLoading: boolean
}

export default function CodeGenerator({ onGenerate, isLoading }: CodeGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'rust',
    'go',
    'php',
    'ruby',
    'swift',
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    try {
      const code = await onGenerate(prompt, language)
      setGeneratedCode(code)
    } catch (error) {
      console.error('Code generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error generating code. Please try again.'
      setGeneratedCode(`❌ ${errorMessage}`)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Code className="w-5 h-5 text-[#14F195]" />
        <h3 className="font-semibold">Code Generator</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Programming Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Describe what you want to build</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a function to calculate fibonacci numbers"
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-[#9945FF] hover:bg-[#7d3dd6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      {generatedCode && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Generated Code</label>
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
          <pre className="bg-zinc-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm border border-white/10">
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
