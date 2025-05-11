import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/utils/supabase.js'

const protectedRoutes = [
  '/document-workspace',
  '/dsa-practice',
  '/study-notes',
  '/flashcards',
  '/mind-maps',
  '/practice-tests',
  '/study-roadmap',
  '/settings',
  '/document-upload',
]

const authRoutes = [
  '/login',
  '/signup',
]

export async function middleware(request) {
  const supabase = createServerSupabaseClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const { pathname } = request.nextUrl
  
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    ...protectedRoutes.map(route => `${route}/:path*`),
    ...authRoutes.map(route => `${route}/:path*`),
    ...protectedRoutes,
    ...authRoutes,
  ],
}