import { createServerSupabaseClient } from '@/lib/utils/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'
  
  if (code) {
    const supabase = createServerSupabaseClient()
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes - now goes to dashboard
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`)
}