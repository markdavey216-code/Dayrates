import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // auth issues.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Protected routes
  const protectedPaths = ["/dashboard", "/builder", "/calendar", "/customers", "/tax", "/onboarding"];
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path));

  if (!user && isProtectedPath) {
    // no user, potentially respond by redirecting the user to the login page
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // If user is logged in, check if they need onboarding
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const hasCompletedOnboarding = profile?.onboarding_completed;

    if (!hasCompletedOnboarding && url.pathname !== "/onboarding" && isProtectedPath) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (hasCompletedOnboarding && url.pathname === "/onboarding") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect logged in users away from auth pages
    if (url.pathname === "/login" || url.pathname === "/signup" || url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({
  //      request,
  //    })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but remember that it
  //    needs to have the cookies from the supabaseResponse object.

  return supabaseResponse;
}
