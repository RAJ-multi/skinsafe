"use client";

import React from "react";
import { Droplet, AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react";
import { SkinPermeabilityPrediction } from "@/lib/types";

interface SkinPermeabilityCardProps {
  prediction: SkinPermeabilityPrediction;
}

export const SkinPermeabilityCard: React.FC<SkinPermeabilityCardProps> = ({ prediction }) => {
  const getBadgeClass = (category: string) => {
    switch (category) {
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
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Droplet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Skin Permeability Prediction</h3>
            <p className="text-xs text-slate-500">Potts–Guy empirical stratum corneum diffusion model (1992)</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-full text-[11px] font-semibold">
          <Info className="h-3 w-3 text-amber-600" />
          <span>Model Prediction (QSPR)</span>
        </div>
      </div>

      {/* Main Prediction Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* log Kp (cm/h) */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            log Kp (cm/h)
          </span>
          <div className="my-2">
            <span className="text-2xl font-black font-mono text-slate-800 tracking-tight">
              {prediction.log_kp.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Base-10 log of Potts–Guy coefficient (cm/h)
          </span>
        </div>

        {/* Kp in cm/h and cm/s */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Permeability Coeff (Kp)
          </span>
          <div className="my-2">
            <span className="text-xl font-bold font-mono text-emerald-700">
              {prediction.kp_cm_h.toExponential(2)}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">cm/h</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            = {prediction.kp_cm_s.toExponential(2)} cm/s
          </span>
        </div>

        {/* Classification */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Predicted Permeability Class
          </span>
          <div className="my-2">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${getBadgeClass(
                prediction.permeability_class
              )}`}
            >
              {prediction.permeability_class} Permeability
            </span>
          </div>
          <span className="text-[11px] text-slate-500 line-clamp-1" title={prediction.permeability_description}>
            {prediction.permeability_description}
          </span>
        </div>
      </div>

      {/* Equation display */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-700 gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-500 font-sans">Model Formula:</span>
          <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-bold text-slate-800">
            {prediction.equation}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-sans italic">
          Potts & Guy, Pharm Res. 1992
        </span>
      </div>

      {/* Applicability domain status */}
      {!prediction.in_applicability_domain && prediction.domain_warnings.length > 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
          <div className="flex items-center space-x-2 font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Outside Model Applicability Domain</span>
          </div>
          {prediction.domain_warnings.map((warning, idx) => (
            <p key={idx} className="text-rose-700 pl-6">
              • {warning}
            </p>
          ))}
        </div>
      )}

      {/* Model Disclaimer */}
      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start space-x-2.5">
        <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">{prediction.prediction_disclaimer}</p>
      </div>
    </div>
  );
};

