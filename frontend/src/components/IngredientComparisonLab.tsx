"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  GitCompare,
  Loader2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Droplet,
  Binary,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import {
  CompareCompoundItem,
  CompareCompoundsResponse,
  ComparedCompoundResult,
  ApiErrorDetail,
} from "@/lib/types";
import { compareCompounds, ApiError, API_BASE_URL } from "@/lib/api";

interface PresetComparison {
  title: string;
  subtitle: string;
  compounds: CompareCompoundItem[];
}

const PRESET_COMPARISONS: PresetComparison[] = [
  {
    title: "Barrier Repair vs. BHA Exfoliant",
    subtitle: "Niacinamide (Vitamin B3) vs. Salicylic Acid",
    compounds: [
      { name: "Niacinamide", smiles: "NC(=O)c1cccnc1" },
      { name: "Salicylic Acid", smiles: "Oc1ccccc1C(=O)O" },
    ],
  },
  {
    title: "Hydration & Penetration Trio",
    subtitle: "Glycerin vs. Propylene Glycol vs. Ascorbic Acid (Vit C)",
    compounds: [
      { name: "Glycerin", smiles: "OCC(O)CO" },
      { name: "Propylene Glycol", smiles: "CC(O)CO" },
      { name: "Ascorbic Acid", smiles: "OCC(O)C1OC(=O)C(O)=C1O" },
    ],
  },
  {
    title: "Topical Alkaloid vs. Phenolic",
    subtitle: "Caffeine vs. Resveratrol",
    compounds: [
      { name: "Caffeine", smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C" },
      { name: "Resveratrol", smiles: "Oc1ccc(/C=C/c2cc(O)cc(O)c2)cc1" },
    ],
  },
];

interface IngredientComparisonLabProps {
  onBackToSingle: () => void;
  onResultsChange?: (results: CompareCompoundsResponse | null) => void;
}

export const IngredientComparisonLab: React.FC<IngredientComparisonLabProps> = ({
  onBackToSingle,
  onResultsChange,
}) => {
  const [compounds, setCompounds] = useState<CompareCompoundItem[]>([
    { name: "Niacinamide", smiles: "NC(=O)c1cccnc1" },
    { name: "Salicylic Acid", smiles: "Oc1ccccc1C(=O)O" },
  ]);
  const [results, setResults] = useState<ComparedCompoundResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiErrorDetail | null>(null);

  const handleCompoundChange = (
    index: number,
    field: "name" | "smiles",
    value: string
  ) => {
    const updated = [...compounds];
    updated[index] = { ...updated[index], [field]: value };
    setCompounds(updated);
    if (error) setError(null);
  };

  const handleAddCompound = () => {
    if (compounds.length < 8) {
      setCompounds([...compounds, { name: "", smiles: "" }]);
    }
  };

  const handleRemoveCompound = (index: number) => {
    if (compounds.length > 2) {
      const updated = compounds.filter((_, i) => i !== index);
      setCompounds(updated);
      if (error) setError(null);
    }
  };

  const handleApplyPreset = (preset: PresetComparison) => {
    setCompounds(preset.compounds);
    setError(null);
    executeComparison(preset.compounds);
  };

  const handleClear = () => {
    setCompounds([
      { name: "", smiles: "" },
      { name: "", smiles: "" },
    ]);
    setResults(null);
    setError(null);
    onResultsChange?.(null);
  };

  const executeComparison = async (itemsToCompare: CompareCompoundItem[]) => {
    // Basic frontend validation
    const emptySmilesIdx = itemsToCompare.findIndex((c) => !c.smiles.trim());
    if (emptySmilesIdx !== -1) {
      setError({
        error_type: "ValidationError",
        message: `Compound #${emptySmilesIdx + 1} (${itemsToCompare[emptySmilesIdx].name || "Unnamed"}) has an empty SMILES string. Please provide a valid chemical structure.`,
      });
      return;
    }

    if (itemsToCompare.length < 2) {
      setError({
        error_type: "ValidationError",
        message: "Ingredient comparison requires at least 2 chemical compounds.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await compareCompounds(itemsToCompare);
      setResults(response.compounds);
      onResultsChange?.(response);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError({
          error_type: "ConnectionError",
          message: `Could not connect to the backend analysis engine at ${API_BASE_URL}. Please verify that the API server is online and accessible.`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeComparison(compounds);
  };

  const getPermeabilityBadge = (classification: string) => {
    switch (classification) {
      case "High":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Moderate":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Low":
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation breadcrumb & title banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200/80 gap-3">
        <div>
          <button
            onClick={onBackToSingle}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Single Molecule Analysis</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Ingredient Comparison Lab</span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              Comparative QSPR
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate and contrast multiple cosmetic actives, physicochemical descriptors, drug-likeness rules, and transdermal diffusion side by side.
          </p>
        </div>

        {/* Preset selector */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
          {PRESET_COMPARISONS.map((preset) => (
            <button
              key={preset.title}
              onClick={() => handleApplyPreset(preset)}
              className="text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
            >
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>{preset.title.split(":")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Panel */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCompare className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Compounds to Compare ({compounds.length})
            </h3>
          </div>
          <button
            onClick={handleClear}
            className="text-xs font-medium text-slate-400 hover:text-rose-600 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Inputs</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {compounds.map((comp, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  #{idx + 1}
                </div>
                <div className="w-full sm:w-44 shrink-0">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) =>
                      handleCompoundChange(idx, "name", e.target.value)
                    }
                    placeholder={`e.g. Compound ${idx + 1}`}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 font-medium"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={comp.smiles}
                    onChange={(e) =>
                      handleCompoundChange(idx, "smiles", e.target.value)
                    }
                    placeholder="SMILES representation (e.g. NC(=O)c1cccnc1)"
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCompound(idx)}
                  disabled={compounds.length <= 2}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  title="Remove Compound"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Validation / API Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">{error.error_type}</span>
                <p className="mt-0.5">{error.message}</p>
              </div>
            </div>
          )}

          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
            <button
              type="button"
              onClick={handleAddCompound}
              disabled={compounds.length >= 8}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Add Compound ({compounds.length}/8)</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Computing Calculations...</span>
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4" />
                  <span>Run Ingredient Comparison</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results Table */}
      {results && results.length >= 2 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden animate-fadeIn">
          {/* Table Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Comparative Molecular Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic RDKit descriptors, Potts–Guy permeability predictions, and drug-likeness rules.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200">
              {results.length} Compounds Analyzed
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 w-56 font-bold text-slate-700 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200/80 shadow-2xs">
                    Chemical Attribute
                  </th>
                  {results.map((c, i) => (
                    <th
                      key={i}
                      className="p-4 min-w-[220px] font-bold text-slate-800 align-top border-r border-slate-100 last:border-r-0"
                    >
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold block text-emerald-800">
                          {c.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block truncate" title={c.canonical_smiles}>
                          {c.canonical_smiles}
                        </span>
                        {/* 2D Chemical SVG Thumbnail */}
                        {c.svg_depiction && (
                          <div
                            className="bg-white p-1 rounded-lg border border-slate-200/80 my-1 max-h-24 flex items-center justify-center overflow-hidden [&>svg]:max-h-20 [&>svg]:w-auto"
                            dangerouslySetInnerHTML={{ __html: c.svg_depiction }}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* CATEGORY: CALCULATED PROPERTIES */}
                <tr className="bg-emerald-50/40">
                  <td
                    colSpan={results.length + 1}
                    className="px-4 py-2 font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5"
                  >
                    <Binary className="h-3 w-3 text-emerald-700" />
                    <span>Calculated Molecular Descriptors (RDKit)</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    Molecular Formula
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono font-bold text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.molecular_formula}
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    Molecular Weight (MW)
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.molecular_weight.toFixed(2)}{" "}
                      <span className="text-[10px] text-slate-400">g/mol</span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    Exact Molecular Mass
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-700 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.exact_mass.toFixed(4)}{" "}
                      <span className="text-[10px] text-slate-400">Da</span>
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    <div>
                      <span>RDKit Crippen cLogP</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Wildman-Crippen atom contributions
                      </span>
                    </div>
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono font-bold text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.rdkit_crippen_clogp.toFixed(2)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    Topological Polar Surface Area (TPSA)
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.tpsa.toFixed(2)}{" "}
                      <span className="text-[10px] text-slate-400">Å²</span>
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    H-Bond Donors (HBD)
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.hbd}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    H-Bond Acceptors (HBA)
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.hba}
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    Rotatable Bonds
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.rotatable_bonds}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    Molar Refractivity (MR)
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-800 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.molar_refractivity.toFixed(2)}{" "}
                      <span className="text-[10px] text-slate-400">cm³/mol</span>
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    Heavy / Total Atom Count
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-700 border-r border-slate-100 last:border-r-0">
                      {c.calculated_properties.heavy_atom_count} /{" "}
                      {c.calculated_properties.total_atom_count}
                    </td>
                  ))}
                </tr>

                {/* CATEGORY: SKIN PERMEABILITY PREDICTION */}
                <tr className="bg-teal-50/50">
                  <td
                    colSpan={results.length + 1}
                    className="px-4 py-2 font-bold text-teal-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5"
                  >
                    <Droplet className="h-3 w-3 text-teal-700" />
                    <span>Predicted Skin Permeability (Potts–Guy Model 1992)</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    <div>
                      <span>log Kp</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        log10(Kp in cm/h)
                      </span>
                    </div>
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-100 last:border-r-0">
                      {c.skin_permeability_prediction.log_kp.toFixed(2)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    <div>
                      <span>Permeability Coeff (Kp)</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Primary model output in cm/h
                      </span>
                    </div>
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-emerald-800 font-bold border-r border-slate-100 last:border-r-0">
                      {c.skin_permeability_prediction.kp_cm_h.toExponential(2)}{" "}
                      <span className="text-[10px] text-slate-500 font-normal">cm/h</span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    <div>
                      <span>Converted Kp (cm/s)</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Secondary converted unit (cm/h ÷ 3600)
                      </span>
                    </div>
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 font-mono text-slate-600 border-r border-slate-100 last:border-r-0">
                      {c.skin_permeability_prediction.kp_cm_s.toExponential(2)}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">cm/s</span>
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    Permeability Classification
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 border-r border-slate-100 last:border-r-0">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${getPermeabilityBadge(
                          c.skin_permeability_prediction.permeability_class
                        )}`}
                      >
                        {c.skin_permeability_prediction.permeability_class}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    Applicability Domain
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 border-r border-slate-100 last:border-r-0">
                      {c.skin_permeability_prediction.in_applicability_domain ? (
                        <span className="text-emerald-700 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Within Bounds</span>
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-amber-700 font-semibold flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            <span>Out of Domain</span>
                          </span>
                          {c.skin_permeability_prediction.domain_warnings.map((w, idx) => (
                            <p key={idx} className="text-[10px] text-amber-800 leading-tight">
                              • {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* CATEGORY: DRUG-LIKENESS ASSESSMENTS */}
                <tr className="bg-emerald-50/40">
                  <td
                    colSpan={results.length + 1}
                    className="px-4 py-2 font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-700" />
                    <span>Drug-Likeness Rules (Oral Bioavailability Benchmarks)</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200/80">
                    <div>
                      <span>Lipinski Rule of 5</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Max 1 violation permitted
                      </span>
                    </div>
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 border-r border-slate-100 last:border-r-0">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            c.druglikeness_assessment.lipinski.passed
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {c.druglikeness_assessment.lipinski.passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pass</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              <span>Fail</span>
                            </>
                          )}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {c.druglikeness_assessment.lipinski.violations_count} violation(s)
                        </span>
                        {c.druglikeness_assessment.lipinski.violations.length > 0 && (
                          <div className="text-[10px] text-rose-700 space-y-0.5 pt-0.5">
                            {c.druglikeness_assessment.lipinski.violations.map((v, idx) => (
                              <p key={idx}>• {v}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-semibold text-slate-600 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-200/80">
                    <div>
                      <span>Ghose Filter</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        0 violations permitted
                      </span>
                    </div>
                  </td>
                  {results.map((c, i) => (
                    <td key={i} className="p-3.5 border-r border-slate-100 last:border-r-0">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            c.druglikeness_assessment.ghose.passed
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {c.druglikeness_assessment.ghose.passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pass</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              <span>Fail</span>
                            </>
                          )}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {c.druglikeness_assessment.ghose.violations_count} violation(s)
                        </span>
                        {c.druglikeness_assessment.ghose.violations.length > 0 && (
                          <div className="text-[10px] text-rose-700 space-y-0.5 pt-0.5">
                            {c.druglikeness_assessment.ghose.violations.map((v, idx) => (
                              <p key={idx}>• {v}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scientific Disclaimer Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-start space-x-2">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong>Scientific Integrity Notice:</strong> All values are calculated directly using RDKit algorithms and the Potts–Guy empirical equation (1992). Passing oral bioavailability filters (Lipinski / Ghose) or exhibiting favorable transdermal diffusion predictions <em>does not demonstrate cosmetic safety, non-irritancy, or lack of dermal sensitization.</em>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <GitCompare className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            No Comparison Analyzed Yet
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Enter valid SMILES strings for at least two chemical compounds above or pick a sample preset to contrast molecular descriptors and skin permeability side by side.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => handleApplyPreset(PRESET_COMPARISONS[0])}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Load Niacinamide vs. Salicylic Acid
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

