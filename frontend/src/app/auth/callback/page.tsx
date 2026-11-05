"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processAuth() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.replace("/?auth_error=supabase_not_configured");
        return;
      }

      // Check for error parameters returned from OAuth provider
      const errorDescription =
        searchParams.get("error_description") ||
        searchParams.get("error") ||
        null;

      if (errorDescription) {
        setError(errorDescription);
        setTimeout(() => {
          router.replace(
            `/?auth_error=${encodeURIComponent(errorDescription)}`
          );
        }, 2000);
        return;
      }

      // If PKCE code is present, exchange it for a session
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setTimeout(() => {
            router.replace(
              `/?auth_error=${encodeURIComponent(exchangeError.message)}`
            );
          }, 2500);
          return;
        }
      }

      // Redirect back to home page with active session
      router.replace("/");
    }

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-sm w-full shadow-lg shadow-slate-900/5 text-center space-y-4">
      {error ? (
        <>
          <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">
              Authentication Notice
            </h2>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
          <p className="text-[11px] text-slate-400">Redirecting to SkinSafe…</p>
        </>
      ) : (
        <>
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">
              Completing Google Sign-in
            </h2>
            <p className="text-xs text-slate-500">
              Finalizing your SkinSafe session, please wait…
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-sm w-full shadow-lg shadow-slate-900/5 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-800">Loading</h2>
              <p className="text-xs text-slate-500">Preparing authentication…</p>
            </div>
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
