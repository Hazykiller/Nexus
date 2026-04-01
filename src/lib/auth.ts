import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { v4 as uuidv4 } from 'uuid';
import { encryptAtRest, decryptAtRest } from '@/lib/security/dbEncryption';

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

        const encryptedEmail = encryptAtRest(credentials.email);
        const result = await runSingleQuery<{
          u: { id: string; email: string; username: string; name: string; password: string; avatar: string; verified: boolean; isAdmin?: boolean };
        }>(
          'MATCH (u:User {email: $email}) RETURN u',
          { email: encryptedEmail }
        );

        if (!result?.u) return null;

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
    maxAge: 1 * 60 * 60, // Reduced to 1 hour for Maximum Security
  },
  jwt: {
    maxAge: 15 * 60, // 15 minutes access token
  },
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as unknown as Record<string, unknown>).id as string;
        token.username = (user as unknown as Record<string, unknown>).username as string;
        token.verified = (user as unknown as Record<string, unknown>).verified as boolean;
        token.isAdmin = (user as unknown as Record<string, unknown>).isAdmin as boolean;
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
        (session.user as unknown as Record<string, unknown>).id = token.id;
        (session.user as unknown as Record<string, unknown>).username = token.username;
        (session.user as unknown as Record<string, unknown>).verified = token.verified;
        (session.user as unknown as Record<string, unknown>).isAdmin = token.isAdmin;
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
