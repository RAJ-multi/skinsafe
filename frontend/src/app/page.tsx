"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SmilesInputForm } from "@/components/SmilesInputForm";
import { MolecularDepiction } from "@/components/MolecularDepiction";
import { CalculatedPropertiesCard } from "@/components/CalculatedPropertiesCard";
import { DrugLikenessCard } from "@/components/DrugLikenessCard";
import { SkinPermeabilityCard } from "@/components/SkinPermeabilityCard";
import { IngredientComparisonLab } from "@/components/IngredientComparisonLab";
import { MethodologyModal } from "@/components/MethodologyModal";
import { AiAssistant } from "@/components/AiAssistant";
import {
  MolecularAnalysisResult,
  HealthStatus,
  ApiErrorDetail,
  CompareCompoundsResponse,
} from "@/lib/types";
import {
  analyzeSmiles,
  checkBackendHealth,
  ApiError,
  API_BASE_URL,
} from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"single" | "compare">("single");
  const [analysis, setAnalysis] = useState<MolecularAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiErrorDetail | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [compareResults, setCompareResults] = useState<CompareCompoundsResponse | null>(null);

  // Poll/Check backend health on initial load
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setHealthStatus(health);

      // Default benchmark: calculate Niacinamide on initial mount
      try {
        setIsLoading(true);
        const defaultResult = await analyzeSmiles("NC(=O)c1cccnc1");
        setAnalysis(defaultResult);
      } catch (err) {
        // If backend is not yet started, fail quietly without blocking UI
        console.warn("Initial calculation deferred: backend may be offline.", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleAnalyze = async (smiles: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSmiles(smiles);
      setAnalysis(result);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError({
          error_type: "ConnectionError",
          message: `Could not connect to the SkinSafe backend at ${API_BASE_URL}. Please verify that the API server is online and accessible.`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        healthStatus={healthStatus}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === "compare" ? (
          <IngredientComparisonLab
            onBackToSingle={() => setActiveTab("single")}
            onResultsChange={setCompareResults}
          />
        ) : (
          <>
            {/* Intro banner */}
            <div className="text-center max-w-3xl mx-auto space-y-2 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Cosmetic Ingredient & Skin Permeability Analysis
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real-time RDKit molecular descriptor calculations, drug-likeness rule assessments,
                and Potts–Guy empirical transdermal permeability modeling for cosmetic chemists and skincare researchers.
              </p>
            </div>

            {/* Input & 2D Structure Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7">
                <SmilesInputForm
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  error={error}
                  onClearError={() => setError(null)}
                />
              </div>
              <div className="lg:col-span-5">
                {analysis ? (
                  <MolecularDepiction
                    svgContent={analysis.svg_depiction}
                    formula={analysis.calculated_properties.molecular_formula}
                    canonicalSmiles={analysis.canonical_smiles}
                    inputSmiles={analysis.input_smiles}
                  />
                ) : (
                  <div className="h-full min-h-[180px] bg-white rounded-2xl border border-slate-200/80 p-6 flex items-center justify-center text-slate-400 text-xs text-center">
                    Submit a SMILES string to render the 2D chemical structure.
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Results View */}
            {analysis && (
              <div className="space-y-6 pt-2 animate-fadeIn">
                {/* Calculated Properties */}
                <CalculatedPropertiesCard properties={analysis.calculated_properties} />

                {/* Skin Permeability Prediction */}
                <SkinPermeabilityCard prediction={analysis.skin_permeability_prediction} />

                {/* Drug-Likeness Assessment */}
                <DrugLikenessCard assessment={analysis.druglikeness_assessment} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">SkinSafe Computational Chemistry Platform</p>
          <p>
            Powered by RDKit • Potts–Guy Skin Permeability Model (1992) • Lipinski Rule of 5 • Ghose Filter
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Disclaimer: Predictions are generated by statistical empirical models for scientific exploration. Not for clinical or diagnostic use.
          </p>
        </div>
      </footer>

      {/* Scientific Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Floating AI Assistant */}
      <AiAssistant
        analysis={activeTab === "single" ? analysis : null}
        compareResults={activeTab === "compare" ? compareResults : null}
      />
    </div>
  );
}

