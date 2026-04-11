import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase";
import type { User } from "./supabase";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user, error } = await getSupabaseAdmin()
          .from("users")
          .select("*")
          .eq("email", credentials.email.toLowerCase())
          .single<User>();

        if (error || !user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          stripeCustomerId: user.stripe_customer_id,
          stripePaymentMethodId: user.stripe_payment_method_id,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.stripeCustomerId = (user as any).stripeCustomerId;
        token.stripePaymentMethodId = (user as any).stripePaymentMethodId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).stripeCustomerId = token.stripeCustomerId;
        (session.user as any).stripePaymentMethodId =
          token.stripePaymentMethodId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};
