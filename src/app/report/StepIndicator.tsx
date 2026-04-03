import { Check } from 'lucide-react'

interface StepIndicatorProps {
  steps: string[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <>
      {/* Desktop: numbered steps with labels */}
      <div className="hidden md:flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${i < current
                  ? 'bg-primary-600 text-white'
                  : i === current
                  ? 'border-2 border-primary-600 text-primary-600 bg-white'
                  : 'bg-gray-100 text-gray-400'}`}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`ml-2 text-sm ${
                i === current ? 'text-primary-600 font-medium' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 ${
                  i < current ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: dot indicator */}
      <div className="flex md:hidden items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </>
  )
}
