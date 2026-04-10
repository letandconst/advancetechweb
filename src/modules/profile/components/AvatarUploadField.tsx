import { ChangeEvent, useRef } from 'react'
import { X, Upload } from 'lucide-react'

interface AvatarUploadFieldProps {
  preview?: string
  onFileSelect: (file: File | null) => void
  onRemove: () => void
  error?: string
}

export function AvatarUploadField({ preview, onFileSelect, onRemove, error }: AvatarUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    onFileSelect(file)
  }

  function handleRemoveAvatar() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove()
  }

  return (
    <div className="space-y-4">
      <label className="block cursor-pointer">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload image</span>
        <div className="relative mt-3 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Click to upload image
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG, GIF, WebP (Max 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </label>

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Avatar preview"
              className="h-32 w-32 rounded-2xl object-cover shadow-md"
            />
          </div>
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="flex w-fit items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <X className="h-4 w-4" />
            Remove avatar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
