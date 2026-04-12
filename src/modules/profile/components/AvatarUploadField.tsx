import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Pencil, Upload, X } from 'lucide-react'
import { AvatarBadge } from '../../../components/AvatarBadge'
import { useAvatarUrl } from '../../../hooks/useAvatarUrl'

interface AvatarUploadFieldProps {
  preview?: string
  onFileSelect: (file: File | null) => void
  onRemove: () => void
  error?: string
  showPreview?: boolean
  compact?: boolean
  variant?: 'default' | 'avatar-overlay'
  fullName?: string
  firstName?: string
  lastName?: string
  username?: string
  avatarSize?: number
}

export function AvatarUploadField({
  preview,
  onFileSelect,
  onRemove,
  error,
  showPreview = true,
  compact = false,
  variant = 'default',
  fullName,
  firstName,
  lastName,
  username,
  avatarSize = 120
}: AvatarUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const resolvedPreview = useAvatarUrl(preview)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)

  useEffect(() => {
    if (!isActionMenuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsActionMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsActionMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isActionMenuOpen])

  function openFilePicker() {
    setIsActionMenuOpen(false)
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    onFileSelect(file)
  }

  function handleRemoveAvatar() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsActionMenuOpen(false)
    onRemove()
  }

  if (variant === 'avatar-overlay') {
    return (
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div ref={menuRef} className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActionMenuOpen((value) => !value)}
            className="group relative overflow-hidden rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 dark:focus-visible:ring-sky-900"
            aria-haspopup="menu"
            aria-expanded={isActionMenuOpen}
            aria-label={preview ? 'Edit profile picture' : 'Upload profile picture'}
          >
            <AvatarBadge
              avatarUrl={preview}
              fullName={fullName}
              firstName={firstName}
              lastName={lastName}
              username={username}
              size={avatarSize}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-slate-950/0 text-white opacity-0 transition duration-200 group-hover:bg-slate-950/55 group-hover:opacity-100 group-focus-visible:bg-slate-950/55 group-focus-visible:opacity-100">
              <Pencil className="h-5 w-5" />
              <span className="text-xs font-medium">Edit</span>
            </div>
          </button>

          {isActionMenuOpen && (
            <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-white/95 p-2 text-left shadow-[0_18px_48px_-24px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95" role="menu">
              <button
                type="button"
                onClick={openFilePicker}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                role="menuitem"
              >
                <Upload className="h-4 w-4" />
                Choose photo
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/30"
                  role="menuitem"
                >
                  <X className="h-4 w-4" />
                  Remove photo
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && showPreview && (
        <div className="flex flex-col gap-3">
          <div className="relative inline-block">
            {resolvedPreview ? (
              <img
                src={resolvedPreview}
                alt="Avatar preview"
                className="h-36 w-36 rounded-[28px] object-cover shadow-md"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-[28px] bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Loading preview...
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 rounded-b-[28px] bg-gradient-to-t from-slate-950/70 via-slate-900/40 to-transparent px-3 py-3">
              <button
                type="button"
                onClick={openFilePicker}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
              >
                <Pencil className="h-3.5 w-3.5" />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-slate-950/60"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Use Change to pick another image, or Remove to clear the current avatar.</p>
        </div>
      )}

      {!preview && showPreview && (
        <button
          type="button"
          onClick={openFilePicker}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <Upload className="h-5 w-5" />
          Upload image
        </button>
      )}

      {!showPreview && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25 dark:border-slate-700 dark:bg-slate-900/60"
          >
            {preview ? <Pencil className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {preview ? 'Change image' : 'Upload image'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-3.5 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-slate-950/50 dark:border-slate-700 dark:bg-slate-950/70"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

