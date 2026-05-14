import { createLocalProxy } from "../local-db/proxy";

const USE_SUPABASE = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function createClient() {
  if (USE_SUPABASE) {
    const { createBrowserClient } = require("@supabase/ssr");
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return createLocalProxy();
}
