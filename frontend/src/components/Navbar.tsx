"use client";

import React from "react";
import { FlaskConical, BookOpen, Layers, Atom } from "lucide-react";
import { HealthStatus } from "@/lib/types";
import { UserMenu } from "@/components/UserMenu";

interface NavbarProps {
  healthStatus: HealthStatus | null;
  onOpenMethodology: () => void;
  activeTab: "single" | "compare";
  onTabChange: (tab: "single" | "compare") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  healthStatus,
  onOpenMethodology,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="border-b border-emerald-100/80 bg-white/90 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-800">
                Skin<span className="text-emerald-600">Safe</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                v1.0 Chemistry
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Computational Cosmetic Ingredient & Skin Permeability Platform
            </p>
          </div>
        </div>

        {/* Center Workspace Mode Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => onTabChange("single")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "single"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Atom className="h-3.5 w-3.5 text-emerald-600" />
            <span>Single Molecule</span>
          </button>
          <button
            onClick={() => onTabChange("compare")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "compare"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            <span>Comparison Lab</span>
          </button>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-3">
          {/* Backend Status indicator */}
          <div className="flex items-center space-x-2 text-xs border border-slate-200/80 bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600">
            <span
              className={`h-2 w-2 rounded-full ${
                healthStatus?.engine_ready
                  ? "bg-emerald-500 animate-pulse"
                  : healthStatus?.status === "offline"
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="font-medium hidden sm:inline">
              {healthStatus?.engine_ready
                ? `RDKit Ready (${healthStatus.rdkit_version || "online"})`
                : healthStatus?.status === "offline"
                ? "Backend Offline"
                : "Connecting..."}
            </span>
          </div>

          {/* Scientific Methodology Button */}
          <button
            onClick={onOpenMethodology}
            className="flex items-center space-x-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Scientific Methodology</span>
          </button>

          {/* User auth menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

