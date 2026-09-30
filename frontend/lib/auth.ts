import { createClient } from "@/lib/supabase/server";

// Any signed-in Supabase user is treated as an admin, so public sign-ups
// must stay disabled in the Supabase project (Auth > Providers > Email).
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized. Please log in as admin.");
    this.name = "UnauthorizedError";
  }
}
