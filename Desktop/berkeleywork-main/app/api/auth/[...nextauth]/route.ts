import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import { User } from "@/lib/db/schema";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect();
        
        // Check if user exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user with default values
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            fullName: user.name || "New User",
            class: "freshman",
            majors: ["Undeclared"],
            interests: ["General Studies"],
            description: "New user profile. Please update your profile information.",
            instagram: null,  // Initialize with null
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.email = token.email!;
        session.user.name = token.name!;
        session.user.image = token.picture!;
      }
      return session;
    },
  },
  events: {
    async signOut({ session, token }) {
      // Clean up any necessary data on sign out
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 