import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { runSingleQuery } from '@/lib/neo4j';
import { decryptAtRest, hashForLookup } from '@/lib/security/dbEncryption';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Use the deterministic hash to find the user
        const emailHash = hashForLookup(credentials.email);
        const result = await runSingleQuery<{
          u: {
            id: string; email: string; username: string; name: string;
            password: string; avatar: string; verified: boolean; isAdmin?: boolean;
          };
        }>(
          'MATCH (u:User {emailHash: $emailHash}) RETURN u',
          { emailHash }
        );

        if (!result?.u) return null;
        if (!result.u.verified) return null; // Must be verified to login

        const isValid = await bcrypt.compare(credentials.password, result.u.password);
        if (!isValid) return null;

        return {
          id: result.u.id,
          email: decryptAtRest(result.u.email),
          name: result.u.name,
          image: result.u.avatar || null,
          username: result.u.username,
          verified: result.u.verified,
          isAdmin: result.u.isAdmin || false,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.verified = (user as any).verified;
        token.isAdmin = (user as any).isAdmin;
      }
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.image = session.image;
        token.username = session.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).verified = token.verified;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
