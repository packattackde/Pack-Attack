import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import TwitchProvider from 'next-auth/providers/twitch';
import DiscordProvider from 'next-auth/providers/discord';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma, withRetry } from './prisma';

// ─────────────────────────────────────────────────────────────────────────────
// Custom Adapter
//
// NextAuth's PrismaAdapter assumes emailVerified is DateTime? (null | Date).
// Our schema uses Boolean instead. We override createUser and updateUser
// to translate the value correctly so Twitch OAuth can create/find users.
// ─────────────────────────────────────────────────────────────────────────────
function buildAdapter(): Adapter {
  const base = PrismaAdapter(prisma) as Adapter;

  return {
    ...base,

    // Called when a brand-new OAuth user signs up (no existing account found).
    // NextAuth passes emailVerified as a Date or null; we convert to boolean.
    createUser: async (data: any) => {
      const { emailVerified, id, ...rest } = data;
      const user = await prisma.user.create({
        data: {
          ...rest,
          // Treat any truthy emailVerified (Date) from OAuth as verified=true
          emailVerified: emailVerified ? true : false,
          passwordHash: null,
        },
      });
      // NextAuth expects emailVerified back as Date | null
      return { ...user, emailVerified: user.emailVerified ? new Date() : null };
    },

    // Called occasionally to update user data (e.g. refresh token rotation).
    updateUser: async (data: any) => {
      const { emailVerified, id, ...rest } = data;
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...rest,
          ...(emailVerified !== undefined
              ? { emailVerified: emailVerified ? true : false }
              : {}),
        },
      });
      return { ...user, emailVerified: user.emailVerified ? new Date() : null };
    },

    // Called when looking up a user – normalize emailVerified back to Date|null
    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return { ...user, emailVerified: user.emailVerified ? new Date() : null };
    },

    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return { ...user, emailVerified: user.emailVerified ? new Date() : null };
    },

    getUserByAccount: async ({ provider, providerAccountId }) => {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      if (!account) return null;
      const { user } = account;
      return { ...user, emailVerified: user.emailVerified ? new Date() : null };
    },
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: buildAdapter(),

  providers: (() => {
    const providers: NextAuthOptions['providers'] = [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;

          const user = await withRetry(
              () => prisma.user.findUnique({ where: { email: credentials.email } }),
              'auth:findUser'
          );

          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;

          if (!user.emailVerified) {
            console.warn(`[Auth] Login attempt with unverified email: ${user.email}`);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            twitchUsername: user.twitchUsername,
            discordUsername: user.discordUsername,
          };
        },
      }),
    ];

    if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
      console.info('[Auth] Twitch provider enabled');
      providers.push(
        TwitchProvider({
          clientId: process.env.TWITCH_CLIENT_ID,
          clientSecret: process.env.TWITCH_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      );
    } else {
      console.warn('[Auth] Twitch provider DISABLED — missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET');
    }

    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
      console.info('[Auth] Discord provider enabled');
      providers.push(
        DiscordProvider({
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          authorization: { params: { scope: 'identify email' } },
          allowDangerousEmailAccountLinking: true,
        }),
      );
    } else {
      console.warn('[Auth] Discord provider DISABLED — missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET');
    }

    return providers;
  })(),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name:
          process.env.NODE_ENV === 'production'
              ? '__Secure-next-auth.session-token'
              : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    // ─────────────────────────────────────────────────────────────────────
    // signIn callback
    //
    // CASE A – Connect flow (logged-in user adds Twitch):
    //   /api/user/connections/twitch/prepare sets cookie `twitch_link_uid`.
    //   We read it here (with await), create the Account row manually and
    //   return a redirect URL → existing JWT session is preserved.
    //
    // CASE B – Login/Register flow:
    //   Normal Twitch OAuth. If the email matches an existing credentials-
    //   user we auto-merge to avoid duplicate accounts.
    // ─────────────────────────────────────────────────────────────────────
    async signIn({ user, account, profile }) {
      console.info(`[Auth:signIn] provider=${account?.provider ?? 'unknown'} userId=${user?.id ?? 'new'} email=${user?.email ?? 'none'}`);

      // ── DISCORD ─────────────────────────────────────────────────────────────
      if (account?.provider === 'discord') {
        const discordProfile = profile as any;
        const discordUsername = discordProfile?.global_name || discordProfile?.username || null;
        const discordImage = discordProfile?.image_url ||
            (discordProfile?.avatar
                ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
                : null);

        // Check for connect-flow cookie first
        let connectUserId: string | null = null;
        try {
          const cookieStore = await cookies();
          connectUserId = cookieStore.get('discord_link_uid')?.value ?? null;
        } catch { /* ignore */ }

        if (connectUserId) {
          console.info(`[Auth:signIn] Discord connect-flow for userId=${connectUserId}`);
          try {
            const cookieStore = await cookies();
            cookieStore.delete('discord_link_uid');
          } catch { /* ignore */ }

          const targetUser = await prisma.user.findUnique({
            where: { id: connectUserId },
            include: { accounts: true },
          });
          if (!targetUser) {
            console.error(`[Auth:signIn] Discord connect-flow: user ${connectUserId} not found`);
            return '/dashboard?tab=connections&error=user_not_found';
          }

          const existingBinding = await prisma.account.findUnique({
            where: { provider_providerAccountId: { provider: 'discord', providerAccountId: account.providerAccountId } },
          });
          if (existingBinding && existingBinding.userId !== targetUser.id) {
            console.warn(`[Auth:signIn] Discord account ${account.providerAccountId} already bound to different user`);
            return '/dashboard?tab=connections&error=discord_already_used';
          }
          if (!existingBinding) {
            await prisma.account.create({
              data: {
                userId: targetUser.id,
                type: account.type,
                provider: 'discord',
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
              },
            });
            await prisma.user.update({
              where: { id: targetUser.id },
              data: {
                discordUsername,
                ...(discordImage && !targetUser.image ? { image: discordImage } : {}),
              },
            });
            console.info(`[Auth:signIn] Discord linked to user ${targetUser.id}`);
          }
          return '/dashboard?tab=connections&success=discord_connected';
        }

        // ── Case B: Normal login / auto-merge ──
        // allowDangerousEmailAccountLinking on the provider lets NextAuth handle
        // account creation/linking automatically. We only need to persist the
        // Discord-specific fields that NextAuth doesn't know about.
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (existingUser) {
            try {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  discordUsername,
                  ...(discordImage && !existingUser.image ? { image: discordImage } : {}),
                },
              });
            } catch (err) {
              console.error('[Auth] Discord: failed to update discordUsername', err);
            }
          }
        }
        return true;
      }

      if (account?.provider !== 'twitch') return true;

      const twitchProfile = profile as any;
      const twitchUsername =
          twitchProfile?.preferred_username ||
          twitchProfile?.login ||
          twitchProfile?.display_name ||
          null;
      const twitchImage =
          twitchProfile?.picture || twitchProfile?.profile_image_url || null;

      // ── CASE A: Connect flow ─────────────────────────────────────────────
      let connectUserId: string | null = null;
      try {
        const cookieStore = await cookies();
        connectUserId = cookieStore.get('twitch_link_uid')?.value ?? null;
      } catch {
        // Fallback for environments where cookies() isn't available here
      }

      if (connectUserId) {
        console.info(`[Auth:signIn] Twitch connect-flow for userId=${connectUserId}`);
        try {
          const cookieStore = await cookies();
          cookieStore.set('twitch_link_uid', '', { maxAge: 0, path: '/' });
        } catch { /* ignore */ }

        const targetUser = await prisma.user.findUnique({
          where: { id: connectUserId },
          include: { accounts: true },
        });

        if (!targetUser) {
          console.error(`[Auth:signIn] Twitch connect-flow: user ${connectUserId} not found`);
          return `/dashboard?tab=connections&error=user_not_found`;
        }

        const existingBinding = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (existingBinding && existingBinding.userId !== targetUser.id) {
          console.warn(`[Auth:signIn] Twitch account ${account.providerAccountId} already bound to different user`);
          return `/dashboard?tab=connections&error=${account.provider}_already_used`;
        }

        if (!existingBinding) {
          await prisma.account.create({
            data: {
              userId: targetUser.id,
              type: account.type,
              provider: 'twitch',
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
            },
          });

          await prisma.user.update({
            where: { id: targetUser.id },
            data: {
              twitchUsername,
              ...(twitchImage && !targetUser.image ? { image: twitchImage } : {}),
            },
          });
          console.info(`[Auth:signIn] Twitch linked to user ${targetUser.id}`);
        }

        return '/dashboard?tab=connections&success=twitch_connected';
      }

      // ── CASE B: Normal login / auto-merge ────────────────────────────────
      // allowDangerousEmailAccountLinking on the provider lets NextAuth handle
      // account creation/linking automatically. We only need to persist the
      // Twitch-specific fields that NextAuth doesn't know about.
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existingUser) {
          try {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                twitchUsername,
                ...(twitchImage && !existingUser.image ? { image: twitchImage } : {}),
              },
            });
          } catch (err) {
            console.error('[Auth] Twitch: failed to update twitchUsername', err);
          }
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, account, profile }) {
      if (user) {
        console.info(`[Auth:jwt] Creating token for user=${user.id} provider=${account?.provider ?? 'credentials'}`);
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.iat = Math.floor(Date.now() / 1000);
        token.jti = crypto.randomUUID();
        token.image = (user as any).image || null;
        token.twitchUsername = (user as any).twitchUsername || null;
        token.discordUsername = (user as any).discordUsername || null;
      }

      if (account?.provider === 'discord' && profile) {
        const p = profile as any;
        const discordUsername = p.global_name || p.username || null;
        const discordImage = p.image_url ||
            (p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : null);

        token.discordUsername = discordUsername;
        token.image = token.image || discordImage;
        token.role = token.role || 'USER';

        if (token.id) {
          try {
            await prisma.user.update({
              where: { id: token.id as string },
              data: {
                discordUsername,
                ...(discordImage ? { image: discordImage } : {}),
              },
            });
          } catch (err) {
            console.error('[Auth] Failed to update Discord user info:', err);
          }
        }
      }

      if (account?.provider === 'twitch' && profile) {
        const p = profile as any;
        const twitchUsername =
            p.preferred_username || p.login || p.display_name || null;
        const twitchImage = p.picture || p.profile_image_url || null;

        token.twitchUsername = twitchUsername;
        token.image = twitchImage;
        token.role = token.role || 'USER';

        if (token.id) {
          try {
            await prisma.user.update({
              where: { id: token.id as string },
              data: { twitchUsername, image: twitchImage },
            });
          } catch (err) {
            console.error('[Auth] Failed to update Twitch user info:', err);
          }
        }
      }

      if (trigger === 'update') {
        token.iat = Math.floor(Date.now() / 1000);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string | null;
        session.user.twitchUsername = token.twitchUsername as string | null;
        session.user.discordUsername = token.discordUsername as string | null;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      console.info(`[Auth:event:signIn] user=${user?.id} provider=${account?.provider ?? 'credentials'}`);
    },
    async signOut({ token }) {
      console.info(`[Auth:event:signOut] user=${(token as any)?.id ?? 'unknown'}`);
    },
    async linkAccount({ user, account }) {
      console.info(`[Auth:event:linkAccount] user=${user.id} provider=${account.provider}`);
    },
  },

  logger: {
    error(code, metadata) {
      console.error(`[Auth:error] code=${code}`, metadata);
    },
    warn(code) {
      console.warn(`[Auth:warn] code=${code}`);
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};

export async function getCurrentSession() {
  const { getServerSession } = await import('next-auth/next');
  return getServerSession(authOptions);
}