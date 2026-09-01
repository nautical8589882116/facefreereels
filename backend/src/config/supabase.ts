import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'assets'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — file uploads will fail.'
  )
}

// Service-role client: server-side only, bypasses RLS. Never expose to the browser.
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
)

export interface UploadedObject {
  path: string
  publicUrl: string
  size: number
}

/**
 * Upload a buffer to Supabase Storage and return its public URL + object path.
 */
export async function uploadBuffer(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadedObject> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType, upsert: false })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)

  return { path, publicUrl: data.publicUrl, size: buffer.length }
}

/**
 * Remove an object from Supabase Storage. Resolves even if the object is gone.
 */
export async function removeObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path])
  if (error) {
    throw new Error(`Supabase remove failed: ${error.message}`)
  }
}

/**
 * Derive the storage object path from a public URL produced by getPublicUrl.
 * Returns null if the URL doesn't match this bucket.
 */
export function objectPathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}
