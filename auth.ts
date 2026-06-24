import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

import { accounts, sessions, users, verificationTokens } from './db/schema';
import { getAuthRuntimeConfig } from './lib/server/auth/provider-config';
import { db } from './db';

const authRuntimeConfig = getAuthRuntimeConfig();
const providers: Provider[] = authRuntimeConfig.providers.map((provider) =>
  provider.name === 'facebook'
    ? Facebook({ clientId: provider.clientId, clientSecret: provider.clientSecret })
    : Google({ clientId: provider.clientId, clientSecret: provider.clientSecret }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authRuntimeConfig.authSecret,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
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
