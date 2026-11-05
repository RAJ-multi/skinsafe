"""
Drug-Likeness Rules Assessment Module.
Evaluates Lipinski Rule of 5 and Ghose Filter with granular condition checks and violation descriptions.
"""

from typing import Dict, Any, List


class DrugLikenessEvaluator:
    """Evaluates small-molecule drug-likeness rules with transparent violation reasoning."""

    SCIENTIFIC_DISCLAIMER = (
        "Drug-likeness filters (such as Lipinski's Rule of 5 and Ghose filter) assess oral "
        "bioavailability and pharmacokinetic suitability for therapeutic drug candidates. "
        "A passing result DOES NOT demonstrate or imply cosmetic safety, lack of skin irritation, "
        "or non-sensitizing biocompatibility."
    )

    @classmethod
    def evaluate_lipinski(cls, descriptors: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate Lipinski's Rule of Five.
        Criteria:
        - Molecular Weight <= 500 g/mol
        - Crippen cLogP <= 5.0
        - Hydrogen Bond Donors (HBD) <= 5
        - Hydrogen Bond Acceptors (HBA) <= 10
        Rule pass condition: <= 1 violation allowed.
        """
        mw = descriptors["molecular_weight"]
        clogp = descriptors["rdkit_crippen_clogp"]
        hbd = descriptors["hbd"]
        hba = descriptors["hba"]

        rules = [
            {
                "property_name": "Molecular Weight",
                "value": mw,
                "criterion": "MW <= 500 Da",
                "passed": mw <= 500.0,
                "violation": f"Molecular weight ({mw:.2f} Da) exceeds 500 Da threshold" if mw > 500.0 else None,
            },
            {
                "property_name": "RDKit Crippen cLogP",
                "value": clogp,
                "criterion": "cLogP <= 5.0",
                "passed": clogp <= 5.0,
                "violation": f"Crippen cLogP ({clogp:.2f}) exceeds 5.0 threshold" if clogp > 5.0 else None,
            },
            {
                "property_name": "Hydrogen Bond Donors",
                "value": hbd,
                "criterion": "HBD <= 5",
                "passed": hbd <= 5,
                "violation": f"Hydrogen bond donors ({hbd}) exceed maximum of 5" if hbd > 5 else None,
            },
            {
                "property_name": "Hydrogen Bond Acceptors",
                "value": hba,
                "criterion": "HBA <= 10",
                "passed": hba <= 10,
                "violation": f"Hydrogen bond acceptors ({hba}) exceed maximum of 10" if hba > 10 else None,
            },
        ]

        violations = [r["violation"] for r in rules if not r["passed"] and r["violation"] is not None]
        violations_count = len(violations)
        passed = violations_count <= 1

        return {
            "name": "Lipinski Rule of Five",
            "passed": passed,
            "violations_count": violations_count,
            "max_violations_allowed": 1,
            "violations": violations,
            "details": rules,
        }

    @classmethod
    def evaluate_ghose(cls, descriptors: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the Ghose Filter (Ghose et al., 1999).
        Criteria:
        - 160 <= Molecular Weight <= 480 g/mol
        - -0.4 <= Crippen cLogP <= 5.6
        - 40 <= Molar Refractivity <= 130 cm³/mol
        - 20 <= Total Atom Count <= 70
        Rule pass condition: 0 violations.
        """
        mw = descriptors["molecular_weight"]
        clogp = descriptors["rdkit_crippen_clogp"]
        mr = descriptors["molar_refractivity"]
        atom_count = descriptors.get("total_atom_count", descriptors.get("heavy_atom_count", 0))

        rules = [
            {
                "property_name": "Molecular Weight",
                "value": mw,
                "criterion": "160 <= MW <= 480 Da",
                "passed": 160.0 <= mw <= 480.0,
                "violation": (
                    f"Molecular weight ({mw:.2f} Da) is below minimum 160 Da"
                    if mw < 160.0
                    else (f"Molecular weight ({mw:.2f} Da) exceeds maximum 480 Da" if mw > 480.0 else None)
                ),
            },
            {
                "property_name": "RDKit Crippen cLogP",
                "value": clogp,
                "criterion": "-0.4 <= cLogP <= 5.6",
                "passed": -0.4 <= clogp <= 5.6,
                "violation": (
                    f"Crippen cLogP ({clogp:.2f}) is below minimum -0.4"
                    if clogp < -0.4
                    else (f"Crippen cLogP ({clogp:.2f}) exceeds maximum 5.6" if clogp > 5.6 else None)
                ),
            },
            {
                "property_name": "Molar Refractivity",
                "value": mr,
                "criterion": "40 <= MR <= 130",
                "passed": 40.0 <= mr <= 130.0,
                "violation": (
                    f"Molar refractivity ({mr:.2f}) is below minimum 40"
                    if mr < 40.0
                    else (f"Molar refractivity ({mr:.2f}) exceeds maximum 130" if mr > 130.0 else None)
                ),
            },
            {
                "property_name": "Total Atom Count",
                "value": atom_count,
                "criterion": "20 <= Total Atoms <= 70",
                "passed": 20 <= atom_count <= 70,
                "violation": (
                    f"Total atom count ({atom_count}) is below minimum 20"
                    if atom_count < 20
                    else (f"Total atom count ({atom_count}) exceeds maximum 70" if atom_count > 70 else None)
                ),
            },
        ]

        violations = [r["violation"] for r in rules if not r["passed"] and r["violation"] is not None]
        violations_count = len(violations)
        passed = violations_count == 0

        return {
            "name": "Ghose Filter",
            "passed": passed,
            "violations_count": violations_count,
            "max_violations_allowed": 0,
            "violations": violations,
            "details": rules,
        }

    @classmethod
    def evaluate_all(cls, descriptors: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive drug-likeness assessment."""
        lipinski = cls.evaluate_lipinski(descriptors)
        ghose = cls.evaluate_ghose(descriptors)

        return {
            "lipinski": lipinski,
            "ghose": ghose,
            "scientific_disclaimer": cls.SCIENTIFIC_DISCLAIMER,
        }

