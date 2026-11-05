export interface RuleDetail {
  property_name: string;
  value: number;
  criterion: string;
  passed: boolean;
  violation: string | null;
}

export interface DrugLikenessRuleResult {
  name: string;
  passed: boolean;
  violations_count: number;
  max_violations_allowed: number;
  violations: string[];
  details: RuleDetail[];
}

export interface DrugLikenessResponse {
  lipinski: DrugLikenessRuleResult;
  ghose: DrugLikenessRuleResult;
  scientific_disclaimer: string;
}

export interface CalculatedProperties {
  molecular_formula: string;
  molecular_weight: number;
  exact_mass: number;
  rdkit_crippen_clogp: number;
  tpsa: number;
  hbd: number;
  hba: number;
  rotatable_bonds: number;
  molar_refractivity: number;
  heavy_atom_count: number;
  total_atom_count: number;
}

export interface SkinPermeabilityPrediction {
  model_name: string;
  equation: string;
  reference: string;
  log_kp: number;
  kp_cm_s: number;
  kp_cm_h: number;
  permeability_class: "High" | "Moderate" | "Low";
  permeability_description: string;
  in_applicability_domain: boolean;
  domain_warnings: string[];
  prediction_disclaimer: string;
}

export interface MolecularAnalysisResult {
  input_smiles: string;
  canonical_smiles: string;
  calculated_properties: CalculatedProperties;
  druglikeness_assessment: DrugLikenessResponse;
  skin_permeability_prediction: SkinPermeabilityPrediction;
  svg_depiction: string | null;
}

export interface CompareCompoundItem {
  name?: string;
  smiles: string;
}

export interface ComparedCompoundResult extends MolecularAnalysisResult {
  name: string;
}

export interface CompareCompoundsResponse {
  compounds: ComparedCompoundResult[];
  comparison_count: number;
}

export interface ApiErrorDetail {
  error_type: string;
  message: string;
  smiles?: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  rdkit_version?: string;
  engine_ready: boolean;
}

// AI Assistant
export interface AssistantChatResponse {
  reply: string;
}

