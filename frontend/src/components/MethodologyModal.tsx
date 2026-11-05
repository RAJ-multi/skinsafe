"use client";

import React from "react";
import { X, BookOpen, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">SkinSafe Scientific Methodology</h2>
              <p className="text-xs text-slate-500">Definitions, Models, and Domain Applicability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Scientific Categorization */}
          <section className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <h3 className="font-semibold text-emerald-900 text-sm mb-2 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Calculated Properties vs. Model Predictions</span>
            </h3>
            <p className="text-xs text-emerald-950">
              SkinSafe strictly separates <strong>Calculated Properties</strong> (derived directly from the molecular graph
              using deterministic RDKit algorithms) from <strong>Model Predictions</strong> (empirical regressions like the
              Potts-Guy transdermal model). Predicted values represent statistical estimates subject to model error.
            </p>
          </section>

          {/* Potts-Guy Equation */}
          <section className="space-y-2">
            <h3 className="font-semibold text-slate-900">1. Skin Permeability (Potts–Guy Equation, 1992)</h3>
            <p className="text-xs text-slate-600">
              The primary model for estimating passive stratum corneum permeation from aqueous solution is the empirical linear
              free-energy relationship developed by Potts and Guy:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-center text-slate-800 font-semibold">
              log Kp (cm/h) = -2.72 + 0.71(cLogP) - 0.0061(MW)
            </div>
            <ul className="text-xs list-disc list-inside space-y-1 text-slate-600">
              <li><strong>cLogP</strong>: Calculated partition coefficient using RDKit Crippen atom-contribution method.</li>
              <li><strong>MW</strong>: Average molecular weight in g/mol.</li>
              <li><strong>log Kp</strong>: Base-10 logarithm of the permeability coefficient in <strong>cm/h</strong> (derived from Flynn&apos;s 1990 database compilation).</li>
              <li><strong>Kp (cm/h)</strong>: 10^(log Kp).</li>
              <li><strong>Kp (cm/s)</strong>: Calculated as Kp (cm/h) / 3600.</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Model Limitations:</strong> Potts-Guy models passive aqueous diffusion across in vitro human stratum
                corneum. It does not account for complex cosmetic vehicle matrices (emulsions, glycols, oils), physiological
                skin pH ionization, metabolic clearance, or transdermal penetration enhancers.
              </div>
            </div>
          </section>

          {/* RDKit Crippen cLogP vs Consensus LogP */}
          <section className="space-y-2">
            <h3 className="font-semibold text-slate-900">2. RDKit Crippen cLogP</h3>
            <p className="text-xs text-slate-600">
              SkinSafe calculates <strong>RDKit Crippen cLogP</strong> based on Wildman and Crippen&apos;s atom-additive method
              (1999). This is scientifically distinct from SwissADME Consensus LogP, which computes an average across five
              different predictive methods (XLOGP3, WLOGP, MLOGP, SILICOS-IT, and iLOGP).
            </p>
          </section>

          {/* Drug-Likeness Rules vs Safety */}
          <section className="space-y-2">
            <h3 className="font-semibold text-slate-900">3. Drug-Likeness Criteria (Lipinski & Ghose)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-1">Lipinski&apos;s Rule of Five</span>
                <ul className="space-y-1 text-slate-600">
                  <li>• MW ≤ 500 Da</li>
                  <li>• cLogP ≤ 5.0</li>
                  <li>• Hydrogen Bond Donors ≤ 5</li>
                  <li>• Hydrogen Bond Acceptors ≤ 10</li>
                  <li>• Max 1 violation permitted</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-1">Ghose Filter</span>
                <ul className="space-y-1 text-slate-600">
                  <li>• 160 ≤ MW ≤ 480 Da</li>
                  <li>• -0.4 ≤ cLogP ≤ 5.6</li>
                  <li>• 40 ≤ Molar Refractivity ≤ 130</li>
                  <li>• 20 ≤ Total Atoms ≤ 70</li>
                  <li>• 0 violations permitted</li>
                </ul>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 flex items-start space-x-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Critical Integrity Warning:</strong> Lipinski and Ghose rules evaluate small-molecule oral drug
                bioavailability. <em>Passing these rules DOES NOT indicate that an ingredient is non-irritating, non-toxic, or safe for cosmetic topical application.</em>
              </div>
            </div>
          </section>

          {/* References */}
          <section className="border-t border-slate-100 pt-4 space-y-1.5 text-xs text-slate-500">
            <h4 className="font-semibold text-slate-700">Scientific References</h4>
            <p>1. Potts RO, Guy RH. Predicting skin permeability via a simple equation. <em>Pharm Res</em>. 1992;9(5):663-669.</p>
            <p>2. Lipinski CA, Lombardo F, Dominy BW, Feeney PJ. Experimental and computational approaches. <em>Adv Drug Deliv Rev</em>. 1997;23:3-25.</p>
            <p>3. Ghose AK, Viswanadhan VN, Wendoloski JJ. Qualifying active compounds. <em>J Comb Chem</em>. 1999;1(1):55-68.</p>
            <p>4. Wildman SA, Crippen GM. Prediction of Physicochemical Parameters. <em>J Chem Inf Comput Sci</em>. 1999;39(5):868-873.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Methodology
          </button>
        </div>
      </div>
    </div>
  );
};

