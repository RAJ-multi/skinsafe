"use client";

import React, { useState } from "react";
import { Copy, Check, Atom } from "lucide-react";

interface MolecularDepictionProps {
  svgContent: string | null;
  formula: string;
  canonicalSmiles: string;
  inputSmiles: string;
}

export const MolecularDepiction: React.FC<MolecularDepictionProps> = ({
  svgContent,
  formula,
  canonicalSmiles,
  inputSmiles,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalSmiles);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Atom className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-800">Chemical Structure</h3>
        </div>
        <div className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md text-xs font-mono font-bold tracking-wide">
          {formula}
        </div>
      </div>

      {/* SVG Container */}
      <div className="flex-1 flex items-center justify-center min-h-[180px] py-2 bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
        {svgContent ? (
          <div
            className="w-full flex justify-center [&>svg]:max-h-[170px] [&>svg]:w-auto [&>svg]:drop-shadow-xs"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-xs text-slate-400 italic">2D structure representation unavailable</div>
        )}
      </div>

      {/* Canonical SMILES bar */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="truncate mr-2">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Canonical SMILES</span>
          <span className="font-mono text-slate-700 truncate block text-xs" title={canonicalSmiles}>
            {canonicalSmiles}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
          title="Copy Canonical SMILES"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

