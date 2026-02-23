import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/utils/supabase/server";

// Base client for public actions (login, signup, signInWithGoogle)
// No console logging -- errors propagated via return values only (Phase 1 decision)
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    return e.message;
  },
});

// Auth client for protected actions -- automatically checks auth
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return next({
    ctx: { user, supabase },
  });
});
