import { useState, useRef } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/features/report/mediaUpload'

interface StepEvidenceProps {
  photos: File[]
  photoUrls: string[]
  onPhotosChange: (files: File[], urls: string[]) => void
}

export function StepEvidence({
  photos,
  photoUrls,
  onPhotosChange,
}: StepEvidenceProps) {
  const [compressing, setCompressing] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const total = photos.length + files.length
    if (total > 5) {
      setFileError('Maximum 5 photos allowed.')
      return
    }

    setFileError(null)
    setCompressing(true)
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)))
      const newPhotos = [...photos, ...compressed]
      const newUrls = newPhotos.map((f) => URL.createObjectURL(f))
      onPhotosChange(newPhotos, newUrls)
    } catch {
      setFileError('Failed to compress images. Please try again.')
    } finally {
      setCompressing(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemovePhoto(index: number) {
    const newFiles = photos.filter((_, i) => i !== index)
    const newUrls = newFiles.map((f) => URL.createObjectURL(f))
    onPhotosChange(newFiles, newUrls)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Take photos or upload evidence. Visual proof helps responders understand
        the situation quickly and accurately.
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        onChange={handleFileChange}
        disabled={photos.length >= 5 || compressing}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={photos.length >= 5 || compressing}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand hover:text-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {compressing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
        {compressing ? 'Compressing...' : photos.length >= 5 ? 'Maximum photos reached' : 'Add Photo'}
      </button>

      {fileError && (
        <p className="text-red-600 text-sm">{fileError}</p>
      )}

      {photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Evidence ${i + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
