"""
Pydantic Schemas for SkinSafe API.
Enforces strict typing and scientific metadata separation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeSmilesRequest(BaseModel):
    smiles: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="SMILES representation of the cosmetic compound or molecule.",
        examples=["NC(=O)c1cccnc1"],
    )


class CalculatedPropertiesResponse(BaseModel):
    molecular_formula: str = Field(..., description="Elemental chemical formula (Hill notation)")
    molecular_weight: float = Field(..., description="Average molecular weight in g/mol")
    exact_mass: float = Field(..., description="Monoisotopic exact mass in g/mol")
    rdkit_crippen_clogp: float = Field(
        ..., description="RDKit Crippen cLogP partition coefficient (Wildman-Crippen atom-contribution method)"
    )
    tpsa: float = Field(..., description="Topological polar surface area in Å²")
    hbd: int = Field(..., description="Number of hydrogen bond donors (Lipinski definition)")
    hba: int = Field(..., description="Number of hydrogen bond acceptors (Lipinski definition)")
    rotatable_bonds: int = Field(..., description="Number of rotatable bonds")
    molar_refractivity: float = Field(..., description="Wildman-Crippen molar refractivity in cm³/mol")
    heavy_atom_count: int = Field(..., description="Number of non-hydrogen heavy atoms")
    total_atom_count: int = Field(..., description="Total count of all atoms including hydrogens")


class RuleDetail(BaseModel):
    property_name: str
    value: float
    criterion: str
    passed: bool
    violation: Optional[str] = None


class DrugLikenessRuleResult(BaseModel):
    name: str
    passed: bool
    violations_count: int
    max_violations_allowed: int
    violations: List[str]
    details: List[RuleDetail]


class DrugLikenessResponse(BaseModel):
    lipinski: DrugLikenessRuleResult
    ghose: DrugLikenessRuleResult
    scientific_disclaimer: str = Field(
        ...,
        description="Scientific advisory clarifying that oral bioavailability rules do not indicate cosmetic safety.",
    )


class SkinPermeabilityResponse(BaseModel):
    model_name: str
    equation: str
    reference: str
    log_kp: float = Field(..., description="Common logarithm log10(Kp) with Kp in cm/h as output by Potts-Guy (1992) equation")
    kp_cm_h: float = Field(..., description="Predicted transdermal permeability coefficient in cm/h (10^log_kp)")
    kp_cm_s: float = Field(..., description="Predicted transdermal permeability coefficient in cm/s (kp_cm_h / 3600)")
    permeability_class: str = Field(..., description="High, Moderate, or Low transdermal permeability")
    permeability_description: str
    in_applicability_domain: bool = Field(..., description="True if compound is within empirical training bounds")
    domain_warnings: List[str] = Field(default_factory=list)
    prediction_disclaimer: str = Field(
        ...,
        description="Clear scientific limitation stating this is a statistical model prediction and not experimental flux.",
    )


class MolecularAnalysisResponse(BaseModel):
    input_smiles: str
    canonical_smiles: str
    calculated_properties: CalculatedPropertiesResponse
    druglikeness_assessment: DrugLikenessResponse
    skin_permeability_prediction: SkinPermeabilityResponse
    svg_depiction: Optional[str] = Field(None, description="2D vector graphic representation of the chemical structure")


class CompareCompoundItem(BaseModel):
    name: Optional[str] = Field(
        None,
        description="User-friendly name or cosmetic label for the compound",
        examples=["Niacinamide"],
    )
    smiles: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Valid SMILES string representation",
        examples=["NC(=O)c1cccnc1"],
    )


class CompareCompoundsRequest(BaseModel):
    compounds: List[CompareCompoundItem] = Field(
        ...,
        min_length=2,
        max_length=10,
        description="List of compounds to compare (minimum 2, maximum 10)",
    )


class ComparedCompoundResult(BaseModel):
    name: str
    input_smiles: str
    canonical_smiles: str
    calculated_properties: CalculatedPropertiesResponse
    druglikeness_assessment: DrugLikenessResponse
    skin_permeability_prediction: SkinPermeabilityResponse
    svg_depiction: Optional[str] = None


class CompareCompoundsResponse(BaseModel):
    compounds: List[ComparedCompoundResult]
    comparison_count: int


class HealthResponse(BaseModel):
    status: str
    version: str
    rdkit_version: Optional[str] = None
    engine_ready: bool


# ---------------------------------------------------------------------------
# AI Assistant schemas
# ---------------------------------------------------------------------------

class AssistantChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's question or message to the SkinSafe AI assistant.",
    )
    context: Optional[dict] = Field(
        None,
        description=(
            "Optional structured context from the current analysis or comparison. "
            "May include calculated_properties, skin_permeability_prediction, "
            "druglikeness_assessment, compound names, etc."
        ),
    )


class AssistantChatResponse(BaseModel):
    reply: str = Field(..., description="The AI assistant's response text.")

