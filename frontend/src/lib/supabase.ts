/**
 * SkinSafe Supabase browser client singleton.
 * Uses only public NEXT_PUBLIC_* variables.
 * Safe for client-side execution.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string | null;
  reason?: string;
}

/**
 * Normalizes and validates the Supabase URL and anonymous key.
 * Automatically handles common user misconfigurations like:
 * - Swapped URL and Key in .env.local
 * - Trailing /rest/v1 or /rest/v1/ in URL
 * - Trailing slashes
 * - Placeholder values
 */
export function getNormalizedCredentials(): { url: string; key: string } | null {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  let key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!url || !key) {
    return null;
  }

  // Auto-detect and swap if user placed publishable/anon key in URL field
  // and the URL in the key field
  const isUrlInKey = key.startsWith("http://") || key.startsWith("https://");
  const isKeyInUrl = !url.startsWith("http://") && !url.startsWith("https://");

  if (isKeyInUrl && isUrlInKey) {
    const temp = url;
    url = key;
    key = temp;
  }

  // Strip trailing REST endpoints or slashes from Supabase project URL
  url = url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  // Check if credentials are placeholders
  if (
    url.includes("placeholder") ||
    url.includes("YOUR_SUPABASE") ||
    key.includes("placeholder") ||
    key.includes("YOUR_SUPABASE") ||
    url === "undefined" ||
    key === "undefined"
  ) {
    return null;
  }

  // Final sanity check for valid HTTP/HTTPS URL
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return null;
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getNormalizedCredentials() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const credentials = getNormalizedCredentials();
  if (!credentials) return null;

  try {
    _client = createClient(credentials.url, credentials.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error("[SkinSafe] Could not initialize Supabase client:", err);
    return null;
  }

  return _client;
}
