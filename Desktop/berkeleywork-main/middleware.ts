import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add any custom middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

// Protect all routes except public ones
export const config = {
  matcher: [
    // Protected routes that require authentication
    "/my-sessions/:path*",
    "/calendar/:path*",
    "/sessions/:path*",
    "/create/:path*",
    "/profile/:path*",
    "/api/sessions/:path*",
  ],
}; 