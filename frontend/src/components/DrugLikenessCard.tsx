"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { DrugLikenessResponse, DrugLikenessRuleResult } from "@/lib/types";

interface DrugLikenessCardProps {
  assessment: DrugLikenessResponse;
}

const RuleResultBlock: React.FC<{ result: DrugLikenessRuleResult }> = ({ result }) => {
  return (
    <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">{result.name}</h4>
            <span className="text-[11px] text-slate-500">
              Max violations allowed: {result.max_violations_allowed}
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
              result.passed
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {result.passed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Pass ({result.violations_count} viol.)</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>Fail ({result.violations_count} viol.)</span>
              </>
            )}
          </span>
        </div>

        {/* Detailed Criteria List */}
        <div className="space-y-2">
          {result.details.map((detail) => (
            <div
              key={detail.property_name}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                detail.passed
                  ? "bg-white border-slate-200/70 text-slate-700"
                  : "bg-rose-50/60 border-rose-200 text-rose-900"
              }`}
            >
              <div className="space-y-0.5">
                <span className="font-semibold block">{detail.property_name}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {detail.criterion}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold block">{detail.value.toFixed(2)}</span>
                <span
                  className={`text-[10px] font-semibold uppercase ${
                    detail.passed ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {detail.passed ? "Satisfied" : "Violated"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations explanation */}
      {result.violations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-rose-700 space-y-1">
          <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-800">
            Violation Explanations:
          </span>
          {result.violations.map((v, i) => (
            <p key={i} className="text-xs bg-rose-50/80 p-1.5 rounded border border-rose-200/60">
              • {v}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const DrugLikenessCard: React.FC<DrugLikenessCardProps> = ({ assessment }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Drug-Likeness Rules Assessment</h3>
            <p className="text-xs text-slate-500">Bioavailability benchmarks: Lipinski Rule of 5 and Ghose Filter</p>
          </div>
        </div>
      </div>

      {/* Lipinski and Ghose Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RuleResultBlock result={assessment.lipinski} />
        <RuleResultBlock result={assessment.ghose} />
      </div>

      {/* Critical Scientific Safety Warning */}
      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start space-x-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900 block mb-0.5">Scientific Integrity Notice:</span>
          <p className="text-amber-900 leading-relaxed">{assessment.scientific_disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

