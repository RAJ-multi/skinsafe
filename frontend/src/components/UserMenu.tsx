"use client";

/**
 * UserMenu — displays Google Auth state in the SkinSafe Navbar.
 * - When configured: shows visible "Sign in with Google" button or user avatar/profile dropdown.
 * - When unconfigured: shows configuration status button with setup guidance rather than silently disappearing.
 * Matches SkinSafe emerald & clinical aesthetic.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const UserMenu: React.FC = () => {
  const { user, isLoading, authError, isConfigured, signInWithGoogle, signOut } =
    useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 border border-slate-200/80 bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
        <span className="hidden sm:inline">Checking auth…</span>
      </div>
    );
  }

  // 2. Unconfigured State: Show informative status pill rather than hiding silently
  if (!isConfigured) {
    return (
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center space-x-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="Google Auth is not configured"
        >
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <span className="hidden sm:inline">Google Auth (Unconfigured)</span>
          <span className="sm:hidden">Auth</span>
          <HelpCircle className="h-3 w-3 text-amber-500 hidden sm:inline" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-amber-200/90 shadow-xl shadow-slate-900/10 p-3.5 z-50 animate-fadeIn text-left">
            <div className="flex items-start space-x-2.5 mb-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Supabase Auth Setup Required
                </p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  To enable Google sign-in, configure your Supabase variables in:
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1">
              <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Located in <code className="text-emerald-700">frontend/.env.local</code>. Core chemistry analysis remains accessible without signing in.
            </p>
          </div>
        )}
      </div>
    );
  }

  // 3. Configured but not logged in: Show prominent Google sign-in button
  if (!user) {
    const handleSignIn = async () => {
      setIsRedirecting(true);
      try {
        await signInWithGoogle();
      } finally {
        setIsRedirecting(false);
      }
    };

    return (
      <div className="flex flex-col items-end">
        <button
          onClick={handleSignIn}
          disabled={isRedirecting}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50/90 border border-slate-300 hover:border-emerald-500 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer hover:shadow-xs disabled:opacity-50"
        >
          {isRedirecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign in with Google</span>
        </button>
        {authError && (
          <p
            className="text-[10px] text-rose-500 mt-1 max-w-[200px] text-right truncate"
            title={authError}
          >
            {authError}
          </p>
        )}
      </div>
    );
  }

  // 4. Logged in state
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "User";
  const email = user.email ?? "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 text-xs font-medium text-slate-700 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-6 w-6 rounded-full object-cover ring-2 ring-emerald-200"
          />
        ) : (
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[9px] font-bold">
            {initials}
          </span>
        )}
        <span className="hidden sm:inline max-w-[110px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200/80 shadow-lg shadow-slate-200/60 z-50 overflow-hidden animate-fadeIn text-left">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-200"
                />
              ) : (
                <span className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{email}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 flex items-center space-x-2 text-xs text-slate-600 bg-slate-50/50">
            <UserIcon className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px]">Authenticated via Google</span>
          </div>

          <div className="border-t border-slate-100">
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
