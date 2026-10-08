import { createAuthClient } from "better-auth/react";

// Same-origin client: /api/auth/* on the app's own host.
export const authClient = createAuthClient();
