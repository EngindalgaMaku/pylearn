import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { pbkdf2Sync } from "crypto";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        usernameOrEmail: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usernameOrEmail || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.usernameOrEmail },
              { email: credentials.usernameOrEmail },
            ],
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        let isPasswordValid = false;

        // Support both bcrypt and crypto (hash:salt) formats for compatibility
        if (user.passwordHash.includes(":")) {
          const [hash, salt] = user.passwordHash.split(":");
          const computedHash = pbkdf2Sync(
            credentials.password,
            salt,
            1000,
            64,
            "sha512"
          ).toString("hex");
          isPasswordValid = computedHash === hash;
        } else {
          isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
        }

        if (!isPasswordValid || !user.isActive) {
          return null;
        }

        // Update streaks and last login
        const now = new Date();
        const lastLogin = user.lastLoginDate;
        let newLoginStreak = user.loginStreak;

        if (lastLogin) {
          const daysDiff = Math.floor(
            (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 1) newLoginStreak += 1;
          else if (daysDiff > 1) newLoginStreak = 1;
        } else {
          newLoginStreak = 1;
        }
        const newMaxStreak = Math.max(user.maxLoginStreak, newLoginStreak);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginDate: now,
            loginStreak: newLoginStreak,
            maxLoginStreak: newMaxStreak,
          },
        });

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          level: user.level,
          experience: user.experience,
          currentDiamonds: user.currentDiamonds,
          totalDiamonds: user.totalDiamonds,
          loginStreak: newLoginStreak,
          maxLoginStreak: newMaxStreak,
          isPremium: user.isPremium,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Link or create user by email
          const existing = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true },
          });

          if (existing) {
            const linked = existing.accounts.find(
              (acc) =>
                acc.provider === "google" &&
                acc.providerAccountId === account.providerAccountId
            );
            if (!linked) {
              await prisma.account.create({
                data: {
                  userId: existing.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            }
            return true;
          } else {
            // Create new user with unique username
            const base = user.email!.split("@")[0];
            let username = base;
            let counter = 1;
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${base}_${counter++}`;
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                username,
                currentDiamonds: 100,
                totalDiamonds: 100,
                loginStreak: 1,
                maxLoginStreak: 1,
                lastLoginDate: new Date(),
                isActive: true,
                role: "user",
                level: 1,
                experience: 0,
                isPremium: false,
              },
            });

            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });

            return true;
          }
        } catch (e) {
          console.error("Google sign-in error:", e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.username = dbUser.username;
              token.role = dbUser.role;
              token.level = dbUser.level;
              token.experience = dbUser.experience;
              token.currentDiamonds = dbUser.currentDiamonds;
              token.totalDiamonds = dbUser.totalDiamonds;
              token.loginStreak = dbUser.loginStreak;
              token.maxLoginStreak = dbUser.maxLoginStreak;
              token.isPremium = dbUser.isPremium;
            }
          } catch (e) {
            console.error("JWT callback DB error:", e);
          }
        } else {
          // Credentials user fields already set in authorize
          token.id = (user as any).id;
          token.username = (user as any).username;
          token.role = (user as any).role;
          token.level = (user as any).level;
          token.experience = (user as any).experience;
          token.currentDiamonds = (user as any).currentDiamonds;
          token.totalDiamonds = (user as any).totalDiamonds;
          token.loginStreak = (user as any).loginStreak;
          token.maxLoginStreak = (user as any).maxLoginStreak;
          token.isPremium = (user as any).isPremium;
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          (session.user as any) = {
            ...session.user,
            id: token.id as string,
            username:
              (token.username as string) ||
              session.user.email?.split("@")[0] ||
              "User",
            role: (token.role as string) || "user",
            level: (token.level as number) || 1,
            experience: (token.experience as number) || 0,
            currentDiamonds: (token.currentDiamonds as number) || 100,
            totalDiamonds: (token.totalDiamonds as number) || 100,
            loginStreak: (token.loginStreak as number) || 1,
            maxLoginStreak: (token.maxLoginStreak as number) || 1,
            isPremium: (token.isPremium as boolean) || false,
          };
        }
        return session;
      } catch (e) {
        console.error("Session callback error:", e);
        return session;
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
        maxAge: 7 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Helper for server-side API auth checks
export async function verifyAuth(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated", user: null };
    }
    return {
      success: true,
      user: {
        id: (session.user as any).id,
        username: (session.user as any).username,
        email: session.user.email,
        role: (session.user as any).role,
        level: (session.user as any).level,
        experience: (session.user as any).experience,
        currentDiamonds: (session.user as any).currentDiamonds,
        totalDiamonds: (session.user as any).totalDiamonds,
        loginStreak: (session.user as any).loginStreak,
        maxLoginStreak: (session.user as any).maxLoginStreak,
        isPremium: (session.user as any).isPremium,
      },
    };
  } catch (e) {
    console.error("Auth verification error:", e);
    return { success: false, error: "Authentication failed", user: null };
  }
}