import { createLocalClient } from "../local-db/engine";

const USE_SUPABASE = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function createAdminClient() {
  if (USE_SUPABASE) {
    const { createClient } = require("@supabase/supabase-js");
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return createLocalClient();
}
