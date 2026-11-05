"use client";

import React from "react";
import { Binary, HelpCircle, CheckCircle } from "lucide-react";
import { CalculatedProperties } from "@/lib/types";

interface CalculatedPropertiesCardProps {
  properties: CalculatedProperties;
}

interface DescriptorItem {
  label: string;
  value: string | number;
  unit?: string;
  description: string;
  isImportant?: boolean;
}

export const CalculatedPropertiesCard: React.FC<CalculatedPropertiesCardProps> = ({ properties }) => {
  const descriptors: DescriptorItem[] = [
    {
      label: "Molecular Weight (MW)",
      value: properties.molecular_weight.toFixed(2),
      unit: "g/mol",
      description: "Sum of standard atomic weights of all constituent atoms. Used in Potts-Guy equation.",
      isImportant: true,
    },
    {
      label: "Exact Molecular Mass",
      value: properties.exact_mass.toFixed(4),
      unit: "Da",
      description: "Monoisotopic mass calculated using the most abundant natural isotope of each element.",
    },
    {
      label: "RDKit Crippen cLogP",
      value: properties.rdkit_crippen_clogp.toFixed(2),
      unit: "log units",
      description: "1-Octanol/water partition coefficient computed via Wildman-Crippen atom contributions. (Not SwissADME consensus LogP).",
      isImportant: true,
    },
    {
      label: "Topological Polar Surface Area (TPSA)",
      value: properties.tpsa.toFixed(2),
      unit: "Å²",
      description: "Sum of polar atomic surface contributions (oxygen, nitrogen, and attached hydrogens).",
      isImportant: true,
    },
    {
      label: "H-Bond Donors (HBD)",
      value: properties.hbd,
      description: "Count of hydrogen bond donor atoms (Lipinski definition: OH and NH groups).",
    },
    {
      label: "H-Bond Acceptors (HBA)",
      value: properties.hba,
      description: "Count of hydrogen bond acceptor atoms (Lipinski definition: Nitrogen and Oxygen atoms).",
    },
    {
      label: "Rotatable Bonds",
      value: properties.rotatable_bonds,
      description: "Number of single non-ring rotatable bonds bounded to non-hydrogen atoms.",
    },
    {
      label: "Molar Refractivity (MR)",
      value: properties.molar_refractivity.toFixed(2),
      unit: "cm³/mol",
      description: "Crippen molar refractivity measuring total polarizability of the mole.",
    },
    {
      label: "Heavy Atom Count",
      value: properties.heavy_atom_count,
      description: "Total number of non-hydrogen heavy atoms in the molecule.",
    },
    {
      label: "Total Atom Count",
      value: properties.total_atom_count,
      description: "Sum of all atoms including implicit hydrogens.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
      {/* Header with Calculated Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Binary className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Calculated Molecular Descriptors</h3>
            <p className="text-xs text-slate-500">Deterministic RDKit topological & physicochemical calculations</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[11px] font-semibold">
          <CheckCircle className="h-3 w-3 text-emerald-600" />
          <span>Strictly Calculated (RDKit)</span>
        </div>
      </div>

      {/* Descriptors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        {descriptors.map((item) => (
          <div
            key={item.label}
            className={`p-3.5 rounded-xl border transition-all ${
              item.isImportant
                ? "bg-slate-50/80 border-slate-200/90 hover:border-emerald-300"
                : "bg-white border-slate-100 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium truncate pr-1" title={item.label}>
                {item.label}
              </span>
              <span title={item.description} className="cursor-help text-slate-400 hover:text-slate-600">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-lg font-bold font-mono text-slate-800 tracking-tight">
                {item.value}
              </span>
              {item.unit && (
                <span className="text-xs font-sans text-slate-500 font-medium">
                  {item.unit}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1" title={item.description}>
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* cLogP Scientific Distinction Note */}
      <div className="mt-4 p-3 bg-slate-50/90 border border-slate-200/70 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
        <span className="font-semibold text-slate-700 shrink-0">Note:</span>
        <span>
          cLogP is calculated via RDKit Wildman-Crippen atom contributions. It should not be labeled or confused
          with SwissADME consensus LogP, which is an average of 5 distinct predictive models.
        </span>
      </div>
    </div>
  );
};

