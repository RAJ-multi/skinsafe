"""
Skin Permeability Prediction Module.
Implements the Potts-Guy empirical QSPR model (Potts & Guy, 1992) for estimating
passive transdermal diffusion across human stratum corneum.
"""

import math
from typing import Dict, Any, List


class PottsGuyPermeabilityModel:
    """
    Empirical quantitative structure-property relationship (QSPR) model
    developed by Potts and Guy (1992).

    Equation:
        log Kp = -2.72 + 0.71 * (logP) - 0.0061 * (MW)

    Where:
        - logP: RDKit Crippen cLogP
        - MW: Average Molecular Weight in g/mol
        - log Kp: Base-10 logarithm of predicted skin permeability coefficient in cm/h
                  (derived from Flynn's 1990 database compilation where Kp is in cm/h)
        - Kp (cm/h): 10^(log Kp)
        - Kp (cm/s): Kp (cm/h) / 3600
    """

    MODEL_NAME = "Potts–Guy Empirical Equation (1992)"
    EQUATION = "log Kp (cm/h) = -2.72 + 0.71(cLogP) - 0.0061(MW)"
    REFERENCE = (
        "Potts, R. O., & Guy, R. H. (1992). Predicting skin permeability via a simple equation. "
        "Pharmaceutical Research, 9(5), 663-669."
    )
    PREDICTION_DISCLAIMER = (
        "This value is a statistical model prediction of passive diffusion across in vitro human "
        "stratum corneum from an aqueous vehicle based on the Potts-Guy (1992) equation (derived from "
        "the Flynn 1990 dataset in cm/h). It is NOT an experimentally measured value. "
        "The model does NOT account for vehicle composition, skin binding, follicular pathways, "
        "physiological pH ionization changes, epidermal metabolic clearance, or formulation enhancers."
    )

    @classmethod
    def predict(cls, clogp: float, mw: float) -> Dict[str, Any]:
        """
        Calculate predicted transdermal permeability coefficient.

        Parameters:
            clogp: float - RDKit Crippen cLogP
            mw: float - Average molecular weight in g/mol

        Returns:
            Dict containing log Kp (cm/h), Kp (cm/h), Kp (cm/s), classification, and applicability flags.
        """
        # Potts-Guy linear regression equation (Flynn 1990 dataset baseline in cm/h)
        log_kp = -2.72 + (0.71 * clogp) - (0.0061 * mw)
        kp_cm_h = math.pow(10, log_kp)
        kp_cm_s = kp_cm_h / 3600.0

        # Permeability classification based on standard transdermal literature (cm/h scale):
        # High: log Kp >= -2.0 (Kp >= 0.01 cm/h)
        # Moderate: -4.0 <= log Kp < -2.0 (0.0001 <= Kp < 0.01 cm/h)
        # Low: log Kp < -4.0 (Kp < 0.0001 cm/h)
        if log_kp >= -2.0:
            classification = "High"
            classification_description = (
                "Compound possesses physicochemical traits favoring rapid passive stratum corneum diffusion "
                "(typically low MW and moderate-to-high lipophilicity)."
            )
        elif log_kp >= -4.0:
            classification = "Moderate"
            classification_description = (
                "Compound exhibits intermediate transdermal permeation kinetics under passive aqueous conditions."
            )
        else:
            classification = "Low"
            classification_description = (
                "Compound exhibits low passive stratum corneum permeation, typical of high-MW or strongly hydrophilic solutes."
            )

        # Applicability domain assessment (training set boundaries: MW < 500 Da, -1.0 <= cLogP <= 4.5)
        domain_warnings: List[str] = []
        in_domain = True

        if mw > 500.0:
            in_domain = False
            domain_warnings.append(
                f"Molecular weight ({mw:.1f} Da) exceeds the typical 500 Da applicability threshold for the Potts-Guy model."
            )

        if clogp < -1.0 or clogp > 4.5:
            in_domain = False
            domain_warnings.append(
                f"Crippen cLogP ({clogp:.2f}) lies outside the optimal empirical calibration domain (-1.0 to 4.5)."
            )

        return {
            "model_name": cls.MODEL_NAME,
            "equation": cls.EQUATION,
            "reference": cls.REFERENCE,
            "log_kp": round(log_kp, 3),
            "kp_cm_h": float(f"{kp_cm_h:.3e}"),
            "kp_cm_s": float(f"{kp_cm_s:.3e}"),
            "permeability_class": classification,
            "permeability_description": classification_description,
            "in_applicability_domain": in_domain,
            "domain_warnings": domain_warnings,
            "prediction_disclaimer": cls.PREDICTION_DISCLAIMER,
        }

