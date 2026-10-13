import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Shared Auth.js config.
 * Route protection uses server layouts + auth() (database sessions).
 * Avoid Edge middleware DB lookups with the Neon Pool adapter.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  callbacks: {
    // Database sessions pass `user`; expose stable id to server + client session.
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
