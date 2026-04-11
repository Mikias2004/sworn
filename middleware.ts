import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect dashboard and all onboarding routes
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
