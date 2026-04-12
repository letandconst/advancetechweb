import { FormEvent, useEffect, useRef, useState } from 'react'
import { Button } from '../../../components'
import { AvatarUploadField } from '../../profile/components'
import { uploadMechanicImageToSupabase, resolveMechanicAvatarUrl } from '../../../lib/storage'
import { MechanicFormData } from '../types'

interface MechanicFormProps {
  initialData?: Partial<MechanicFormData>
  onSubmit: (data: MechanicFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function MechanicForm({ initialData, onSubmit, onCancel, loading = false }: MechanicFormProps) {
  const [formData, setFormData] = useState<MechanicFormData>({
    name: '',
    birthday: '',
    address: '',
    phone_number: '',
    status: 'active',
    image: null,
    specialization: '',
    emergency_contact_person: '',
    emergency_contact_phone: '',
    ...initialData,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof MechanicFormData, string>>>({})
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const blobPreviewRef = useRef('')

  useEffect(() => {
    setFormData({
      name: '',
      birthday: '',
      address: '',
      phone_number: '',
      status: 'active',
      image: null,
      specialization: '',
      emergency_contact_person: '',
      emergency_contact_phone: '',
      ...initialData,
    })
    setErrors({})
    setPendingImageFile(null)

    if (blobPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobPreviewRef.current)
    }
    blobPreviewRef.current = ''
    setImagePreview('')

    let released = false
    if (initialData?.image) {
      resolveMechanicAvatarUrl(initialData.image)
        .then((url) => { if (!released) setImagePreview(url) })
        .catch(() => { if (!released) setImagePreview('') })
    }
    return () => { released = true }
  }, [initialData])

  // Revoke any lingering blob URL when the form unmounts
  useEffect(() => {
    return () => {
      if (blobPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobPreviewRef.current)
      }
    }
  }, [])

  const inputClassName = 'w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950'
  const normalBorderClassName = 'border-slate-200 dark:border-slate-800'
  const errorBorderClassName = 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-950'

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof MechanicFormData, string>> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.birthday) newErrors.birthday = 'Birthday is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required'
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required'
    if (!formData.emergency_contact_person.trim()) newErrors.emergency_contact_person = 'Emergency contact person is required'
    if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = 'Emergency contact phone is required'

    // Phone number validation (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (formData.phone_number && !phoneRegex.test(formData.phone_number)) {
      newErrors.phone_number = 'Invalid phone number format'
    }
    if (formData.emergency_contact_phone && !phoneRegex.test(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = 'Invalid emergency contact phone format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    let imagePath = formData.image
    if (pendingImageFile) {
      try {
        imagePath = await uploadMechanicImageToSupabase(pendingImageFile)
      } catch {
        setErrors((prev) => ({ ...prev, image: 'Failed to upload image. Please try again.' }))
        return
      }
    }

    onSubmit({ ...formData, image: imagePath })
  }

  function handleImageSelect(file: File | null) {
    if (!file) return
    if (blobPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobPreviewRef.current)
    }
    const url = URL.createObjectURL(file)
    blobPreviewRef.current = url
    setPendingImageFile(file)
    setImagePreview(url)
  }

  function handleImageRemove() {
    if (blobPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobPreviewRef.current)
    }
    blobPreviewRef.current = ''
    setPendingImageFile(null)
    setImagePreview('')
    setFormData((prev) => ({ ...prev, image: null }))
  }

  function handleChange(field: keyof MechanicFormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mechanic photo */}
      <div className="flex flex-col items-center gap-2 pb-2">
        <AvatarUploadField
          variant="avatar-overlay"
          preview={imagePreview}
          onFileSelect={handleImageSelect}
          onRemove={handleImageRemove}
          fullName={formData.name || undefined}
          avatarSize={96}
          error={errors.image}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">Photo (optional)</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Mechanic details</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Capture the core details needed for staffing, scheduling, and workshop assignments.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`${inputClassName} ${errors.name ? errorBorderClassName : normalBorderClassName}`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Birthday *
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleChange('birthday', e.target.value)}
                className={`${inputClassName} ${errors.birthday ? errorBorderClassName : normalBorderClassName}`}
              />
              {errors.birthday && <p className="mt-2 text-sm text-red-600">{errors.birthday}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className={`${inputClassName} ${errors.address ? errorBorderClassName : normalBorderClassName}`}
                placeholder="Enter full address"
              />
              {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                className={`${inputClassName} ${errors.phone_number ? errorBorderClassName : normalBorderClassName}`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone_number && <p className="mt-2 text-sm text-red-600">{errors.phone_number}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
                className={`${inputClassName} ${normalBorderClassName}`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Specialization *
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
                className={`${inputClassName} ${errors.specialization ? errorBorderClassName : normalBorderClassName}`}
                placeholder="e.g., Engine Repair, Brake Systems"
              />
              {errors.specialization && <p className="mt-2 text-sm text-red-600">{errors.specialization}</p>}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Emergency contact</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Keep a reliable fallback contact on file for shift coverage and urgent incidents.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Emergency Contact Person *
              </label>
              <input
                type="text"
                value={formData.emergency_contact_person}
                onChange={(e) => handleChange('emergency_contact_person', e.target.value)}
                className={`${inputClassName} ${errors.emergency_contact_person ? errorBorderClassName : normalBorderClassName}`}
                placeholder="Enter contact person name"
              />
              {errors.emergency_contact_person && <p className="mt-2 text-sm text-red-600">{errors.emergency_contact_person}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Emergency Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                className={`${inputClassName} ${errors.emergency_contact_phone ? errorBorderClassName : normalBorderClassName}`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.emergency_contact_phone && <p className="mt-2 text-sm text-red-600">{errors.emergency_contact_phone}</p>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Emergency contacts are visible to admins coordinating staffing and incident response.
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save mechanic'}
        </Button>
      </div>
    </form>
  )
}