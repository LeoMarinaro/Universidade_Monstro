import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// The one place pages read the logged-in user from (Data Access Layer).
// It reads the request, so with Cache Components the caller must sit behind
// a <Suspense> boundary. Returns only what pages need, never the raw session.
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  // A deleted account ("Conta deletada") counts as logged out
  if (!session || session.user.deletedAt) {
    redirect("/entrar");
  }

  const { id, name, email, image, isSuperAdmin } = session.user;
  return { id, name, email, image, isSuperAdmin: isSuperAdmin ?? false };
}
