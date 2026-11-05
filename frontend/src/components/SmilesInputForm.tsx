"use client";

import React, { useState } from "react";
import { Search, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ApiErrorDetail } from "@/lib/types";

interface PresetSample {
  name: string;
  role: string;
  smiles: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  { name: "Niacinamide (Vitamin B3)", role: "Barrier repair & sebum control", smiles: "NC(=O)c1cccnc1" },
  { name: "Salicylic Acid", role: "Beta hydroxy acid exfoliant", smiles: "Oc1ccccc1C(=O)O" },
  { name: "Glycerin", role: "Classic humectant moisturizing agent", smiles: "OCC(O)CO" },
  { name: "Caffeine", role: "Topical antioxidant & alkaloid", smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C" },
  { name: "Ascorbic Acid (Vitamin C)", role: "Potent antioxidant active", smiles: "OCC(O)C1OC(=O)C(O)=C1O" },
];

interface SmilesInputFormProps {
  onAnalyze: (smiles: string) => Promise<void>;
  isLoading: boolean;
  error: ApiErrorDetail | null;
  onClearError: () => void;
}

export const SmilesInputForm: React.FC<SmilesInputFormProps> = ({
  onAnalyze,
  isLoading,
  error,
  onClearError,
}) => {
  const [smiles, setSmiles] = useState<string>("NC(=O)c1cccnc1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smiles.trim()) {
      onAnalyze(smiles.trim());
    }
  };

  const handleSelectPreset = (presetSmiles: string) => {
    setSmiles(presetSmiles);
    onClearError();
    onAnalyze(presetSmiles);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all">
      <div className="mb-4">
        <label htmlFor="smiles-input" className="block text-sm font-semibold text-slate-800 mb-1">
          Input Molecular SMILES
        </label>
        <p className="text-xs text-slate-500">
          Enter a valid chemical SMILES string to compute molecular descriptors and skin permeability.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            id="smiles-input"
            type="text"
            value={smiles}
            onChange={(e) => {
              setSmiles(e.target.value);
              if (error) onClearError();
            }}
            placeholder="e.g. NC(=O)c1cccnc1"
            className="w-full font-mono text-sm px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all pr-28"
          />
          <button
            type="submit"
            disabled={isLoading || !smiles.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Calculate</span>
              </>
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">{error.error_type}</span>
              <p className="mt-0.5">{error.message}</p>
            </div>
          </div>
        )}

        {/* Quick sample buttons */}
        <div className="pt-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium">Test Cosmetic Actives:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_SAMPLES.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectPreset(sample.smiles)}
                className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                title={`${sample.name}: ${sample.role}`}
              >
                <span className="font-medium">{sample.name.split(" ")[0]}</span>
                <span className="text-[10px] text-slate-400">({sample.role.split(" ")[0]})</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

