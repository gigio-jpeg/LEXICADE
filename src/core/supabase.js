import { config, path, supabaseConfigured } from "./config.js";
let promise;
export async function getClient() {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured");
  promise ??= import(path("vendor/supabase-2.57.4.js")).then(
    ({ createClient }) =>
      createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
  );
  return promise;
}
