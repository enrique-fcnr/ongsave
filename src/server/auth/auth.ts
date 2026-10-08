import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "../db/client";
import { account, session, user, verification } from "../db/schema";

export type AuthOptions = {
  secret: string;
  baseURL: string;
  trustedOrigins?: string[];
  signInsPerMinute?: number;
};

// One Better Auth instance per D1 binding. Sign-up is disabled: accounts are provisioned
// by the server (scripts/create-demo-users.ts), never by the browser.
export function createAuth(
  db: Db,
  { secret, baseURL, trustedOrigins = [], signInsPerMinute = 10 }: AuthOptions,
) {
  return betterAuth({
    secret,
    baseURL,
    trustedOrigins: [baseURL, ...trustedOrigins],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 6,
    },
    // Default is 3 sign-ins per 10 s per IP, which blocks three demo sessions on one network.
    rateLimit: { customRules: { "/sign-in/email": { window: 60, max: signInsPerMinute } } },
    advanced: {
      useSecureCookies: baseURL.startsWith("https://"),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: baseURL.startsWith("https://"),
      },
    },
  });
}
export type Auth = ReturnType<typeof createAuth>;
