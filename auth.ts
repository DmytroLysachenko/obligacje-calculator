import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

import { accounts, sessions, users, verificationTokens } from './db/schema';
import { getAuthRuntimeConfig } from './lib/server/auth/provider-config';
import { getDatabaseUrl } from './lib/server/runtime/env';
import { db } from './db';

const authRuntimeConfig = getAuthRuntimeConfig();
const providers: Provider[] = authRuntimeConfig.providers.map((provider) =>
  provider.name === 'facebook'
    ? Facebook({ clientId: provider.clientId, clientSecret: provider.clientSecret })
    : Google({ clientId: provider.clientId, clientSecret: provider.clientSecret }),
);
const adapter = getDatabaseUrl()
  ? DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  : undefined;

export const { handlers, auth, signIn } = NextAuth({
  secret: authRuntimeConfig.authSecret,
  adapter,
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
