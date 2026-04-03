import { NextRequest, NextResponse } from 'next/server'
import { getQueryHistory, getQueryById, supabase } from '@/lib/db/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const result = await getQueryById(id)
    if (!result || result.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  }

  const history = await getQueryHistory(user.id)
  return NextResponse.json(history)
}
