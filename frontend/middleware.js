import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/utils/supabase.js'

// Array of routes that require authentication
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

// Array of routes that should redirect to homepage if authenticated
const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
]

// Mapping of old auth routes to new auth-layout routes
const authRedirects = {
  '/login': '/auth-layout/login',
  '/signup': '/auth-layout/signup',
  '/forgot-password': '/auth-layout/forgot-password',
}

export async function middleware(request) {
  // Create a Supabase client for Server Components
  const supabase = createServerSupabaseClient()
  
  // Check if there is a session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const { pathname } = request.nextUrl
  
  // Handle redirects from old auth routes to new auth-layout routes
  if (Object.keys(authRedirects).includes(pathname)) {
    const newUrl = new URL(authRedirects[pathname], request.url)
    // Preserve any query parameters
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      newUrl.searchParams.set(key, value)
    }
    return NextResponse.redirect(newUrl)
  }
  
  // If user is not logged in and is trying to access a protected route
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    // Redirect to login page
    const redirectUrl = new URL('/auth-layout/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user is logged in and is trying to access login or signup
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  // Specify which paths this middleware will run on
  matcher: [
    // Match all protected routes
    ...protectedRoutes.map(route => `${route}/:path*`),
    
    // Match auth routes
    ...authRoutes.map(route => `${route}/:path*`),
    
    // Match exact routes without trailing paths
    ...protectedRoutes,
    ...authRoutes,
  ],
}