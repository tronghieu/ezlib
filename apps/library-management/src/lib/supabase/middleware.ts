import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Extract library code from URL path (format: /[library-code]/*)
  const libraryRouteMatch = request.nextUrl.pathname.match(/^\/([a-zA-Z0-9-]+)\//)
  const libraryCode = libraryRouteMatch?.[1]
  const isLibraryRoute = !!libraryCode
  
  // Define public routes that don't require authentication
  const isPublicRoute = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth/') ||
    request.nextUrl.pathname.startsWith('/error') ||
    request.nextUrl.pathname.startsWith('/api/health')

  // Debug logging
  console.log(`[Middleware Debug] Path: ${request.nextUrl.pathname}, User: ${user ? 'authenticated' : 'not authenticated'}, LibraryCode: ${libraryCode}, IsLibraryRoute: ${isLibraryRoute}, IsPublicRoute: ${isPublicRoute}`)

  if (!user && (isLibraryRoute || !isPublicRoute)) {
    // No user and trying to access protected route, redirect to login
    console.log(`[Middleware Debug] Redirecting to login: ${request.nextUrl.pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Add return URL for redirect after login
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Additional check: if user is authenticated and accessing a library route,
  // verify they have access to this specific library
  if (user && isLibraryRoute && libraryCode) {
    try {
      // First get the library ID from the library code
      const { data: library, error: libraryError } = await supabase
        .from('libraries')
        .select('id')
        .eq('code', libraryCode)
        .eq('status', 'active')
        .single()

      if (libraryError || !library) {
        console.log(`[Middleware Debug] Library not found or inactive: ${libraryCode}`)
        // Library doesn't exist or is inactive, redirect to home
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('error', 'library_not_found')
        return NextResponse.redirect(url)
      }

      // Check if user has staff access to this library
      const { data: staffData, error: staffError } = await supabase
        .from('library_staff')
        .select('role, status')
        .eq('user_id', user.id)
        .eq('library_id', library.id)
        .eq('status', 'active')
        .single()

      if (staffError || !staffData) {
        console.log(`[Middleware Debug] User ${user.id} has no access to library ${libraryCode}`)
        // User doesn't have access to this library, redirect to home
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('error', 'library_access_denied')
        return NextResponse.redirect(url)
      }

      console.log(`[Middleware Debug] User ${user.id} has ${staffData.role} access to library ${libraryCode}`)
    } catch (error) {
      console.error(`[Middleware Debug] Error checking library access:`, error)
      // On database error, allow access but log the error
      // This prevents the app from breaking if there are temporary DB issues
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}