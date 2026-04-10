interface AvatarBadgeProps {
  avatarUrl?: string | null
  fullName?: string
  firstName?: string
  lastName?: string
  username?: string
  size?: number
}

function getInitials(fullName?: string, firstName?: string, lastName?: string, username?: string) {
  if (fullName) {
    return fullName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join('')
  }

  if (firstName || lastName) {
    const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('')
    return initials.toUpperCase() || 'U'
  }

  if (username) {
    return username.slice(0, 2).toUpperCase()
  }

  return 'U'
}

export function AvatarBadge({ avatarUrl, fullName, firstName, lastName, username, size = 48 }: AvatarBadgeProps) {
  const initials = getInitials(fullName, firstName, lastName, username)

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={fullName || username || 'User avatar'}
      className="h-12 w-12 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}
