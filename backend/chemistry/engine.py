"""
Unified Computational Chemistry Engine.
Orchestrates SMILES parsing, validation, descriptors calculation, drug-likeness assessments,
and permeability prediction.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
from rdkit import Chem

from .descriptors import MolecularDescriptorsCalculator
from .druglikeness import DrugLikenessEvaluator
from .permeability import PottsGuyPermeabilityModel


class ChemistryValidationError(Exception):
    """Raised when chemical structure input fails validation or parsing."""
    pass


@dataclass
class ChemistryAnalysisResult:
    """Structured container for complete computational chemistry results."""
    input_smiles: str
    canonical_smiles: str
    calculated_properties: Dict[str, Any]
    druglikeness_assessment: Dict[str, Any]
    skin_permeability_prediction: Dict[str, Any]
    svg_depiction: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_smiles": self.input_smiles,
            "canonical_smiles": self.canonical_smiles,
            "calculated_properties": self.calculated_properties,
            "druglikeness_assessment": self.druglikeness_assessment,
            "skin_permeability_prediction": self.skin_permeability_prediction,
            "svg_depiction": self.svg_depiction,
        }


class ChemistryEngine:
    """Main computational chemistry service facade."""

    @classmethod
    def parse_smiles(cls, smiles: str) -> Chem.Mol:
        """
        Validate and parse a SMILES string into a sanitized RDKit Mol object.

        Raises:
            ChemistryValidationError: If the string is empty, malformed, or has valence errors.
        """
        if not smiles or not smiles.strip():
            raise ChemistryValidationError("SMILES string cannot be empty or solely whitespace.")

        clean_smiles = smiles.strip()

        # Attempt parsing with sanitization enabled
        mol = Chem.MolFromSmiles(clean_smiles, sanitize=True)

        if mol is None:
            # Try parsing without sanitization to identify specific chemical defects
            raw_mol = Chem.MolFromSmiles(clean_smiles, sanitize=False)
            if raw_mol is None:
                raise ChemistryValidationError(
                    f"Syntax error: '{clean_smiles}' is not a syntactically valid SMILES string. "
                    "Please check atom symbols, ring closures, and parentheses."
                )
            else:
                try:
                    Chem.SanitizeMol(raw_mol)
                except Exception as err:
                    raise ChemistryValidationError(
                        f"Chemical sanitization failed for SMILES '{clean_smiles}': {str(err)}. "
                        "Check atomic valences, aromaticity, or charge states."
                    )
                mol = raw_mol

        return mol

    @classmethod
    def analyze(cls, smiles: str) -> ChemistryAnalysisResult:
        """
        Perform complete, scientifically rigorous computational analysis.

        Parameters:
            smiles: str - Input SMILES representation of the molecule.

        Returns:
            ChemistryAnalysisResult with calculated properties, drug-likeness rules, and permeability prediction.
        """
        mol = cls.parse_smiles(smiles)

        # Generate canonical SMILES for standardized representation
        canonical_smiles = Chem.MolToSmiles(mol, canonical=True)

        # 1. Calculated properties
        descriptors = MolecularDescriptorsCalculator.calculate_descriptors(mol)

        # 2. Drug-likeness assessments (Lipinski + Ghose)
        druglikeness = DrugLikenessEvaluator.evaluate_all(descriptors)

        # 3. Model prediction (Potts-Guy skin permeability)
        permeability = PottsGuyPermeabilityModel.predict(
            clogp=descriptors["rdkit_crippen_clogp"],
            mw=descriptors["molecular_weight"],
        )

        # 4. 2D vector depiction
        svg = MolecularDescriptorsCalculator.generate_svg_depiction(mol)

        return ChemistryAnalysisResult(
            input_smiles=smiles.strip(),
            canonical_smiles=canonical_smiles,
            calculated_properties=descriptors,
            druglikeness_assessment=druglikeness,
            skin_permeability_prediction=permeability,
            svg_depiction=svg,
        )

