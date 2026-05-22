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

  // Public paths that don't need auth check beyond basic user detection
  const isAuthPath = path === "/login" || path === "/signup";
  const isLandingPage = path === "/";
  // App paths that REQUIRE auth
  const isAppPath = [
    "/dashboard",
    "/builder",
    "/calendar",
    "/customers",
    "/tax",
    "/onboarding",
  ].some((p) => path.startsWith(p));

  // Case 1: No user session
  if (!user) {
    // If trying to access app, send to login
    if (isAppPath) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Otherwise allow access to landing, login, signup
    return response;
  }

  // Case 2: User session exists
  // We need to check onboarding status to ensure they don't skip it
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  // Handle case where profile might not exist yet (should be rare due to trigger)
  // or if there's a transient error. We default to not completed to be safe.
  const onboardingCompleted = profile?.onboarding_completed === true;

  // A. If not completed onboarding and not on onboarding page -> send to onboarding
  if (!onboardingCompleted && path !== "/onboarding") {
    // Only redirect if they are on an app path, auth path, or landing
    if (isAppPath || isAuthPath || isLandingPage) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // B. If completed onboarding and on onboarding page or auth page or landing -> send to dashboard
  if (onboardingCompleted && (path === "/onboarding" || isAuthPath || isLandingPage)) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Allow through to the requested app path (dashboard, builder, etc.)
  return response;
}
