import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

// Browser side of Better Auth: used by client components (login form, sign out button).
// Same origin as the site, so no baseURL is needed.
export const authClient = createAuthClient({
  // Gives the client the types of our extra user fields (phone, isSuperAdmin…)
  plugins: [inferAdditionalFields<typeof auth>()],
});
