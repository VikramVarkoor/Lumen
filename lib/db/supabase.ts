import { createClient } from '@supabase/supabase-js'
import type { QueryResult } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase (uses anon key, safe for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase (only called inside API routes)
function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, serviceKey)
}

export async function saveQueryResult(
  result: Omit<QueryResult, 'id' | 'createdAt'>
): Promise<string | null> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('query_history')
    .insert({
      query: result.query,
      selected_models: result.selectedModels,
      responses: result.responses,
      synthesis: result.synthesis,
      agreement_score: result.agreementScore,
      user_id: result.userId || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to save query:', error)
    return null
  }

  return data?.id ?? null
}

export async function getQueryHistory(
  userId: string,
  limit = 20
): Promise<QueryResult[]> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('query_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    query: row.query,
    selectedModels: row.selected_models,
    responses: row.responses,
    synthesis: row.synthesis,
    agreementScore: row.agreement_score,
    createdAt: row.created_at,
    userId: row.user_id,
  }))
}

export async function getQueryById(id: string): Promise<QueryResult | null> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('query_history')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    query: data.query,
    selectedModels: data.selected_models,
    responses: data.responses,
    synthesis: data.synthesis,
    agreementScore: data.agreement_score,
    createdAt: data.created_at,
    userId: data.user_id,
  }
}