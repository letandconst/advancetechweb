type SupabaseLikeError = {
  message?: string
}

type SupabaseLikeResult<TData = unknown> = {
  data: TData | null
  error: SupabaseLikeError | null
}

type SupabaseLikeCountResult<TData = unknown> = SupabaseLikeResult<TData> & {
  count?: number | null
}

function toErrorMessage(context: string, error: SupabaseLikeError | null) {
  const detail = error?.message?.trim() || 'Unknown Supabase error'
  return `${context}: ${detail}`
}

export function ensureNoSupabaseError(
  result: { error: SupabaseLikeError | null },
  context: string
): void {
  if (result.error) {
    throw new Error(toErrorMessage(context, result.error))
  }
}

export function getSupabaseDataOrThrow<TData>(
  result: SupabaseLikeResult<TData>,
  context: string
): TData {
  ensureNoSupabaseError(result, context)

  if (result.data === null) {
    throw new Error(`${context}: Empty response data.`)
  }

  return result.data
}

export function getSupabaseListOrEmpty<TItem>(
  result: SupabaseLikeResult<TItem[]>,
  context: string
): TItem[] {
  ensureNoSupabaseError(result, context)
  return result.data ?? []
}

export function getSupabaseCountOrZero<TData>(
  result: SupabaseLikeCountResult<TData>,
  context: string
): number {
  ensureNoSupabaseError(result, context)
  return result.count ?? 0
}
