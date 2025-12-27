
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './db';
import { compare } from 'bcrypt';

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          // User not found or password not set (e.g., social login)
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("User account is disabled.");
        }
        
        // Return user object without the password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user data to the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.squadId = user.squadId;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom properties to the session object
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.squadId = token.squadId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Optional: Custom error page
  },
  secret: process.env.AUTH_SECRET,
});
