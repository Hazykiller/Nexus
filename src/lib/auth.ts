import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { decryptAtRest, hashForLookup } from '@/lib/security/dbEncryption';
import { getRateLimit } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security/security';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Account Lockout: 5 failed attempts per 15 minutes per email
        const lockoutKey = `login-${credentials.email.toLowerCase().trim()}`;
        const rl = getRateLimit(lockoutKey, 5, 15 * 60 * 1000);
        if (!rl.success) {
          console.log(`[Security] Account locked: ${credentials.email} — too many failed attempts`);
          throw new Error('Account temporarily locked. Too many failed login attempts. Please try again in 15 minutes.');
        }

        // Use the deterministic hash to find the user
        const emailHash = hashForLookup(credentials.email);
        const result = await runSingleQuery<{
          u: {
            id: string; email: string; username: string; name: string;
            password: string; avatar: string; verified: boolean; isAdmin?: boolean;
            banned?: boolean;
          };
        }>(
          'MATCH (u:User {emailHash: $emailHash}) RETURN u',
          { emailHash }
        );

        if (!result?.u) return null;
        if (!result.u.verified) return null; // Must be verified to login
        if (result.u.banned) {
          throw new Error('Your account has been suspended. Contact admin.');
        }

        const isValid = await bcrypt.compare(credentials.password, result.u.password);
        if (!isValid) {
          // Log failed login attempt
          await logSecurityEvent(
            'unauthorized_access',
            `Failed login attempt for ${credentials.email} (${rl.remaining} attempts remaining)`,
            result.u.id
          );
          return null;
        }

        // Successful login — log login activity
        const ip = (req?.headers && typeof req.headers === 'object' && 'x-forwarded-for' in req.headers)
          ? (req.headers as Record<string, string>)['x-forwarded-for']
          : 'unknown';
        const userAgent = (req?.headers && typeof req.headers === 'object' && 'user-agent' in req.headers)
          ? (req.headers as Record<string, string>)['user-agent']
          : 'unknown';

        await runWriteQuery(
          `CREATE (la:LoginActivity {
            id: randomUUID(),
            userId: $userId,
            ip: $ip,
            userAgent: $userAgent,
            createdAt: datetime()
          })`,
          { userId: result.u.id, ip: ip || 'unknown', userAgent: userAgent || 'unknown' }
        );

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
