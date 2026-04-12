import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'
import { Button } from '../components'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../hooks'
import { uploadImageToSupabase } from '../lib/storage'
import { ROUTES } from '../constants'
import { AvatarUploadField, PasswordInput, ProfileSectionCard } from '../modules/profile/components'

interface ValidationErrors {
  password?: string
  confirmPassword?: string
  avatar?: string
}

const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isLoading, updateProfile, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>()
  const [uploaderKey, setUploaderKey] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    setAvatarPreview(user.avatar_url ?? undefined)
  }, [user])

  useEffect(() => {
    if (!avatarPreview?.startsWith('blob:')) {
      return
    }

    return () => {
      URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const displayName = user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Profile owner'
  const currentAvatarValue = user.avatar_url ?? undefined
  const isAvatarChanged = avatarPreview !== currentAvatarValue
  const hasPendingPasswordChange = password.length > 0 || confirmPassword.length > 0
  const isDirty = isAvatarChanged || hasPendingPasswordChange

  const profileFacts = [
    { label: 'Username', value: user.username, hint: 'No username assigned' },
    { label: 'Email', value: user.email, hint: 'No email available' },
    { label: 'Role', value: user.role ? user.role[0].toUpperCase() + user.role.slice(1) : null, hint: 'No role assigned' },
    { label: 'Display name', value: user.full_name || displayName, hint: 'Set from your profile record' }
  ]

  function clearMessages() {
    setFormError(null)
    setStatusMessage(null)
  }

  function resetFormState() {
    clearMessages()
    setSelectedFile(null)
    setAvatarPreview(currentAvatarValue)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setValidationErrors({})
    setUploaderKey((value) => value + 1)
  }

  function handleBackNavigation() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(ROUTES.DASHBOARD)
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

    if (selectedFile && selectedFile.size > MAX_AVATAR_SIZE_BYTES) {
      errors.avatar = 'Image must be 10MB or smaller'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleFileSelect(file: File | null) {
    clearMessages()
    setSelectedFile(file)
    setValidationErrors((prev) => ({ ...prev, avatar: undefined }))
    setAvatarPreview(file ? URL.createObjectURL(file) : user?.avatar_url ?? undefined)
  }

  function handleRemoveAvatar() {
    clearMessages()
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
        const avatarPath = await uploadImageToSupabase(selectedFile)
        await updateProfile({
          avatar_url: avatarPath
        })
      } else if (avatarPreview === undefined && user.avatar_url) {
        await updateProfile({ avatar_url: null })
      }

      if (password) {
        await updatePassword(password)
      }

      setStatusMessage('Profile updated successfully.')
      setSelectedFile(null)
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setValidationErrors({})
      setUploaderKey((value) => value + 1)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Button variant="secondary" className="w-full justify-center sm:w-auto" onClick={handleBackNavigation}>
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </span>
        </Button>
        {isDirty && (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Unsaved changes
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside>
          <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))]">
            <div className="flex flex-col items-center gap-5 text-center">
              <AvatarUploadField
                key={uploaderKey}
                preview={avatarPreview}
                onFileSelect={handleFileSelect}
                onRemove={handleRemoveAvatar}
                error={validationErrors.avatar}
                variant="avatar-overlay"
                fullName={user.full_name}
                firstName={user.first_name}
                lastName={user.last_name}
                username={user.username}
                avatarSize={104}
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Profile</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{displayName}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage your avatar, review account details, and keep your sign-in secure.</p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200/80 pt-4 dark:border-slate-800">
              <div className="mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Account details</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Read-only identity info from your profile record.</p>
              </div>
              <dl className="space-y-2.5">
                {profileFacts.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 text-left dark:border-slate-700 dark:bg-slate-900/70">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{item.value || item.hint}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-4 xl:min-h-[560px]">
          <ProfileSectionCard
            className="h-full"
            title="Security"
            description="Only enter a new password when you want to rotate your credentials."
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <KeyRound className="h-3.5 w-3.5" />
                Credentials
              </div>
            }
          >
            <div className="space-y-4">
              <PasswordInput
                label="New password"
                value={password}
                onChange={(value) => {
                  clearMessages()
                  setPassword(value)
                }}
                onErrorClear={() => setValidationErrors((prev) => ({ ...prev, password: undefined }))}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword(!showPassword)}
                error={validationErrors.password}
                placeholder="Enter a new password"
              />
              <PasswordInput
                label="Confirm password"
                value={confirmPassword}
                onChange={(value) => {
                  clearMessages()
                  setConfirmPassword(value)
                }}
                onErrorClear={() => setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }))}
                showPassword={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                error={validationErrors.confirmPassword}
                placeholder="Confirm your new password"
              />

              {formError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              {statusMessage && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{statusMessage}</p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Changes apply immediately to the current signed-in account.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="secondary" onClick={resetFormState} disabled={!isDirty || isSubmitting}>
                      Reset changes
                    </Button>
                    <Button type="submit" className="min-w-[160px]" disabled={!isDirty || isSubmitting}>
                      {isSubmitting ? 'Saving changes...' : 'Save changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ProfileSectionCard>
        </form>
      </div>
    </div>
  )
}
