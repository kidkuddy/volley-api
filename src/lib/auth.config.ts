import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null, // Actual authorize logic is in auth.ts
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // Admin routes
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        const isAdmin = (auth?.user as Record<string, unknown>)?.isAdmin;
        if (!isAdmin) {
          return Response.redirect(new URL("/app", request.url));
        }
        return true;
      }

      // App routes
      if (pathname.startsWith("/app")) {
        if (!isLoggedIn) return false;
        const isApproved = (auth?.user as Record<string, unknown>)?.isApproved;
        if (!isApproved) {
          return Response.redirect(new URL("/pending", request.url));
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.isAdmin = (user as Record<string, unknown>).isAdmin as boolean;
        token.isApproved = (user as Record<string, unknown>).isApproved as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
  },
};
