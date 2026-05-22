import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh session if expired - MUST be called before any other supabase call
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Define protected paths
  const protectedPaths = [
    "/dashboard",
    "/builder",
    "/calendar",
    "/customers",
    "/tax",
    "/onboarding",
  ];
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));

  // Get onboarding status if user exists
  let onboardingCompleted = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();
    onboardingCompleted = profile?.onboarding_completed === true;
  }

  // 3. Add a console.log at the start showing the current path, session status and onboarding_completed value
  console.log(`Middleware Debug: path=${path} authenticated=${!!user} onboarding_completed=${onboardingCompleted}`);

  // 1. Unauthenticated user on protected route -> redirect to /login only
  if (!user && isProtectedPath) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Handle authenticated users
  if (user) {
    // 3. Authenticated user with onboarding_completed = false -> redirect to /onboarding only
    if (!onboardingCompleted && path !== "/onboarding") {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // 2. Authenticated user with onboarding_completed = true -> allow through
    // Additionally, prevent them from accessing /login, /signup, / or /onboarding by sending them to /dashboard
    if (onboardingCompleted) {
      const isAuthPage = path === "/login" || path === "/signup" || path === "/";
      if (isAuthPage || path === "/onboarding") {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // Allow through to the requested path
  return response;
}
