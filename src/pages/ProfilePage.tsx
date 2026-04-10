import { FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../components/Button'
import { AvatarBadge } from '../components/AvatarBadge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../hooks'
import { uploadImageToSupabase } from '../lib/storage'
import { PasswordInput, AvatarUploadField } from '../modules/profile/components'

interface ValidationErrors {
  password?: string
  confirmPassword?: string
  avatar?: string
}

export function ProfilePage() {
  const { user, isLoading, updateProfile, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    setAvatarPreview(user.avatar_url ?? undefined)
  }, [user])

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  function validateForm(): boolean {
    const errors: ValidationErrors = {}

    if (password) {
      if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    } else if (confirmPassword) {
      errors.confirmPassword = 'Please enter a new password'
    }

    if (selectedFile && !selectedFile.type.startsWith('image/')) {
      errors.avatar = 'Please select a valid image file'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    setValidationErrors((prev) => ({ ...prev, avatar: undefined }))
    setAvatarPreview(file ? URL.createObjectURL(file) : user?.avatar_url ?? undefined)
  }

  function handleRemoveAvatar() {
    setSelectedFile(null)
    setAvatarPreview(undefined)
    setValidationErrors((prev) => ({ ...prev, avatar: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setStatusMessage(null)

    if (!validateForm()) {
      return
    }

    if (!user) {
      setFormError('Unable to update profile; user not found.')
      return
    }

    setIsSubmitting(true)

    try {
      if (selectedFile) {
        const avatarUrl = await uploadImageToSupabase(selectedFile, user.id)
        await updateProfile({
          avatar_url: avatarUrl
        })
      } else if (avatarPreview === undefined && user.avatar_url) {
        await updateProfile({
          avatar_url: null
        })
      }

      if (password) {
        await updatePassword(password)
      }

      setStatusMessage('Profile updated successfully.')
      setPassword('')
      setConfirmPassword('')
      setSelectedFile(null)
    } catch (error) {
      setFormError((error as Error)?.message ?? 'Could not update profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Manage your avatar and password</p>
          </div>
          <AvatarBadge
            avatarUrl={avatarPreview ?? user?.avatar_url}
            fullName={user?.full_name}
            firstName={user?.first_name}
            lastName={user?.last_name}
            username={user?.username}
            size={96}
          />
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Avatar</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload a profile picture (optional)</p>
          </div>
          <AvatarUploadField
            preview={avatarPreview}
            onFileSelect={handleFileSelect}
            onRemove={handleRemoveAvatar}
            error={validationErrors.avatar}
          />
        </div>

        {/* Password Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Update your password (leave blank to keep current)</p>
          </div>
          <div className="space-y-4">
            <PasswordInput
              label="New password"
              value={password}
              onChange={setPassword}
              onErrorClear={() => setValidationErrors((prev) => ({ ...prev, password: undefined }))}
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword(!showPassword)}
              error={validationErrors.password}
              placeholder="Enter a new password"
            />
            <PasswordInput
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              onErrorClear={() => setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }))}
              showPassword={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
              error={validationErrors.confirmPassword}
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        {/* Messages */}
        {formError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">{statusMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Saving changes…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}